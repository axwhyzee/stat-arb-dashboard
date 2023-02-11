import React from "react";
import { roundOff } from "./helper";

const CardItem = ({ item }) => {
    return (
        <div className='card-item p-1'>
            <div><b>{item.pair}</b></div>
            <div className='font-sm align-center color-red'>{roundOff(item.beta, 5)}</div>
        </div>
    )
}

export default CardItem;