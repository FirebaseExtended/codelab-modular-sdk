/**
 * Copyright 2021 Google Inc. All Rights Reserved.
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
import { renderLoginPage, renderUserPage } from './renderer';
import { onUserChange } from './auth';
import { subscribeToAllTickerChanges, subscribeToTickerChanges } from './services';
import { setUser } from './state';
import './styles.scss';

let unsubscribeTickerChanges: () => void;
let unsubscribeAllTickerChanges: () => void;

onUserChange(user => {
    performance && performance.measure("first-meaningful-paint");
    if (unsubscribeAllTickerChanges) {
        unsubscribeAllTickerChanges();
    }

    if (unsubscribeTickerChanges) {
        unsubscribeTickerChanges();
    }

    if (user) {
        // user page
        setUser(user);
        
        // show loading screen in 500ms
        const timeoutId = setTimeout(() => {
            renderLoginPage('Landing page', {
                loading: true,
                tableData: []
            });
        }, 500);

        unsubscribeTickerChanges = subscribeToTickerChanges(user, stockData => {
            clearTimeout(timeoutId);
            renderUserPage(user, { tableData: stockData })
        });
    } else {
        // login page
        setUser(null);

        // show loading screen in 500ms
        const timeoutId = setTimeout(() => {
            renderLoginPage('Landing page', {
                loading: true,
                tableData: []
            });
        }, 500);
        unsubscribeAllTickerChanges = subscribeToAllTickerChanges(stockData => {
            clearTimeout(timeoutId);
            renderLoginPage('Landing page', { tableData: stockData })
        });
    }
});
