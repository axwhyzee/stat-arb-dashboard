import React from "react";
import { roundOff } from "./helper";

const CardItem = ({ item }) => {
    /**
     * Singular FX pair component in a portfolio
     * 
     * @param {Object} item Object containing pair's symbol and beta value
     */
    return (
        <div className='card-item'>
            <div className='font-md'><b>{item.pair}</b></div>
            <div className='font-sm align-center color-green'>{roundOff(item.beta, 4)}</div>
        </div>
    )
}

export default CardItem;