import React from "react";

const SetItem = ({ info, removePair }) => {
    const roundOff = (x, dp) => {
        let base = Math.pow(10, dp);

        return Math.round(info.beta * base) / base;
    }

    return (
        <div className="set-item-info font-sm full-width">
            <span className='pair-info'>{info.pair}</span>
            <span className='beta-info'>{roundOff(info.beta, 5)}</span>
            <button onclick={removePair(info.ID)}></button>
        </div>
    )
}

export default SetItem;