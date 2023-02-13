import React from "react";
import { useState } from 'react';

const Form = ({ addPair }) => {
    const [pair, setPair] = useState();
    const [entry, setEntry] = useState()
    const [beta, setBeta] = useState()

    const onSubmit = (e) => { e.preventDefault() };

    return (
        <form className='user-form p-2 pt-1' onSubmit={onSubmit}>
            <div>
                <section className='row'>
                    <div className='p-1 col-6'>
                        <label className='input-label' htmlFor='pair'>Pair</label>
                        <select name='pair' className='user-input color-grey font-sm' onChange={e => setPair(e.target.value)}>
                            <option value=''>-----</option>
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
                        <input name='beta' className='user-input color-grey font-sm' placeholder='Beta value' onChange={e => setBeta(e.target.value)} />
                    </div>
                </section>
                <section className='p-1'>
                    <label className='input-label' htmlFor='entry'>Entry</label>
                    <input name='entry' className='user-input color-grey font-sm' onChange={e => setEntry(e.target.value)} />
                </section>
                <section>
                    <div className='p-1'>
                        <button class='btn-add font-sm' onClick={() => addPair(pair, entry, beta)}>ADD TO PORTFOLIO</button>
                    </div>
                </section>
            </div>
        </form>
    )
}

export default Form;