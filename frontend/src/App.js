import React from 'react';
import './App.css';
import Card from './Card';
import SetItem from './SetItem';
import Form from './Form';

import { useEffect, useState } from 'react';

const API_URL = 'https://stat-arbitrage-dashboard.onrender.com/spread/';

const App = () => {
    const [pairs, setPairs] = useState([{ 'ID': 1, 'AUDUSD': 1 }, { 'ID': 2, 'CADCHF': -4.0686013955488303 }]);
    const [data, setData] = useState({ 'spread': 0 });

    const calcSpread = async (pairs, betas) => {
        const response = await fetch(`${API_URL}?pairs=${pairs.join('&pairs=')}&betas=${betas.join('&betas=')}`);
        const data = await response.json();

        console.log(data);

        setData(data);
    }

    useEffect(() => {
        calcSpread(['AUDUSD', 'CADCHF'], [1, -4.0686013955488303]);
    }, []) // run on DOM load


    function removePair(id) {
        let newPairs = pairs;

        console.log(id);
        console.log(pairs);
        for (let i = 0; i < pairs.length; i++) {
            if (pairs[i] == id) {
                console.log('Updated!');
                console.log(id);
                setPairs(newPairs.splice(id, 1));
                return
            }
        }
    }

    return (
        <div className='color-grey'>
            <div className='sidebar'>
                <Form />
                {
                    pairs.map((item) => (
                        <SetItem removePair={removePair} info={{ 'ID': item.id, 'pair': item.pair, 'beta': item.beta }} />
                    ))
                }
            </div>
            <main>
                <Card data={data} />
            </main>
        </div>
    );
}

export default App;
