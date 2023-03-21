import React from 'react';
import Spinner from './Spinner';
import { useState, useEffect, useRef } from 'react';
import * as d3 from 'd3';


const Graph = ({ graphData, entry, current }) => {
    /**
     * Graph of spread values
     * 
     * @param {number[][]} graphData 2D array of data points in [x, y] format, where x=unix timestamp, y=spread in points
     * @param {number}     entry     Entry spread in points
     * @param {number}     current   Current spread in points
     */
    const [resize, setResize] = useState();
    const [data, setData] = useState([]);
    const [loadingGraph, setLoadingGraph] = useState(false);
    const svgRef = useRef();
    const svg = d3.select(svgRef.current);
    const shiftY = 95;
    const shiftY2 = 20 + shiftY;
    const shiftX = 40;

    let graphObj;
    let graphPos;
    let graphX;
    let graphY;
    let width;
    let height;

    // update state on window resize to trigger re-render of graph to fit graph within new window dimensions
    function resizeHandler() {
        setResize(new Date().valueOf());
    }

    // update data state whenever graph data updates
    useEffect(() => {
        setData(graphData);
    }, [graphData])

    useEffect(() => {
        window.addEventListener('resize', resizeHandler, false);
    }, []);

    useEffect(() => {
        // display loading spinning
        setLoadingGraph(true);

        if (!data.length) return;

        // reset graph
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
                .range([0, width /*- shiftX - 20*/]);

            const yScale = d3
                .scaleLinear()
                .domain(d3.extent(data, yValue))
                .range([height /*- shiftY - 40*/, 0]);

            const lineGenerator = d3
                .line()
                .x((d) => xScale(xValue(d)))
                .y((d) => yScale(yValue(d)))
                .curve(d3.curveMonotoneX);

            const xAxis = d3.axisBottom(xScale)
                .ticks(5)
                .tickFormat(function (d) {
                    const date = new Date(0);
                    date.setUTCSeconds(d);
                    return `${date.getDate()} / ${date.getMonth() + 1} / ${date.getFullYear()}`;
                });

            const yAxis = d3.axisLeft(yScale)
                .ticks(5);

            console.log(shiftX, shiftY2);
            svg
                .selectAll('.line')
                .data([data])
                .join('path')
                .attr('class', 'line')
                .attr('d', (d) => lineGenerator(d))
                .attr('fill', 'none')
                .attr('stroke', '#b8e691')
                .attr('stroke-width', 0.2)
                /*.attr('transform', 'translate(' + shiftX + ',' + shiftY2 + ')')*/;

            graphObj = svg.select('path');
            graphPos = graphObj['_groups'][0][0].getBoundingClientRect();
            graphX = graphPos['left'];
            graphY = graphPos['top'];

            let crosshair = d3
                .select(".crosshair")
                .style("left", graphX + 'px')
                .style("top", graphY + 'px')
                .style("width", graphPos['width'] + 'px')
                .style("height", graphPos['height'] + 'px');

            let crosshairX = d3
                .select(".crosshair-x")

            let crosshairY = d3
                .select(".crosshair-y")

            const crosshair_mousemove = (event) => {
                crosshairY.style("left", event.pageX - graphX - window.pageXOffset + "px");
                crosshairX.style("top", event.pageY - graphY - window.pageYOffset + "px");
            }

            crosshair.on("mouseenter", () => { crosshair.style("opacity", 1) });
            crosshair.on("mouseleave", () => { crosshair.style("opacity", 0) });
            crosshair.on("mousemove", crosshair_mousemove);

            svg
                .selectAll("myCircles")
                .data(data)
                .enter()
                .append("circle")
                .attr("fill", "#6dd172")
                .attr("stroke", "none")
                .attr("cx", (d) => xScale(xValue(d))/* + shiftX*/)
                .attr("cy", (d) => yScale(yValue(d))/* + shiftY2*/)
                .attr("r", 1.5);

            // entry spread
            svg
                .append('line')
                .attr('x1', xScale(data[0][0])/* + shiftX*/)
                .attr('y1', yScale(entry)/* + shiftY2*/)
                .attr('x2', xScale(data[data.length - 1][0])/* + shiftX*/)
                .attr('y2', yScale(entry)/* + shiftY2*/)
                .attr('stroke', '#d15a54')
                .attr('stroke-width', .8);

            // current spread
            svg
                .append('line')
                .attr('x1', xScale(data[0][0])/* + shiftX*/)
                .attr('y1', yScale(current)/* + shiftY2*/)
                .attr('x2', xScale(data[data.length - 1][0])/* + shiftX*/)
                .attr('y2', yScale(current)/* + shiftY2*/)
                .attr('stroke', '#bd7d46')
                .attr('stroke-width', .8)
                .attr('onload', function () {
                    setLoadingGraph(false);
                });

        }, 500);

        return () => clearTimeout(timeout);
    }, [data, resize]);

    return (
        <div className='graph-wrapper'>
            <div className='graph'>
                {
                    loadingGraph ? (
                        <Spinner width={50} height={50}></Spinner>
                    ) : (<></>)
                }
                <svg ref={svgRef}>
                    <g className='x-axis' />
                    <g className='y-axis' />
                </svg>
                <div class='crosshair'>
                    <div class='crosshair-x'></div>
                    <div class='crosshair-y'></div>
                </div>
            </div>
        </div>
    );
}

export default Graph;