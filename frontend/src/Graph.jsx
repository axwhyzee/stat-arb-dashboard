import React from 'react';
import { useState, useEffect, useRef } from 'react';
import * as d3 from 'd3';

const Graph = ({ spreadData, entry }) => {
    console.log(entry);
    const [data, setData] = useState([]);
    const svgRef = useRef();
    const width = 600;
    const height = 300;

    useEffect(() => {
        setData(spreadData);
    }, [spreadData]);

    useEffect(() => {
        if (!data.length) return;

        const svg = d3.select(svgRef.current);
        const xValue = (d) => d[0];
        const yValue = (d) => d[1];
        const xScale = d3
            .scaleTime()
            .domain(d3.extent(data, xValue))
            .range([0, width]);

        const yScale = d3
            .scaleLinear()
            .domain(d3.extent(data, yValue))
            .range([height, 0]);

        const lineGenerator = d3
            .line()
            .x((d) => xScale(xValue(d)))
            .y((d) => yScale(yValue(d)))
            .curve(d3.curveBasis);

        svg
            .selectAll('.line')
            .data([data])
            .join('path')
            .attr('class', 'line')
            .attr('d', (d) => lineGenerator(d))
            .attr('fill', 'none')
            .attr('stroke', 'white');
        /*
        svg
            .append('line')
            .attr("x1", data[0][0])
            .attr("y1", entry)
            .attr("x2", data[data.length - 1][0])
            .attr("y2", entry)
            .attr("stroke", "red")
            .attr("stroke-width", 1.5);
        */
    }, [data]);

    return (
        <div className='graph p-2'>
            <svg width={width} height={height} ref={svgRef}>
                <g className='x-axis' />
                <g className='y-axis' />
            </svg>
        </div>
    );
}

export default Graph;