import './App.css';
import * as d3 from "d3";
import csvFile from './data.csv'

import React from 'react';
import { useState, useEffect } from 'react';

import Card from './Card';
import Graph from './Graph';
import Sidebar from './Sidebar';
import { getPip, calcSpread, getPrice, getPrices } from './helper';


const App = () => {
    const queryInterval = 1000 * 60 * 5; // 5 mins in ms
    const [intervalState, setIntervalState] = useState();
    const [csvData, setCsvData] = useState([]);
    const [active, setActive] = useState(-1);
    const [spreads, setSpreads] = useState({});
    const [prices, setPrices] = useState({ 'AUDCAD': 0, 'AUDCHF': 0, 'AUDJPY': 0, 'AUDNZD': 0, 'AUDUSD': 0, 'CADCHF': 0, 'CADJPY': 0, 'CHFJPY': 0, 'EURAUD': 0, 'EURCAD': 0, 'EURCHF': 0, 'EURGBP': 0, 'EURJPY': 0, 'EURNZD': 0, 'EURUSD': 0, 'GBPAUD': 0, 'GBPCAD': 0, 'GBPCHF': 0, 'GBPJPY': 0, 'GBPNZD': 0, 'GBPUSD': 0, 'NZDCAD': 0, 'NZDCHF': 0, 'NZDJPY': 0, 'NZDUSD': 0, 'USDCAD': 0, 'USDCHF': 0, 'USDJPY': 0 });
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

    useEffect(() => {
        const interval = setInterval(updatePrices, queryInterval);
        updatePrices(); // run once immediately since setInterval runs only after interval
        setIntervalState(interval);

        d3.csv(csvFile).then(function (data) {
            setCsvData(data);
        });

        return () => clearInterval(intervalState); // cleanup on unmount
    }, []);

    useEffect(() => {
        let spread;
        let cloneSpreads = {};
        for (const ID of Object.keys(portfolios)) {
            spread = 0;
            for (const item of portfolios[ID]) {
                spread += prices[item.pair] * item.beta;
            }
            cloneSpreads[ID] = spread;
        }
        setSpreads(cloneSpreads);
    }, [prices]);

    async function updatePrices() {
        console.log('Updating prices ...');
        const updatedPrices = await getPrices();
        console.log('Updated prices!');
        setPrices(updatedPrices);
    }

    function addPortfolio() {
        const ID = new Date().valueOf();
        const clonePortfolios = structuredClone(portfolios);
        const cloneSpreads = structuredClone(spreads);

        clonePortfolios[ID] = [{ 'pair': 'EURUSD', 'entry': 1.067, 'price': 1.067, 'beta': 1 }];
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

    function spreadFromCSV(active) {
        const pairs = portfolios[active].map((ele) => ([ele.pair, ele.beta]));
        const res = [];

        for (const row of csvData) {
            const temp = [row['datetime']];
            let spread = 0;

            for (const pair of pairs) {
                spread += row[pair[0]] * pair[1];
            }

            temp.push(spread);
            res.push(temp);
        }

        return res;
    }

    return (
        <main className='color-grey'>
            <Sidebar id={active} data={(active in portfolios) ? portfolios[active] : []} editPortfolio={editPortfolio} />

            <div className='main-wrapper'>
                {
                    active !== -1 ?
                        (<Graph
                            spreadData={spreadFromCSV(active)}
                            entry={portfolios[active].map((obj) => (obj.entry / getPip(obj.pair) * obj.beta)).reduce(function (a, b) { return a + b }, 0)}
                            current={portfolios[active].map((obj) => (obj.price / getPip(obj.pair) * obj.beta)).reduce(function (a, b) { return a + b }, 0)} />)
                        :
                        (<></>)
                }
                <div className='cards-wrapper pos-top'>
                    <div className='row side-scroll'>
                        {Object.entries(portfolios).map(([portfolioID, portfolio]) => (
                            <Card
                                portfolioID={portfolioID}
                                portfolio={portfolio}
                                setActive={setActive}
                                spread={spreads[portfolioID]}
                                isActive={portfolioID == active} />))}
                    </div>
                </div>
                <button className='add-portfolio' onClick={addPortfolio}>+</button>
            </div>
        </main>
    );
}

export default App;
