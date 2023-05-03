import React from "react";
import { roundOff } from './helper'

const SetItem = ({ item, removePair }) => {


    return (
        <tr className="set-item-info font-sm">
            <td className='pair-info'>{item.pair}</td>
            <td className='entry-info align-right'>{roundOff(item.entry, 4)}</td>
            <td className='entry-info align-right'>{roundOff(item.price, 4)}</td>
            <td className='beta-info align-right'>{roundOff(item.beta, 4)}</td>
            <td className="align-right">
                <button className='remove-set-item' onClick={() => removePair(item.pair)}>X</button>
            </td>
        </tr>
    )
}

export default SetItem;