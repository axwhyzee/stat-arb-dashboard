import React from "react";
import CardItem from './CardItem';

const Card = ({ portfolioID, portfolio, setActive, spread, isActive }) => {
    /**
     * @param {number}   portfolioID ID of current portfolio
     * @param {Object[]} portfoliio  Array of objects, with each object containing value of a component in the current portfolio
     * @param {function} setActive   Triggers upstream function to set current portfolio as active portfolio
     * @param {number}   spread      Current spread value of portfolio
     * @param {boolean}  isActive    Is current portfolio active
     */
    return (
        <div className='p-2 pr-0'>
            <article className={'portfolio-card row ' + (isActive ? ' active-card' : '')} onClick={() => setActive(portfolioID)}>
                <div className='color-green card-spread'><h4>{spread}</h4></div>
                <div className='p-1'>
                    {
                        portfolio.length ? (
                            <div className='row'>
                                {portfolio.map((item, index) => (<CardItem key={index} item={item} />))}
                            </div>
                        ) : (<div className="p-1"></div>)
                    }
                </div>

            </article>
        </div>
    )
}

export default Card;