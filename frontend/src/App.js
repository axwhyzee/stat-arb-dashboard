import './App.css';

import React from 'react';
import { useState, useEffect, useMemo } from 'react';

import Card from './Card';
import Graph from './Graph';
import Spinner from './Spinner';
import Sidebar from './Sidebar';
import { getPip, roundOff, calcSpread, getPrice, getPrices, getHistorical, isEmptyObj } from './helper';


const App = () => {
    const queryInterval = 1000 * 60 * 30; // 30 mins in ms

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
    const [chain, setChain] = useState(6);

    // [ {datetime, AUDCAD, AUDCHF ... USDJPY } ]
    const [historicalData, setHistoricalData] = useState([]);

    // portfolio being displayed
    const [active, setActive] = useState(-1);

    // last spread (current)
    const [spreads, setSpreads] = useState({});

    // last price (current)
    const [prices, setPrices] = useState({ 'AUDCAD': 0, 'AUDCHF': 0, 'AUDJPY': 0, 'AUDNZD': 0, 'AUDUSD': 0, 'CADCHF': 0, 'CADJPY': 0, 'CHFJPY': 0, 'EURAUD': 0, 'EURCAD': 0, 'EURCHF': 0, 'EURGBP': 0, 'EURJPY': 0, 'EURNZD': 0, 'EURUSD': 0, 'GBPAUD': 0, 'GBPCAD': 0, 'GBPCHF': 0, 'GBPJPY': 0, 'GBPNZD': 0, 'GBPUSD': 0, 'NZDCAD': 0, 'NZDCHF': 0, 'NZDJPY': 0, 'NZDUSD': 0, 'USDCAD': 0, 'USDCHF': 0, 'USDJPY': 0 });

    // ID: { [ {pair, entry, price, beta} ], ... }
    const [portfolios, setPortfolios] = useState({
        '16738791335': [
            { 'pair': 'AUDUSD', 'entry': 0.6889, 'price': 0.6889, 'beta': 1 },
            { 'pair': 'CADCHF', 'entry': 0.68788, 'price': 0.68788, 'beta': -4.0686013955488303 }
        ],
        '1673879235': [
            { 'pair': 'EURJPY', 'entry': 125.632, 'price': 125.632, 'beta': 1 },
            { 'pair': 'GBPJPY', 'entry': 136.2049, 'price': 136.2049, 'beta': -1.2 }
        ]
    });

    // initialization function - runs once on component mount
    useEffect(() => {
        console.log('[Initialise]');
        const interval = setInterval(updatePrices, queryInterval);

        const fetchPrices = async () => {
            setLoadingPrices(true);
            await updatePrices(); // run once immediately since setInterval runs only after interval
            setLoadingPrices(false);
            queryChain(chain);
        }

        fetchPrices();
        setIntervalState(interval);

        return () => clearInterval(intervalState); // cleanup on unmount
    }, []);

    // update all spread values on price updates
    useMemo(() => {
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
    }, [prices]);

    // when active or historical data changes, update the graph
    useEffect(() => {
        if (active == -1) return;

        const pairs = portfolios[active].map((ele) => ([ele.pair, ele.beta]));
        const res = [];

        for (const row of historicalData) {
            const temp = [row['datetime']];
            let spread = 0;

            for (const pair of pairs) {
                spread += row[pair[0]] * pair[1];
            }

            temp.push(roundOff(spread, 4));
            res.push(temp);
        }
        setGraphData(res);
    }, [active, historicalData]);


    // chain queries
    useEffect(() => {
        console.log(historicalData.length, chain);
        if (chain) queryChain(chain);
    }, [historicalData]);

    async function queryChain(idx) {
        console.log('Query chain: ' + idx);
        const dataBlock = await getHistorical(idx);

        // chain next query
        setChain(dataBlock['next']);
        setHistoricalData(historicalData.concat(dataBlock['prices']));
    }

    // interval function that queries for new prices every <query_interval>
    async function updatePrices() {
        console.log('[INTERVAL] App > updatePrices()');
        const updatedPrices = await getPrices();

        if (!isEmptyObj(updatedPrices)) setPrices(updatedPrices);
        setUpdateDatetime(new Date().toLocaleString());

        return;
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
            setActive(-1);
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
                    <div className='row side-scroll'>
                        {
                            !loadingPrices ? (
                                Object.entries(portfolios).map(([portfolioID, portfolio]) => (
                                    <Card
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
            <span class='update-timestamp font-sm'>Updated: {updateDatetime}</span>
        </main>
    );
}

export default App;
