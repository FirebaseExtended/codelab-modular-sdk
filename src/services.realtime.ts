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
import { User } from './auth'
import { PriceChangeRemote, TickerChange } from './models';
import { collection, doc, onSnapshot, query, where, documentId, getFirestore } from 'firebase/firestore';
import { formatSDKStocks } from './services';

const firestore = getFirestore();
type TickerChangesCallBack = (changes: TickerChange[]) => void

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
    const watchlistRef = doc(firestore, `watchlist/${user.uid}`);
    const unsubscribe = onSnapshot(watchlistRef, snapshot => {
        const doc = snapshot.data();
        const tickers = doc ? doc.tickers : [];

        if (unsubscribePrevTickerChanges) {
            unsubscribePrevTickerChanges();
        }

        if (tickers.length === 0) {
            callback([]);
        } else {
            // Query to get current price for tickers in the watchlist
            const priceQuery = query(
                collection(firestore, 'current'),
                where(documentId(), 'in', tickers)
            );

            // Subscribe to price changes for tickers in the watchlist
            unsubscribePrevTickerChanges = onSnapshot<PriceChangeRemote>(priceQuery, snapshot => {
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
    const tickersCollRef = collection(firestore, 'current');
    return onSnapshot<PriceChangeRemote>(tickersCollRef, snapshot => {
        const stocks = formatSDKStocks(snapshot);
        callback(stocks);
    });
}
