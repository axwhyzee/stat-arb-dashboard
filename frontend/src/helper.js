let cookies = {};
const pips = new Map();
let prices;

const API_URL = 'https://stat-arb-backend.onrender.com'


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
    if (pair in prices) return prices[pair];
    return 0;
}

export async function getPrices(tries = 3) {
    console.log('fetching prices ...');
    try {
        const response = await fetch(API_URL + '/prices/');
        const data = await response.json();
        console.log('fetched prices');
        prices = data;
        return prices;
    } catch (e) {
        if (tries) {
            console.log('Retrying getPrices(tries=' + tries + ')');
            return await getPrices(tries - 1);
        }
        return {}
    }
}

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
}

export async function getLastHistorical(n, tries = 3) {
    console.log('fetching historical (Last) ...');
    try {
        const response = await fetch(API_URL + '/historical/last/?n=' + n);
        console.log('fetched');
        return await response.json();
    } catch (e) {
        if (tries) {
            console.log('Retrying getLastHistorical(tries=' + tries + ')');
            return await getLastHistorical(n, tries - 1);
        }
        return { 'prices': [] };
    }
}

// +---------+
// | Cookies |
// +---------+

export function initCookies() {
    const docCookies = document.cookie.split(';');
    let temp;

    for (const cookie of docCookies) {
        temp = cookie.split('=');
        cookies[temp[0].trim()] = temp[1];
    }
    console.log('init cookies: ', cookies);

    for (const cookie of Object.keys(cookies)) {
        console.log(cookies[cookie]);
    }
}

export function getCookie(cookieName) {
    return cookieName in cookies ? JSON.parse(cookies[cookieName]) : null; // only parse when fetching a specific cookie
}

export function setCookie(cookieName, cookieValue) {
    let cookieStr = '';

    cookies[cookieName] = cookieValue;

    for (const cookie of Object.keys(cookies)) {
        console.log(cookie, cookies[cookie]);
        cookieStr += `${cookie}=${JSON.stringify(eval(cookies[cookie]))};`;
    }
    console.log('set cookie: ' + cookieStr);
    document.cookie = cookieStr;
}

export function removeCookie(cookieName) {
    delete cookies[cookieName];
    console.log('deleted: ', cookies);
}