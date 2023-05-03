const pips = new Map();
let cookies = {};
let prices = {};

const API_URL = 'https://stat-arb-dashboard-rf9k.onrender.com'

export function printLog(content) {
    /**
     * Logging
     * 
     * @param {String} content Log a message 
     */
    const dt = new Date().toLocaleString('en-GB');
    console.log(`[${dt}] ${content}`);
}

export function roundOff(x, dp) {
    /**
     * Round off a number
     * 
     * @param   {number} x  Value
     * @param   {number} dp Number of decimals to round off to
     * @returns {number}    Rounded value
     */
    let base = Math.pow(10, dp);

    return Math.round(x * base) / base;
}

export function getPip(pair) {
    /**
     * Return pip value of a FX pair
     * 
     * @param   {String} pair Symbol of FX pair
     * @returns {number}      Pip value of FX pair
     */
    if (pips.has(pair)) return pips.get(pair);
    if (pair.substring(3) === 'JPY') {
        pips.set(pair, 0.01);
        return 0.01;
    } else {
        pips.set(pair, 0.0001);
        return 0.0001;
    }
}

export function calcSpread(ppb) {
    /**
     * Calculate spread of a portfolio with specified price and beta values
     * 
     * @param   {Array}  ppb 2D array, where each element is [pair: String, price: number, beta: number]
     * @returns {number}     Spread value
     */
    let spread = 0;

    for (let i = 0; i < ppb.length; i++) {
        spread += ppb[i][1] / getPip(ppb[i][0]) * ppb[i][2];
    }

    return roundOff(spread, 4);
}

export async function getPrice(pair) {
    /**
     * Fetch price of pair from API
     * 
     * @param   {String} pair Symbol of FX pair
     * @returns {number}      Price of pair in points
     */
    if (!(pair in prices)) await getPrices();

    if (pair in prices) return prices[pair];
    return 0;
}

export async function getPrices(tries = 3) {
    /**
     * Return prices of all FX pairs
     * 
     * @param   {number} tries Number of API request attempts
     * @returns {Object}       Object mapping FX symbol to corresponding prices
     */
    printLog(`Fetching prices (tries=${tries}) ...`);
    try {
        // attempt to fetch prices from API
        const response = await fetch(API_URL + '/prices/');
        const data = await response.json();
        printLog('Fetched prices');
        prices = data;
        return prices;
    } catch (e) {
        if (tries) {
            // retry if remaining attempts > 0
            return await getPrices(tries - 1);
        }
        return {}
    }
}

export async function getChainHistorical(n) {
    /**
     * Fetch historical prices in chunks in a chain manner
     * 
     * @param   {number} n Current index value in the API query chain
     * @returns {Object}   Returns object containing prices: [{datetime, AUDUSD, EURUSD ...}, ...], and next: index of next query in the chain
     */
    console.log('fetching historical (Chain) ...');
    try {
        const response = await fetch(API_URL + '/historical/chain/?n=' + n); // query chain
        console.log('fetched historical');
        return await response.json();
    } catch (e) {
        console.log(e);
        return { 'prices': [], 'next': 0 };
    }
}

export async function getLastHistorical(n, tries = 3) {
    /**
     * Get last n closing prices
     * 
     * @param   {number}   n     Number of periods
     * @param   {number}   tries Number of API request attempts
     * @returns {number[]}       Array of prices in [{datetime, AUDUSD, EURUSD, ...}, ...] format
     */
    printLog(`Fetching historical (tries=${tries}) ...`);
    try {
        const response = await fetch(API_URL + '/historical/last/?n=' + n);
        printLog('Fetched');
        return await response.json();
    } catch (e) {
        if (tries) {
            return await getLastHistorical(n, tries - 1);
        }
        return [];
    }
}

// +---------+
// | Cookies |
// +---------+

export function initCookies() {
    if (!document.cookie) return;

    const docCookies = document.cookie.split('; ');
    const today = new Date();
    today.setDate(today.getDate() + 365); // extend cookie expiry by 1 yr

    for (const cookie of docCookies) {
        const temp = cookie.split('=');
        cookies[temp[0].trim()] = temp[1];
    }
    cookies['expires'] = today.toUTCString();
    printLog('Init cookies');
}

export function getCookie(cookieName) {
    return (cookieName in cookies && cookies[cookieName]) ? JSON.parse(cookies[cookieName]) : null; // only parse when fetching a specific cookie
}

export function setCookie(cookieName, cookieValue) {
    let cookieStr = ''

    printLog('Set cookie');
    cookies[cookieName] = JSON.stringify(cookieValue);

    for (const cookie of Object.keys(cookies)) {
        if (cookie != 'expires') cookieStr += `${cookie}=${cookies[cookie]}; `;
    }

    document.cookie = cookieStr + 'expires=' + cookies['expires'] + ';';
    printLog('New cookie: ' + document.cookie);
}

export function removeCookie(cookieName) {
    delete cookies[cookieName];
    printLog('Deleted');
}