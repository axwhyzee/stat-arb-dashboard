let pips = new Map();
let prices;

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
        const response = await fetch('https://stat-arbitrage-dashboard.onrender.com/prices/');
        const data = await response.json();
        prices = data;
        return prices;
    } catch (e) {
        if (tries) {
            console.log('Retrying getPrices(tries=' + tries - 1 + ')');
            return await getPrices(tries - 1);
        }
        return {}
    }
}

export async function getChainHistorical(n) {
    console.log('fetching historical (Chain) ...');
    try {
        const response = await fetch('https://stat-arbitrage-dashboard.onrender.com/historical/chain/?n=' + n); // query chain
        console.log('fetched');
        return await response.json();
    } catch (e) {
        console.log(e);
        return { 'prices': [], 'next': 0 };
    }
}

export async function getLastHistorical(n, tries = 3) {
    console.log('fetching historical (Last) ...');
    try {
        const response = await fetch('https://stat-arbitrage-dashboard.onrender.com/historical/last/?n=' + n);
        console.log('fetched');
        return await response.json();
    } catch (e) {
        if (tries) {
            console.log('Retrying getLastHistorical(tries=' + tries - 1 + ')');
            return await getPrices(tries - 1);
        }
        return { 'prices': [] };
    }
}