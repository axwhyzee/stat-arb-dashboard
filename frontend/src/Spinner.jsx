import React from "react";

const Spinner = ({ width, height }) => {
    /**
     * Loading spinner
     * 
     * @param {number} width  Width in px of spinner element
     * @param {number} height Height in px of spinner element
     */
    return (
        <div style={{width:width + 'px', height:height + 'px'}} className='loading-spinner-wrapper'>
            <div className='loading-spinner'></div>
        </div>
    )
}

export default Spinner;