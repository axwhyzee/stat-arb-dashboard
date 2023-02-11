import React from "react";
import SetItem from './SetItem';
import Form from './Form';
import { roundOff, calcSpread } from './helper';
import { useEffect, useState } from 'react';

const API_URL = 'https://stat-arbitrage-dashboard.onrender.com/spread/';

const Sidebar = ({ id, data, editPortfolio }) => {
    const [pairs, setPairs] = useState(data);
    const [spread, setSpread] = useState(0);

    const getSpread = async () => {
        let argPairs = '';
        let argBetas = '';

        if (pairs.length === 0) return;

        for (const item of pairs) {
            argPairs += '&pairs=' + item.pair;
            argBetas += '&betas=' + item.beta;
        }

        const response = await fetch(`${API_URL}?${argPairs}${argBetas}`);
        const data = await response.json();

        setSpread(data.spread);
    }

    useEffect(() => {
        if (id !== -1) {
            getSpread();
            setPairs(data);
        }
    }, [data, id])

    function removePair(pair) {
        let newPairs = pairs.filter((item) => item.pair !== pair);
        editPortfolio(id, newPairs);
        setPairs(newPairs);

    }

    function addPair(pair, entry, beta) {
        // data validation
        // 1) check for empty inputs
        if (!pair || !entry || !beta) {
            console.log('Empty input');
            return;
        }

        let newPairs;
        const betaF = parseFloat(beta);
        const entryF = parseFloat(entry);

        // 2) check data type of beta & entry
        if (isNaN(beta) || betaF !== beta || isNaN(entry) || entryF !== entry) {
            console.log('Invalid data type');
            return;
        }

        // 3) check if pair already exists
        for (const item of pairs) {
            if (item.pair === pair) {
                console.log('Pair already exists');
                return;
            }
        }

        newPairs = [...pairs, { 'pair': pair, 'entry': entry, 'beta': beta }];
        editPortfolio(id, newPairs);
        setPairs(newPairs); // use epoch for unique ID
    }

    return (
        <div className='sidebar'>
            {
                id !== -1
                    ? (
                        <>
                            <Form addPair={addPair} />
                            <div className='sidebar-wrapper'>
                                <div className='sidebar-header'>SET</div>
                                <div className='font-sm'>
                                    Default name
                                </div>
                                <div className='sidebar-divider'></div>
                                <div className='sidebar-header'>PAIRS</div>
                                <table className='full-width'>
                                    <tbody>
                                        {
                                            pairs.map((item) => (
                                                <SetItem item={item} removePair={removePair} />
                                            ))
                                        }
                                    </tbody>
                                </table>
                                <div className='sidebar-divider'></div>
                                <div className='sidebar-header'>SPREAD</div>
                                <table className='full-width'>
                                    <tbody>
                                        <tr className='font-sm'>
                                            <td>Entry</td>
                                            <td className='align-right'>{roundOff(calcSpread(pairs.map((pair) => [pair.pair, pair.price, pair.beta])), 5)}</td>
                                        </tr>
                                        <tr className='font-sm'>
                                            <td>Current</td>
                                            <td className='align-right'>{roundOff(spread, 5)}</td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>
                        </>
                    ) : (
                        <></>
                    )
            }
        </div>
    )
}

export default Sidebar;