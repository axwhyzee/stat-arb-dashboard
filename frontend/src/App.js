import React from 'react';
import './App.css';

import { useEffect } from 'react';

const API_URL = 'http://stat-arbitrage-dashboard.onrender.com/spread/';

const App = () => {
    const calcSpread = async (pairs, betas) => {
        const response = await fetch(`${API_URL}?pairs=${pairs.join('&pairs=')}&betas=${betas.join('&betas=')}`);
        const data = await response.json();

        console.log(data);
        return data.spread;
    }

    useEffect(() => {
        calcSpread(['AUDUSD', 'CADCHF'], [1, -4.0686013955488303]);
    }, []) // run on DOM load

    return (
        <>
            <div className='sidebar color-grey'>
                <form className='user-form'>
                    <div>
                        <section className='p-1'>
                            <label className='input-label' htmlFor='set-name'>Set Name</label>
                            <input name='set-name' className='user-input color-grey' placeholder='Enter a name' />
                        </section>
                        <section className='row'>
                            <div className='p-1 col-6'>
                                <label className='input-label' htmlFor=''>Pair</label>
                                <select name='pair' className='user-input color-grey'>
                                    <option value='AUDCAD'>AUDCAD</option>
                                    <option value='AUDCHF'>AUDCHF</option>
                                    <option value='AUDJPY'>AUDJPY</option>
                                    <option value='AUDNZD'>AUDNZD</option>
                                    <option value='AUDUSD'>AUDUSD</option>
                                    <option value='CADCHF'>CADCHF</option>
                                    <option value='CADJPY'>CADJPY</option>
                                    <option value='CHFJPY'>CHFJPY</option>
                                    <option value='EURAUD'>EURAUD</option>
                                    <option value='EURCAD'>EURCAD</option>
                                    <option value='EURCHF'>EURCHF</option>
                                    <option value='EURGBP'>EURGBP</option>
                                    <option value='EURJPY'>EURJPY</option>
                                    <option value='EURNZD'>EURNZD</option>
                                    <option value='EURUSD'>EURUSD</option>
                                    <option value='GBPAUD'>GBPAUD</option>
                                    <option value='GBPCAD'>GBPCAD</option>
                                    <option value='GBPCHF'>GBPCHF</option>
                                    <option value='GBPJPY'>GBPJPY</option>
                                    <option value='GBPNZD'>GBPNZD</option>
                                    <option value='GBPUSD'>GBPUSD</option>
                                    <option value='NZDCAD'>NZDCAD</option>
                                    <option value='NZDCHF'>NZDCHF</option>
                                    <option value='NZDJPY'>NZDJPY</option>
                                    <option value='NZDUSD'>NZDUSD</option>
                                    <option value='USDCAD'>USDCAD</option>
                                    <option value='USDCHF'>USDCHF</option>
                                    <option value='USDJPY'>USDJPY</option>
                                </select>
                            </div>
                            <div className='p-1 col-6'>
                                <label className='input-label' htmlFor='beta'>Beta</label>
                                <input name='beta' className='user-input color-grey' placeholder='Beta value' />
                            </div>
                        </section>
                        <section>
                            <div className='p-1'>
                                <button class='btn btn-success color-grey'>ADD</button>
                            </div>
                        </section>
                    </div>
                </form>
            </div>
            <main>

            </main>
        </>
    );
}

export default App;