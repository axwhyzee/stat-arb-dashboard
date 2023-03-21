import React from "react";
import SetItem from './SetItem';
import Form from './Form';
import { calcSpread, getPrice } from './helper';
import { useEffect, useState } from 'react';

const Sidebar = ({ id, spread, data, editPortfolio }) => {
    /**
     * Sidebar component for editing of active portfolio
     * 
     * @param {number}   id            ID of active portfolio
     * @param {number}   spread        Current spread value of active portfolio
     * @param {object[]} data          List of pair data, each containing FX symbol, entry price in points, beta value of pair in its current portfolio
     * @param {function} editPortfolio Triggers upstream function to edit active portfolio
     */
    const [pairs, setPairs] = useState(data);
    const [isExpanded, setIsExpanded] = useState(window.innerWidth > 380 ? true : false);
    const [errorMsg, setErrorMsg] = useState('');

    useEffect(() => {
        /**
         * When active portfolio or current active portfolio's data changes, set new portfolio pairs as pairs state
         */
        if (id !== -1) {
            setPairs(data);
        }
    }, [data, id])

    function toggleSidebar() {
        /**
         * Trigger window resize on sidebar expand/collapse so that graph updates its size
         */
        setIsExpanded(!isExpanded);
        window.dispatchEvent(new Event('resize'));
    }

    function removePair(pair) {
        /**
         * When pair is removed from portfolio, update pairs state and trigger upstream function to edit portfolio
         * 
         * @param {string} pair Symbol of FX pair to remove from active portfolio
         */
        let newPairs = pairs.filter((item) => item.pair !== pair);

        editPortfolio(id, newPairs);
        setPairs(newPairs);
    }

    async function addPair(pair, entry, beta) {
        /**
         * Conduct data validation and display error message on error, else trigger upstream function to edit active portfolio
         * 
         * @param {String} pair  Symbol of pair to be added to active portfolio
         * @param {number} entry Entry value in points of pair to be added to active portfolio
         * @param {number} beta  Beta value of pair to be added to active portfolio
         */

        // 1) check for missing pair or beta value
        if (!pair || !beta) {
            setErrorMsg('Missing required inputs')
            return;
        }
        if (!entry) entry = await getPrice(pair);

        let newPairs;
        const betaF = parseFloat(beta);
        const entryF = parseFloat(entry);

        // 2) check data type of beta & entry
        if (isNaN(beta) || betaF != beta || isNaN(entry) || entryF != entry) {
            setErrorMsg('Invalid number');
            return;
        }

        // 3) check if pair already exists
        for (const item of pairs) {
            if (item.pair === pair) {
                setErrorMsg('Pair already exists');
                return;
            }
        }

        setErrorMsg('');

        newPairs = [...pairs, { 'pair': pair, 'entry': entry, 'price': await getPrice(pair), 'beta': beta }];
        editPortfolio(id, newPairs);
        setPairs(newPairs); // use epoch for unique ID
    }

    return (
        <div className={'sidebar ' + (isExpanded ? '' : 'sidebar-collapse')}>
            {
                id !== -1
                    ? (
                        <>
                            <Form addPair={addPair} errorMsg={errorMsg} />

                            <div className='sidebar-wrapper'>
                                <div className='sidebar-header'>PAIRS</div>
                                <table className='full-width'>
                                    <tbody>
                                        <tr className='font-sm'>
                                            <th></th>
                                            <th className='align-right'>ENTRY</th>
                                            <th className='align-right'>PRICE</th>
                                            <th className='align-right'>BETA</th>
                                        </tr>
                                        {
                                            pairs.map((item, index) => (
                                                <SetItem key={index} item={item} removePair={removePair} />
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
                                            <td className='align-right'>{calcSpread(pairs.map((pair) => [pair.pair, pair.entry, pair.beta]))}</td>
                                        </tr>
                                        <tr className='font-sm'>
                                            <td>Current</td>
                                            <td className='align-right'>{spread}</td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>
                        </>
                    ) : (
                        <div className='sidebar-wrapper align-center'>Select a portfolio</div>
                    )
            }
            <button className='expand-sidebar' onClick={toggleSidebar}>&#9776;</button>
        </div>
    )
}

export default Sidebar;