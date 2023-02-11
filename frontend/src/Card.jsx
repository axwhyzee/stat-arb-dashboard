import React from "react";
import CardItem from './CardItem';

const Card = ({ portfolioID, portfolio, setActive, spread }) => {
    return (
        <article className='pl-2' onClick={() => setActive(portfolioID)}>
            <div className='portfolio-card'>
                <div className='row'>
                    {portfolio.map((item) => (<CardItem item={item} />))}   
                </div>
                <h4></h4>
            </div>
        </article>
    )
}

export default Card;