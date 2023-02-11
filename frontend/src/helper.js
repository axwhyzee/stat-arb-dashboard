let pips = new Map();
let prices;
let prevPriceQuery = 0;

const queryInterval = 1000 * 60 * 5 // 5 mins in ms

export function roundOff(x, dp) {
    let base = Math.pow(10, dp);

    return Math.round(x * base) / base;
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
    return spread;
}

export async function getPrice(pair) {
    const now = Date.now();
    if (now - prevPriceQuery > queryInterval) {
        const response = await fetch('https://stat-arbitrage-dashboard.onrender.com/all/');
        const data = await response.json();

        prices = data;

    return prices[pair];
}