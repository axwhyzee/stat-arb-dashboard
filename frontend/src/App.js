import React from 'react';
import './App.css';
import Card from './Card';
import Graph from './Graph';
import Sidebar from './Sidebar';
import { getPip, calcSpread, getPrice } from './helper';
import { useState, useEffect } from 'react';
import * as d3 from "d3";
import csvFile from './data.csv'


const App = () => {
    const [csvData, setCsvData] = useState([]);
    const [active, setActive] = useState(-1);
    const [spreads, setSpreads] = useState({});
    const [prices, setPrices] = useState({'AUDCAD':0,'AUDCHF':0,'AUDJPY':0,'AUDNZD':0,'AUDUSD':0,'CADCHF':0,'CADJPY':0,'CHFJPY':0,'EURAUD':0,'EURCAD':0,'EURCHF':0,'EURGBP':0,'EURJPY':0,'EURNZD':0,'EURUSD':0,'GBPAUD':0,'GBPCAD':0,'GBPCHF':0,'GBPJPY':0,'GBPNZD':0,'GBPUSD':0,'NZDCAD':0,'NZDCHF':0,'NZDJPY':0,'NZDUSD':0,'USDCAD':0,'USDCHF':0,'USDJPY':0});
    const [portfolios, setPortfolios] = useState({
        '16738791335': [
            { 'pair': 'AUDUSD', 'entry': 0.6889, 'beta': 1 },
            { 'pair': 'CADCHF', 'entry': 0.68788, 'beta': -4.0686013955488303 }
        ],
        '1673879235': [
            { 'pair': 'EURJPY', 'entry': 125.632, 'beta': 1 },
            { 'pair': 'GBPJPY', 'entry': 136.2049, 'beta': -1.2 }
        ]
    });

    useEffect(() => {
        d3.csv(csvFile).then(function (data) {
            console.log(data.length, 'rows');
            setCsvData(data);
        });
    }, []);

    function editPortfolio(id, newPortfolio) {
        const clonePortfolios = structuredClone(portfolios);
        const cloneSpreads = structuredClone(spreads);

        if (newPortfolio.length) {
            clonePortfolios[id] = newPortfolio;
            cloneSpreads[id] = calcSpread(newPortfolio.map((pair) => ([pair.pair, getPrice(pair.pair), pair.beta])));
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
                <div className='row side-scroll'>
                    {Object.entries(portfolios).map(([portfolioID, portfolio]) => (<Card portfolioID={portfolioID} portfolio={portfolio} setActive={setActive} spread={spreads[portfolioID]} />))}
                </div>
                {
                    active !== -1 ?
                        (<Graph spreadData={spreadFromCSV(active)} entry={portfolios[active].map((obj) => (obj.entry / getPip(obj.pair) * obj.beta)).reduce(function (a, b) { return a + b }, 0)} />)
                        :
                        (<></>)
                }

            </div>
        </main>
    );
}

export default App;
