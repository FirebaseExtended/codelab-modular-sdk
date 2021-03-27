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
import { firestore, FirestoreFieldPath, FirestoreFieldValue, QuerySnapshot } from './firebase';
import { User } from './auth'
import { PriceChangeRemote, SearchResult, TickerChange } from './models';
import { logPerformance } from './perf';

export async function search(input: string): Promise<SearchResult[]> {

    if (!input) {
        return [];
    }

    const tickers = await firestore.collection('current').get();

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

export function addToWatchList(ticker: string, user: User) {
    return firestore.collection('watchlist').doc(user.uid).set({
        tickers: FirestoreFieldValue.arrayUnion(ticker)
    }, { merge: true });
}

export function deleteFromWatchList(ticker: string, user: User) {
    return firestore.collection('watchlist').doc(user.uid).set({
        tickers: FirestoreFieldValue.arrayRemove(ticker)
    }, { merge: true });
}

type TickerChangesCallBack = (changes: TickerChange[]) => void
let firstload = true;
/**
 * The function subscribes to user's watchlist, then subscribe to the price changes for the tickers in the watchlist.
 * Whenever there is a change to user's watchlist, it unsubscribe and subscribe again using the latest list of tickers in the wathclist.
 * 
 * @param user - the user whose watchlist we want to subscribe to
 * @param callback - the callback function that is invoked when price changes for any tickers in the user's watchlist
 * @returns function to unsubscribe
 */
export function subscribeToTickerChanges(user: User, callback: TickerChangesCallBack) {

    let unsubscribePrevTickerChanges: () => void;

    // Subscribe to watchlist changes. We will get an update whenever a ticker is added/deleted to the watchlist
    const unsubscribe = firestore.collection('watchlist').doc(user.uid).onSnapshot(snapshot => {
        const doc = snapshot.data();
        const tickers = doc ? doc.tickers : [];

        if (unsubscribePrevTickerChanges) {
            unsubscribePrevTickerChanges();
        }

        if (tickers.length === 0) {
            callback([]);
        } else {
            // Subscribe to price changes for tickers in the watchlist
            unsubscribePrevTickerChanges = firestore
                .collection('current')
                .where(FirestoreFieldPath.documentId(), 'in', tickers)
                .onSnapshot(snapshot => {
                    if (firstload) {
                        performance && performance.measure("initial-data-load");
                        firstload = false;
                        logPerformance();
                    }

                    const stocks = formatSDKStocks(snapshot);
                    callback(stocks);
                });
        }
    });
    return () => {
        if (unsubscribePrevTickerChanges) {
            unsubscribePrevTickerChanges();
        }
        unsubscribe();
    };
}

export function subscribeToAllTickerChanges(callback: TickerChangesCallBack) {
    return firestore
        .collection('current')
        .onSnapshot(snapshot => {
            if (firstload) {
                performance && performance.measure("initialDataLoadTime");
                firstload = false;
                logPerformance();
            }
            const stocks = formatSDKStocks(snapshot);
            callback(stocks);
        });
}

// Format stock data in Firestore format (returned from `onSnapshot()`)
export function formatSDKStocks(snapshot: QuerySnapshot): TickerChange[] {
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
