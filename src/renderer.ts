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
import { signInAnonymously, signOut, User } from './auth';
import { getState, setUserPageCreated } from './state';
import { addToWatchList, deleteFromWatchList, search } from './services';
import { SearchResult, TickerChange } from './models';

const headerEl = document.getElementById("header")!;
const contentHomeEl = document.getElementById("home")!;

// close any open dropdowns
document.addEventListener('click', () => {
    const allDropdowns = document.getElementsByClassName('dropdown');
    for (const dropdown of Array.from(allDropdowns)) {
        dropdown.classList.remove('is-active');
    }
});

export function renderUserPage(
    user: User,
    {
        loading = false,
        tableData
    }: {
        loading?: boolean,
        tableData: TickerChange[]
    }
) {
    const { userPageCreated } = getState();

    if (!userPageCreated) { // render the full page
        headerEl.innerHTML = "";
        contentHomeEl.innerHTML = "";
        renderHeader(`Welcome back!`, user);
        renderTableHeading('Watchlist', user);
        renderTable(tableData, user, loading);
        setUserPageCreated(true);
    } else { // only recreate the table
        const tableContainer = contentHomeEl.querySelector('.table-container');
        tableContainer && contentHomeEl.removeChild(tableContainer);
        renderTable(tableData, user, loading);
    }
}

export function renderLoginPage(
    title: string,
    {
        loading = false,
        tableData
    }: {
        loading?: boolean,
        tableData: TickerChange[]
    }
) {
    headerEl.innerHTML = "";
    contentHomeEl.innerHTML = "";
    renderHeader(title, null);
    renderTableHeading('Popular stocks', null);
    renderTable(tableData, null, loading);
}

const HEADERS = [
    {
        label: "symbol",
        cls: "symbol-cell"
    },
    {
        label: "current",
        cls: "price-cell"
    },
    {
        label: "change",
        cls: "change-cell"
    },
    {
        label: "",
        cls: "direction-cell"
    },
    {
        label: "updated at",
        cls: "date-cell"
    },
    {
        label: "with data from",
        cls: "date-cell"
    },
    {
        label: "",
        cls: "delete-cell"
    }
];

export function renderTableHeading(title: string, user: User | null) {
    const containerEl = document.createElement("div");
    containerEl.className = 'table-heading';
    const titleEl = document.createElement("h1");
    titleEl.className = "container-title";
    titleEl.innerText = title;
    containerEl.append(titleEl);

    /**
     * render the button to add stocks to the watchlist if we are rendering for a logged in user
     */
    if (user) {
        const addToWatchListButtonContainer = document.createElement('div');
        renderAddTickerButton(addToWatchListButtonContainer);
        containerEl.append(addToWatchListButtonContainer);
    }

    contentHomeEl.append(containerEl);
}

function renderAddTickerButton(container: HTMLElement) {

    container.innerHTML = `
        <div class="dropdown is-right">
            <div class="dropdown-trigger">
                <button class="button" aria-haspopup="true" aria-controls="dropdown-menu">
                    <span>+ Add</span>
                </button>
            </div>
            <div class="dropdown-menu" id="dropdown-menu" role="menu">
                <div class="dropdown-content">
                    <div class="search">
                       <input class="search-input" placeholder="Type a symbol" type="text"/>
                    </div>
                    <div class="results">
                    </div>
                </div>
            </div>
        </div>
    `;

    const dropdownContainer = container.querySelector('.dropdown')!;
    const trigger = container.querySelector('.dropdown-trigger')!;
    const searchInput: HTMLInputElement = container.querySelector('.search-input')!;
    const searchResultsContainer: HTMLElement = container.querySelector('.results')!;

    trigger.addEventListener('click', (event) => {
        // stop event propagation, so it doesn't get closed immediately
        event.stopPropagation();
        if (dropdownContainer.classList.contains('is-active')) {
            dropdownContainer.classList.remove('is-active');
        } else {
            // reset input and results
            searchInput.value = '';
            searchResultsContainer.innerHTML = '';

            dropdownContainer.classList.add('is-active');
            // focus on the input box
            setTimeout(() => searchInput.focus(), 100);
        }
    });

    searchInput.addEventListener('click', (event) => {
        // stop event propagation, so dropdown doesn't get closed
        event.stopPropagation();
    });

    // search
    let cancelPrevious: number;
    searchInput.addEventListener('keyup', () => {
        clearTimeout(cancelPrevious);

        // throttle inputs
        cancelPrevious = setTimeout(async () => {
            const searchResults = await search(searchInput.value);
            searchResultsContainer.innerHTML = '';
            renderSearchResults(searchInput.value, searchResults, searchResultsContainer);
        }, 500) as unknown as number;
    });


}

function renderSearchResults(keyword: string, searchResults: SearchResult[], container: HTMLElement) {

    const dropdownContainer = document.querySelector('.dropdown')!;

    if (searchResults.length === 0) {
        const tickerRow = document.createElement('div');
        tickerRow.className = "dropdown-item";
        tickerRow.innerText = "No matches...";
        container.append(tickerRow);
    } else {
        for (const searchResult of searchResults) {
            const tickerRow = document.createElement('div');
            tickerRow.className = "dropdown-item";

            const symbol = document.createElement('div');
            symbol.className = 'symbol';
            symbol.appendChild(createHighlightedString(searchResult.symbol, keyword));
            tickerRow.appendChild(symbol);

            const price = document.createElement('div');
            price.className = 'price';
            price.innerText = formatDollar(searchResult.value);
            tickerRow.appendChild(price);

            const change = document.createElement('div');
            change.className = `change ${searchResult.delta && searchResult.delta > 0 ? 'positive' : 'negative'}`;

            change.innerText = formatDollar(searchResult.delta, { deltaSign: true });
            tickerRow.appendChild(change);

            container.append(tickerRow);

            tickerRow.addEventListener('click', () => {
                addToWatchList(searchResult.symbol, getState().user!);
                // close dropdown
                dropdownContainer.classList.remove('is-active');
            });
        }
    }
}

