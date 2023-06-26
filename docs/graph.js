import * as d3 from 'd3';
import { Graph } from '@cosmograph/cosmos';

const canvas = document.querySelector('canvas');

const config = {
  simulation: {
    repulsion: 0.5,
  },
  renderLinks: true,
  linkColor: link => link.color,
  nodeColor: node => node.color,
  events: {
    onClick: node => { console.log('Clicked node: ', node) },
  },
};

const graph = new Graph(canvas, config);

d3.csv('data.csv').then(data => {
  const nodes = Array.from(new Set(data.flatMap(d => [d.source, d.target])), id => ({id}));
  const links = data.map(d => ({source: d.source, target: d.target, color: d.color}));
  graph.setData(nodes, links);
});