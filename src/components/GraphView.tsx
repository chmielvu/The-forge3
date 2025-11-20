import React, { useEffect, useRef } from 'react';
import * as d3 from 'd3';
import { KnowledgeGraph, GraphNode, GraphLink } from '../types';

interface GraphViewProps {
  graph: KnowledgeGraph;
}

export const GraphView: React.FC<GraphViewProps> = ({ graph }) => {
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (!svgRef.current || !graph.nodes.length) return;

    const width = 250;
    const height = 250;
    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();

    const simulation = d3.forceSimulation<GraphNode>(graph.nodes)
      .force("link", d3.forceLink<GraphNode, GraphLink>(graph.links).id(d => d.id).distance(50))
      .force("charge", d3.forceManyBody().strength(-80))
      .force("center", d3.forceCenter(width / 2, height / 2))
      .force("collide", d3.forceCollide().radius(15));

    // Links
    const link = svg.append("g")
      .selectAll("line")
      .data(graph.links)
      .join("line")
      .attr("stroke", d => {
        if (d.type === 'dominance') return "#881337"; // Oxblood
        if (d.type === 'alliance') return "#a16207"; // Gold
        return "#3f3f46"; // Zinc 700
      })
      .attr("stroke-width", 1)
      .attr("opacity", 0.6);

    // Nodes
    const node = svg.append("g")
      .selectAll("circle")
      .data(graph.nodes)
      .join("circle")
      .attr("r", 4)
      .attr("fill", d => {
        if (d.group === 1) return "#a16207"; // Faculty
        if (d.group === 2) return "#047857"; // Prefect
        return "#e4e4e7"; // Subject
      })
      .call(d3.drag<SVGCircleElement, GraphNode>()
        .on("start", dragstarted)
        .on("drag", dragged)
        .on("end", dragended));

    // Labels
    const labels = svg.append("g")
      .selectAll("text")
      .data(graph.nodes)
      .join("text")
      .text(d => d.name.split(' ')[0])
      .attr("font-size", "8px")
      .attr("font-family", "monospace")
      .attr("fill", "#71717a") // Zinc 500
      .attr("dx", 6)
      .attr("dy", 2);

    simulation.on("tick", () => {
      link
        .attr("x1", d => (d.source as GraphNode).x!)
        .attr("y1", d => (d.source as GraphNode).y!)
        .attr("x2", d => (d.target as GraphNode).x!)
        .attr("y2", d => (d.target as GraphNode).y!);

      node
        .attr("cx", d => d.x!)
        .attr("cy", d => d.y!);
        
      labels
        .attr("x", d => d.x!)
        .attr("y", d => d.y!);
    });

    function dragstarted(event: any, d: GraphNode) {
      if (!event.active) simulation.alphaTarget(0.3).restart();
      d.fx = d.x;
      d.fy = d.y;
    }

    function dragged(event: any, d: GraphNode) {
      d.fx = event.x;
      d.fy = event.y;
    }

    function dragended(event: any, d: GraphNode) {
      if (!event.active) simulation.alphaTarget(0);
      d.fx = null;
      d.fy = null;
    }

    return () => {
      simulation.stop();
    };
  }, [graph]);

  return (
    <svg ref={svgRef} width="100%" height="250" viewBox="0 0 250 250" className="overflow-visible bg-transparent"></svg>
  );
};