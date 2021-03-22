import { renderLoginPage, renderUserPage } from './renderer';
import { firebaseAuth } from './firebase';
import { subscribeToAllTickerChanges, subscribeToTickerChanges } from './services';
import { setUser } from './state';
import './styles.scss';

let unsubscribeTickerChanges: () => void;
let unsubscribeAllTickerChanges: () => void;

firebaseAuth.onAuthStateChanged(user => {
    performance && performance.measure("firstAppPaint");
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
