let cookies = {};
const pips = new Map();
let prices = {};

const API_URL = process.env.REACT_APP_RENDER_API_URL;

export function printLog(content) {
    const dt = new Date().toLocaleString('en-GB');
    console.log(`[${dt}] ${content}`);
}

export function roundOff(x, dp) {
    let base = Math.pow(10, dp);

    return Math.round(x * base) / base;
}

export function isEmptyObj(obj) {
    return Object.keys(obj).length === 0;
}

export function getPip(pair) {
    if (pips.has(pair)) return pips.get(pair);
    if (pair.substring(3) === 'JPY') {
        pips.set(pair, 0.01);
        return 0.01;
    } else {
        pips.set(pair, 0.0001);
        return 0.0001;
    }
}

// pairs, prices, betas
export function calcSpread(ppb) {
    let spread = 0;

    for (let i = 0; i < ppb.length; i++) {
        spread += ppb[i][1] / getPip(ppb[i][0]) * ppb[i][2];
    }

    return roundOff(spread, 4);
}

export async function getPrice(pair) {
    if (!(pair in prices)) await getPrices();

    if (pair in prices) return prices[pair];
    return 0;
}

export async function getPrices(tries = 3) {
    printLog(`Fetching prices (tries=${tries}) ...`);
    try {
        const response = await fetch(API_URL + '/prices/');
        const data = await response.json();
        printLog('Fetched prices');
        prices = data;
        return prices;
    } catch (e) {
        if (tries) {
            return await getPrices(tries - 1);
        }
        return {}
    }
}

/*
export async function getChainHistorical(n) {
    console.log('fetching historical (Chain) ...');
    try {
        const response = await fetch(API_URL + '/historical/chain/?n=' + n); // query chain
        console.log('fetched historical');
        return await response.json();
    } catch (e) {
        console.log(e);
        return { 'prices': [], 'next': 0 };
    }
}*/

export async function getLastHistorical(n, tries = 3) {
    printLog(`Fetching historical (tries=${tries}) ...`);
    try {
        const response = await fetch(API_URL + '/historical/last/?n=' + n);
        printLog('Fetched');
        return await response.json();
    } catch (e) {
        if (tries) {
            return await getLastHistorical(n, tries - 1);
        }
        return { 'prices': [] };
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