export function renderTable(tableData: TickerChange[], user: User | null, loading: boolean) {
    const containerEl = document.createElement("div");
    containerEl.className = 'table-container';

    // always render headers
    const tableEl = document.createElement("div");
    tableEl.className = "table";
    const headerRow = document.createElement("div");
    headerRow.className = "row";
    HEADERS.forEach(({ label, cls }) => {
        const headerCell = document.createElement("div");
        headerCell.className = `header-cell ${cls}`;
        headerCell.innerText = label;
        headerRow.append(headerCell);
    });
    tableEl.append(headerRow);


    if (loading) { // render loading view
        containerEl.append(tableEl);

        for (const _a of [1, 2, 3]) {
            renderLoadingRow(containerEl);
        }
    } else { // render content
        tableData.forEach(rowData => renderRow(tableEl, rowData, user));
        containerEl.append(tableEl);
    }

    contentHomeEl.append(containerEl);
}

function renderLoadingRow(tableEl: HTMLElement) {
    const rowEl = document.createElement("div");
    rowEl.className = "loading-container";

    rowEl.innerHTML = `
    <div class="loading-ticker">
    </div>
    <div class="loading-bar">
    </div>
    `;
    tableEl.append(rowEl);
}

export function renderRow(tableEl: HTMLElement, rowData: TickerChange, user: User | null) {
    const { symbol, value, delta, timestamp } = rowData;
    const changeClasses = ["cell"];
    if (delta && delta > 0) {
        changeClasses.push("positive");
    } else if (delta && delta < 0) {
        changeClasses.push("negative");
    }
    const rowEl = document.createElement("div");
    rowEl.className = "row body";

    const symbolCell = document.createElement("div");
    symbolCell.className = "cell symbol-cell";
    const symbolBlock = document.createElement("div");
    symbolBlock.className = "symbol-block";
    symbolBlock.innerText = symbol;
    symbolCell.append(symbolBlock);
    rowEl.append(symbolCell);

    const priceCell = document.createElement("div");
    priceCell.className = "cell price-cell";
    priceCell.innerText = value ? value.toFixed(2) : "-";
    rowEl.append(priceCell);

    const changeCell = document.createElement("div");
    changeCell.className = changeClasses.join(" ");
    changeCell.innerText = delta ? delta.toFixed(2) : "-";
    rowEl.append(changeCell);

    const arrowCell = document.createElement("div");
    arrowCell.className = "cell";
    const arrow = document.createElement("div");
    arrow.className = delta && delta > 0 ? "arrow-up" : "arrow-down";
    arrowCell.append(arrow);
    rowEl.append(arrowCell);

    const dateUpdatedCell = document.createElement("div");
    dateUpdatedCell.className = "cell date-cell";
    dateUpdatedCell.innerText = new Date().toLocaleString();
    rowEl.append(dateUpdatedCell);

    const dateFromCell = document.createElement("div");
    dateFromCell.className = "cell date-cell";
    dateFromCell.innerText = new Date(timestamp).toLocaleString();
    rowEl.append(dateFromCell);

    const deleteCell = document.createElement('div');
    deleteCell.className = 'cell delete-cell';
    if (user) {
        const deleteIcon = document.createElement('div');
        deleteIcon.className = 'delete-icon';
        deleteIcon.innerText = 'X';

        deleteCell.append(deleteIcon);

        deleteCell.addEventListener('click', () => {
            deleteFromWatchList(symbol, user);
        });
    }
    rowEl.append(deleteCell);

    tableEl.append(rowEl);
}

/**
 * 
 * @param {*} title
 * @param {*} user - user logged in. null if no user is logged in
 */
export function renderHeader(title: string, user: User | null) {
    const titleEl = document.createElement("h1");
    titleEl.className = "title";
    titleEl.innerText = title;
    headerEl.append(titleEl);
    const navEl = document.createElement('div');

    const loginOrLogoutButton = document.createElement('button');

    if (!user) { // render login button
        loginOrLogoutButton.textContent = 'login';
        loginOrLogoutButton.className = 'login-button';

        loginOrLogoutButton.addEventListener('click', () => {
            signInAnonymously();
        });
    } else { // render logout button
        loginOrLogoutButton.textContent = 'logout';
        loginOrLogoutButton.className = 'login-button';

        loginOrLogoutButton.addEventListener('click', () => {
            signOut();
            setUserPageCreated(false);
        });
    }

    navEl.append(loginOrLogoutButton);
    headerEl.append(navEl);
}

function formatDollar(input?: number, options?: { deltaSign?: boolean }): string {

    const defaultOptions = {
        deltaSign: false
    };

    const { deltaSign } = { ...defaultOptions, ...options };

    if (!input) {
        return '-';
    }

    if (input >= 0) {
        return `${deltaSign ? '+' : ''}$${input.toFixed(2)}`;
    } else {
        return `${deltaSign ? '-': ''}$${Math.abs(input).toFixed(2)}`;
    }
}

function createHighlightedString(text: string, keyword: string): HTMLElement {
    const container = document.createElement('span');

    const matchPosition = text.toLowerCase().indexOf(keyword.toLowerCase());
    const matchEndPosition = matchPosition + keyword.length;
    
    const start = text.slice(0, matchPosition);
    const match = text.slice(matchPosition, matchEndPosition);
    const end = text.slice(matchEndPosition);
    container.innerHTML = `${start}<em>${match}</em>${end}`

    return container;
}