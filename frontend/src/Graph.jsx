import React from 'react';
import Spinner from './Spinner';
import { useState, useEffect, useRef } from 'react';
import * as d3 from 'd3';
import { curveMonotoneX } from 'd3';

const Graph = ({ graphData, entry, current }) => {
    const [resize, setResize] = useState();
    const [data, setData] = useState([]);
    const [loadingGraph, setLoadingGraph] = useState(false);
    const svgRef = useRef();
    const svg = d3.select(svgRef.current);
    const shiftY = 95;
    const shiftY2 = 20 + shiftY;
    const shiftX = 40;

    let width;
    let height;

    function resizeHandler() {
        setResize(new Date().valueOf());
    }

    useEffect(() => {
        setData(graphData);
    }, [graphData])

    useEffect(() => {
        window.addEventListener('resize', resizeHandler, false);
    }, []);

    useEffect(() => {
        setLoadingGraph(true);

        if (!data.length) return;

        svg.selectAll('*').remove();

        // wait for sidebar transition to finish
        const timeout = setTimeout(() => {
            width = parseFloat(svg.style('width'));
            height = parseFloat(svg.style('height'));

            const xValue = (d) => d[0];
            const yValue = (d) => d[1];
            const xScale = d3
                .scaleLinear()
                .domain(d3.extent(data, xValue))
                .range([0, width - shiftX - 20]);

            const yScale = d3
                .scaleLinear()
                .domain(d3.extent(data, yValue))
                .range([height - shiftY - 40, 0]);

            const lineGenerator = d3
                .line()
                .x((d) => xScale(xValue(d)))
                .y((d) => yScale(yValue(d)))
                .curve(curveMonotoneX);

            const xAxis = d3.axisBottom(xScale)
                .ticks(5)
                .tickFormat(function (d) {
                    const date = new Date(0);
                    date.setUTCSeconds(d);
                    return `${date.getDate()} / ${date.getMonth() + 1} / ${date.getFullYear()}`;
                });

            const yAxis = d3.axisLeft(yScale)
                .ticks(5);

            svg
                .selectAll('.line')
                .data([data])
                .join('path')
                .attr('class', 'line')
                .attr('d', (d) => lineGenerator(d))
                .attr('fill', 'none')
                .attr('stroke', '#b8e691')
                .attr('stroke-width', 0.2)
                .attr('transform', 'translate(' + shiftX + ',' + shiftY2 + ')');

            svg
                .selectAll("myCircles")
                .data(data)
                .enter()
                .append("circle")
                .attr("fill", "#6dd172")
                .attr("stroke", "none")
                .attr("cx", (d) => xScale(xValue(d)) + shiftX)
                .attr("cy", (d) => yScale(yValue(d)) + shiftY2)
                .attr("r", 1);

            svg
                .append('g')
                .attr('class', 'x axis')
                .attr('transform', 'translate(' + shiftX + ',' + (height - 20) + ')')
                .call(xAxis);

            svg
                .append('g')
                .attr('class', 'y axis')
                .attr('transform', 'translate(' + shiftX + ',' + shiftY2 + ')')
                .call(yAxis);

            // entry spread
            svg
                .append('line')
                .attr('x1', xScale(data[0][0]) + shiftX)
                .attr('y1', yScale(entry) + shiftY2)
                .attr('x2', xScale(data[data.length - 1][0]) + shiftX)
                .attr('y2', yScale(entry) + shiftY2)
                .attr('stroke', '#d15a54')
                .attr('stroke-width', .8);

            // current spread
            svg
                .append('line')
                .attr('x1', xScale(data[0][0]) + shiftX)
                .attr('y1', yScale(current) + shiftY2)
                .attr('x2', xScale(data[data.length - 1][0]) + shiftX)
                .attr('y2', yScale(current) + shiftY2)
                .attr('stroke', '#bd7d46')
                .attr('stroke-width', .8)
                .attr('onload', function () {
                    setLoadingGraph(false);
                });

        }, 500);

        return () => clearTimeout(timeout);
    }, [data, resize]);

    return (
        <div className='graph p-3'>
            {
                loadingGraph ? (
                    <Spinner width={50} height={50}></Spinner>
                ) : (<></>)
            }
            <svg ref={svgRef}>
                <g className='x-axis' />
                <g className='y-axis' />
            </svg>
        </div>
    );
}

export default Graph;