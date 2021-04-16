/**
 * Copyright 2021 Google LLC. All Rights Reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
import { firestore } from './firebase';
import { User } from './auth'
import { PriceChangeRemote, SearchResult, TickerChange } from './models';
import { 
    collection, 
    getDocs, 
    doc, 
    setDoc, 
    arrayUnion, 
    arrayRemove, 
    query, 
    where, 
    documentId, 
    QuerySnapshot, 
    getDoc // add this import
} from 'firebase/firestore/lite';
import { logPerformance } from './perf';

export async function search(input: string): Promise<SearchResult[]> {
    if(!input) {
        return [];
    }
    
    const tickersCollRef = collection(firestore, 'current');
    const tickers = await getDocs(tickersCollRef);

    const result: SearchResult[] = [];
    // firestore doesn't support text search, so we filter on client side instead.
    tickers.forEach(ticker => {
        if (ticker.id.toLowerCase().includes(input.toLowerCase())) {
            const { closeValue, delta, timestamp } = ticker.data() as PriceChangeRemote;
            result.push({
                symbol: ticker.id,
                value: closeValue,
                delta,
                timestamp
            });
        }
    });

    return result;
}

export async function getTickerChanges(tickers: string[]): Promise<TickerChange[]> {

    if (tickers.length === 0) {
        return [];
    }

    const priceQuery = query(
        collection(firestore, 'current'),
        where(documentId(), 'in', tickers)
    );
    const snapshot = await getDocs<PriceChangeRemote>(priceQuery);
    performance && performance.measure("initial-data-load");
    logPerformance();
    return formatSDKStocks(snapshot);
}

export async function getTickers(user: User): Promise<string[]> {
    const watchlistRef = doc(firestore, `watchlist/${user.uid}`);
    const data =  (await getDoc(watchlistRef)).data();

    return data ? data.tickers : [];
}

export async function getAllTickerChanges(): Promise<TickerChange[]> {
    const tickersCollRef = collection(firestore, 'current');
    const snapshot = await getDocs<PriceChangeRemote>(tickersCollRef);
    performance && performance.measure("initial-data-load");
    logPerformance();
    return formatSDKStocks(snapshot);
}

export function addToWatchList(ticker: string, user: User) {
    const watchlistRef = doc(firestore, `watchlist/${user.uid}`);
    return setDoc(watchlistRef, {
        tickers: arrayUnion(ticker)
    }, { merge: true });
}

export function deleteFromWatchList(ticker: string, user: User) {
    const watchlistRef = doc(firestore, `watchlist/${user.uid}`);
    return setDoc(watchlistRef, {
        tickers: arrayRemove(ticker)
    }, { merge: true });
}

// Format stock data in Firestore format (returned from `onSnapshot()`)
export function formatSDKStocks(snapshot: QuerySnapshot<PriceChangeRemote>): TickerChange[] {
    const stocks: TickerChange[] = [];
    //@ts-ignore
    snapshot.forEach(docSnap => {
        if (!docSnap.data()) return;
        const symbol = docSnap.id;
        const {
            closeValue,
            delta,
            timestamp
        } = docSnap.data();
        stocks.push({
            symbol,
            value: closeValue,
            delta,
            timestamp
        });
    });
    return stocks;
}
