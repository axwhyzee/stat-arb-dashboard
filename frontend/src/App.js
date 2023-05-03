import './App.css';
import React from 'react';
import { useState, useEffect } from 'react';

import Card from './Card';
import Graph from './Graph';
import Spinner from './Spinner';
import Sidebar from './Sidebar';
import { printLog, getPip, roundOff, calcSpread, getPrice, getPrices, getLastHistorical, isEmptyObj, initCookies, setCookie, getCookie } from './helper';


const App = () => {
    const queryInterval = 1000 * 60 * 5; // 5 mins in ms
    const numPeriods = 250;

    // stores graph data for active portfolio
    // [ {datetime, price}, ... ]
    const [graphData, setGraphData] = useState([]);

    // keeps track of price loading for <Card />s
    const [loadingPrices, setLoadingPrices] = useState(false);

    // last update time, displayed on graph's bottom right
    const [updateDatetime, setUpdateDatetime] = useState(new Date().toLocaleString());

    // stores reference to setInterval() for querying
    const [intervalState, setIntervalState] = useState();

    // current query chain number
    // const [chain, setChain] = useState(6);

    // [ {datetime, AUDCAD, AUDCHF ... USDJPY } ]
    const [history, setHistory] = useState([]);

    // portfolio being displayed
    const [active, setActive] = useState(-1);

    // last spread (current)
    const [spreads, setSpreads] = useState({});

    // last price (current)
    const [prices, setPrices] = useState({ 'AUDCAD': 0, 'AUDCHF': 0, 'AUDJPY': 0, 'AUDNZD': 0, 'AUDUSD': 0, 'CADCHF': 0, 'CADJPY': 0, 'CHFJPY': 0, 'EURAUD': 0, 'EURCAD': 0, 'EURCHF': 0, 'EURGBP': 0, 'EURJPY': 0, 'EURNZD': 0, 'EURUSD': 0, 'GBPAUD': 0, 'GBPCAD': 0, 'GBPCHF': 0, 'GBPJPY': 0, 'GBPNZD': 0, 'GBPUSD': 0, 'NZDCAD': 0, 'NZDCHF': 0, 'NZDJPY': 0, 'NZDUSD': 0, 'USDCAD': 0, 'USDCHF': 0, 'USDJPY': 0 });

    // ID: { [ {pair, entry, price, beta} ], ... }
    const [portfolios, setPortfolios] = useState({}); // default portfolio

    // initialization function - runs once on component mount
    useEffect(() => {
        const interval = setInterval(updatePrices, queryInterval);

        const asyncInit = async () => {
            // initialise portfolios w/ cookies, else use default portfolios
            initCookies();

            const cookiePortfolio = getCookie('portfolios');

            // if have pre-existing portfolio in cookies, set it as portfolios 
            if (cookiePortfolio && Object.keys(cookiePortfolio).length) {
                setPortfolios(cookiePortfolio);
                setActive(Object.keys(cookiePortfolio)[0]);
                // else, use default portfolios
            } else {
                setPortfolios({
                    '16738791335': [
                        { 'pair': 'GBPCHF', 'entry': await getPrice('GBPCHF'), 'price': await getPrice('GBPCHF'), 'beta': 1 },
                        { 'pair': 'CADCHF', 'entry': await getPrice('CADCHF'), 'price': await getPrice('CADCHF'), 'beta': 1.2 }
                    ],
                    '1673879235': [
                        { 'pair': 'EURUSD', 'entry': await getPrice('EURUSD'), 'price': await getPrice('EURUSD'), 'beta': 1 },
                        { 'pair': 'AUDUSD', 'entry': await getPrice('AUDUSD'), 'price': await getPrice('AUDUSD'), 'beta': -1.6 }
                    ]
                });
                setActive('1673879235');
            }

            // fetch latest prices
            setLoadingPrices(true);
            await updatePrices(); // run once immediately since setInterval runs only after interval
            setLoadingPrices(false);

            // fetch historical prices
            const historicalData = await getLastHistorical(numPeriods);
            setHistory(historicalData);

            //queryChain(chain);
        }
        asyncInit();
        setIntervalState(interval);

        return () => clearInterval(intervalState); // cleanup on unmount
    }, []);

    // update all spread values on price updates
    useEffect(() => {
        let spread;
        let cloneSpreads = {};
        for (const ID of Object.keys(portfolios)) {
            spread = 0;
            for (const item of portfolios[ID]) {
                spread += prices[item.pair] / getPip(item.pair) * item.beta;
            }
            cloneSpreads[ID] = roundOff(spread, 4);
        }
        setSpreads(cloneSpreads);
    }, [prices, portfolios]);

    // update cookies when portfolio is updated
    useEffect(() => {
        setCookie('portfolios', portfolios);
    }, [portfolios]);


    useEffect(() => {
        if (active == -1 || !history || !history.length) return;

        const pairs = portfolios[active].map((ele) => ([ele.pair, ele.beta]));
        const res = [];
        let spread;

        for (const row of history) {
            const temp = [row['datetime']];
            spread = 0;

            for (const pair of pairs) {
                spread += row[pair[0]] * pair[1];
            }

            temp.push(roundOff(spread, 4));
            res.push(temp);
        }

        // add recentmost price as last element
        spread = 0;
        for (const pair of pairs) {
            spread += prices[pair[0]] / getPip(pair[0]) * pair[1];
        }

        res.push([parseInt(new Date().valueOf() / 1000), spread]);
        printLog('Updated graph');
        setGraphData(res);
    }, [active, history, prices, portfolios]);

    // chain queries
    /*
    useEffect(() => {
        console.log(history.length, chain);
        if (chain) queryChain(chain);
    }, [history]);

    async function queryChain(idx) {
        console.log('Query chain: ' + idx);
        const dataBlock = await getChainHistorical(idx);

        // chain next query
        setChain(dataBlock['next']);
        setHistory(history.concat(dataBlock['prices']));
    }*/

    // interval function that queries for new prices every <query_interval>
    async function updatePrices() {
        printLog('Interval update');
        const updatedPrices = await getPrices();

        if (!isEmptyObj(updatedPrices)) setPrices(updatedPrices);
        setUpdateDatetime(new Date().toLocaleString());
    }

    async function addPortfolio() {
        const ID = new Date().valueOf();
        const clonePortfolios = structuredClone(portfolios);
        const cloneSpreads = structuredClone(spreads);
        const defaultPrice = await getPrice('EURUSD');

        clonePortfolios[ID] = [{ 'pair': 'EURUSD', 'entry': defaultPrice, 'price': defaultPrice, 'beta': 1 }];
        cloneSpreads[ID] = calcSpread(clonePortfolios[ID].map((pair) => ([pair.pair, pair.price, pair.beta])));

        setSpreads(cloneSpreads);
        setPortfolios(clonePortfolios);
        setActive(ID);
    }

    async function editPortfolio(id, newPortfolio) {
        const clonePortfolios = structuredClone(portfolios);
        const cloneSpreads = structuredClone(spreads);
        let ppbs = [];
        let price;

        if (newPortfolio.length) {
            clonePortfolios[id] = newPortfolio;

            for (const pair of newPortfolio) {
                price = await getPrice(pair.pair);
                ppbs.push([pair.pair, price, pair.beta]);
            }

            cloneSpreads[id] = calcSpread(ppbs);
            setPortfolios(clonePortfolios);
            setSpreads(cloneSpreads);
        } else {
            delete clonePortfolios[id];
            delete cloneSpreads[id];

            if (Object.keys(cloneSpreads).length) setActive(Object.keys(cloneSpreads)[0]);
            else setActive(-1);
            setPortfolios(clonePortfolios);
            setSpreads(cloneSpreads);
        }
    }

    return (
        <main className='color-grey'>
            <Sidebar id={active} spread={spreads[active]} data={(active in portfolios) ? portfolios[active] : []} editPortfolio={editPortfolio} />

            <div className='main-wrapper'>
                {
                    active !== -1 ?
                        (<Graph
                            graphData={graphData}
                            entry={portfolios[active].map((obj) => (obj.entry / getPip(obj.pair) * obj.beta)).reduce(function (a, b) { return a + b }, 0)}
                            current={spreads[active]} />)
                        :
                        (<></>)
                }
                <div className='cards-wrapper pos-top'>
                    <div className='row side-scroll pr-2'>
                        {
                            !loadingPrices ? (
                                Object.entries(portfolios).map(([portfolioID, portfolio]) => (
                                    <Card
                                        key={portfolioID}
                                        portfolioID={portfolioID}
                                        portfolio={portfolio}
                                        setActive={setActive}
                                        spread={spreads[portfolioID]}
                                        isActive={portfolioID == active} />))
                            ) : (
                                <>
                                    <div className='pos-relative pl-3'>
                                        <Spinner width={20} height={20} />
                                    </div>
                                    <h4 className='pl-1'>Loading prices ...</h4>
                                </>
                            )
                        }
                    </div>
                </div>
                <button className='add-portfolio' onClick={addPortfolio}>+</button>
            </div>
            <span className='update-timestamp font-sm'>Updated: {updateDatetime}</span>
        </main>
    );
}

export default App;
