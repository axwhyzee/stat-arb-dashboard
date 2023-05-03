import React from "react";

const Spinner = ({ width, height }) => {
    return (
        <div style={{width:width + 'px', height:height + 'px'}} className='loading-spinner-wrapper'>
            <div className='loading-spinner'></div>
        </div>
    )
}

export default Spinner;