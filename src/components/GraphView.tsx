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

    const width = 300;
    const height = 300;
    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove(); // Clear previous

    // Setup simulation
    const simulation = d3.forceSimulation<GraphNode>(graph.nodes)
      .force("link", d3.forceLink<GraphNode, GraphLink>(graph.links).id(d => d.id).distance(60))
      .force("charge", d3.forceManyBody().strength(-100))
      .force("center", d3.forceCenter(width / 2, height / 2))
      .force("collide", d3.forceCollide().radius(20));

    // Links
    const link = svg.append("g")
      .selectAll("line")
      .data(graph.links)
      .join("line")
      .attr("stroke", d => {
        if (d.type === 'dominance') return "#8B1E2B"; // Oxblood
        if (d.type === 'alliance') return "#C9A34E"; // Gold
        return "#555";
      })
      .attr("stroke-width", d => Math.sqrt(d.value) * 2)
      .attr("opacity", 0.6);

    // Nodes
    const node = svg.append("g")
      .selectAll("circle")
      .data(graph.nodes)
      .join("circle")
      .attr("r", d => d.id === 'Subject' ? 8 : 5)
      .attr("fill", d => {
        if (d.group === 1) return "#C9A34E"; // Faculty (Gold)
        if (d.group === 2) return "#0B2F2A"; // Prefect (Green)
        return "#EDE9E1"; // Subject (Bone)
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
      .text(d => d.name.split(' ')[0]) // First name only
      .attr("font-size", "8px")
      .attr("fill", "#aaa")
      .attr("dx", 8)
      .attr("dy", 3);

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
    <div className="border-2 border-concrete bg-black bg-opacity-50 p-2 shadow-inner">
      <h3 className="text-xs font-heading text-concrete bg-renaissanceGold px-2 py-1 inline-block mb-2">NetworkX Graph</h3>
      <svg ref={svgRef} width="100%" height="300" viewBox="0 0 300 300" className="overflow-visible"></svg>
    </div>
  );
};
