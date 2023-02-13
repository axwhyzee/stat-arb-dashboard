import React from "react";
import { roundOff } from "./helper";

const CardItem = ({ item }) => {
    return (
        <div className='card-item'>
            <div className='font-md'><b>{item.pair}</b></div>
            <div className='font-sm align-center color-green'>{roundOff(item.beta, 4)}</div>
        </div>
    )
}

export default CardItem;