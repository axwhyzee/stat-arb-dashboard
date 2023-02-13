import React from "react";
import CardItem from './CardItem';

const Card = ({ portfolioID, portfolio, setActive, spread, isActive }) => {
    return (
        <div className='p-2 pr-0'>
            <article className={'portfolio-card row ' + (isActive ? ' active-card' : '')} onClick={() => setActive(portfolioID)}>
                <div className='card-spread'><h4>{spread}</h4></div>
                <div className='p-1'>
                    {
                        portfolio.length ? (
                            <div className='row'>
                                {portfolio.map((item) => (<CardItem item={item} />))}
                            </div>
                        ) : (<div className="p-1"></div>)
                    }
                </div>

            </article>
        </div>
    )
}

export default Card;