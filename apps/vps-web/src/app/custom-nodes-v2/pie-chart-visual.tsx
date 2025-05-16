import { NodeVisual } from '@devhelpr/visual-programming-system';
import { NodeInfo } from '@devhelpr/web-flow-executor';
import * as d3 from 'd3';
/*
  TODO : fix that this work for both main thread and worker

  ... currently this is only used in the worker AND it is also called from the main thread when 
    using the Timeline slider... but with the wrong input (the result of the previous node
    ... instead of the output of the current node)
  )


  ... sendOutputNode opgeven aan flowengine?

*/

// Define proper types for pie chart data
interface PieDataItem {
  name: string;
  value: number;
  // Using unknown instead of any for better type safety
  [key: string]: string | number | boolean | unknown;
}

type PieData = PieDataItem[] & { columns?: string[] };

// Define a type for the input data structure
type InputDataTuple = [string, number];

export class PieChartVisual extends NodeVisual<NodeInfo> {
  constructor() {
    super();
  }

  lastData: PieData | undefined = undefined;
  updateVisual = (
    data: unknown,
    parentNode: HTMLElement,
    // Using underscore prefix to indicate intentionally unused parameter
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _nodeInfo: NodeInfo
  ) => {
    this.lastData = Array.isArray(data)
      ? data.map((d: InputDataTuple | Record<string, unknown>) => {
          // Handle both array-like and object-like structures
          if (Array.isArray(d)) {
            return {
              name: String(d[0]),
              value: Number(d[1]),
            };
          } else if (d && typeof d === 'object') {
            // Handle object format with name/value keys
            const name = d.name !== undefined ? String(d.name) : 'Unknown';
            const value = d.value !== undefined ? Number(d.value) : 0;
            return { name, value };
          }
          return { name: 'Unknown', value: 0 };
        })
      : undefined;

    console.log('pieChartVisual', data);
    // Clear the parent node before rendering... should this be handled by the framework?

    const renderPie = () => {
      parentNode.innerHTML = '';
      const width = parentNode.clientWidth;
      const height = Math.min(width, parentNode.clientHeight);
      const pieData: PieData = this.lastData
        ? structuredClone(this.lastData)
        : [
            { name: 'A', value: 100 },
            { name: 'B', value: 200 },
            { name: 'C', value: 300 },
            { name: 'D', value: 400 },
            { name: 'E', value: 500 },
            { name: 'F', value: 600 },
            { name: 'G', value: 700 },
            { name: 'H', value: 800 },
            { name: 'I', value: 900 },
            { name: 'J', value: 1000 },
          ];

      pieData.columns = ['name', 'value'];

      // Create the color scale.
      const color = d3
        .scaleOrdinal<string>()
        .domain(pieData.map((d) => d.name))
        .range(
          d3
            .quantize(
              (t) => d3.interpolateSpectral(t * 0.8 + 0.1),
              pieData.length
            )
            .reverse()
        );

      // Create the pie layout and arc generator.
      const pie = d3
        .pie<PieDataItem>()
        .sort(null)
        .value((d) => d.value);

      const arc = d3
        .arc<d3.PieArcDatum<PieDataItem>>()
        .innerRadius(0)
        .outerRadius(Math.min(width, height) / 2 - 1);

      // Fix the arc.outerRadius()() issue by calculating the value directly
      const outerRadiusValue = Math.min(width, height) / 2 - 1;
      const labelRadius = outerRadiusValue * 0.8;

      // A separate arc generator for labels.
      const arcLabel = d3
        .arc<d3.PieArcDatum<PieDataItem>>()
        .innerRadius(labelRadius)
        .outerRadius(labelRadius);

      const arcs = pie(pieData);

      // Create the SVG container.
      const svg = d3
        .create('svg')
        .attr('width', width)
        .attr('height', height)
        .attr('viewBox', [-width / 2, -height / 2, width, height].join(' '))
        .attr('style', 'max-width: 100%; height: auto; font: 10px sans-serif;');

      // Add a sector path for each value.
      svg
        .append('g')
        .attr('stroke', 'white')
        .selectAll<SVGPathElement, d3.PieArcDatum<PieDataItem>>('path')
        .data(arcs)
        .join('path')
        .attr('fill', (d) => color(d.data.name))
        .attr('d', arc)
        .append('title')
        .text((d) => `${d.data.name}: ${d.data.value.toLocaleString('en-US')}`);

      // Create labels
      svg
        .append('g')
        .attr('text-anchor', 'middle')
        .selectAll<SVGTextElement, d3.PieArcDatum<PieDataItem>>('text')
        .data(arcs)
        .join('text')
        .attr('transform', (d) => `translate(${arcLabel.centroid(d)})`)
        .call((text) =>
          text
            .append('tspan')
            .attr('y', '-0.4em')
            .attr('font-weight', 'bold')
            .text((d) => d.data.name)
        )
        .call((text) =>
          text
            .filter((d) => d.endAngle - d.startAngle > 0.25)
            .append('tspan')
            .attr('x', 0)
            .attr('y', '0.7em')
            .attr('fill-opacity', 0.7)
            .text((d) => d.data.value.toLocaleString('en-US'))
        );

      parentNode.appendChild(svg.node() as Node);
    };

    renderPie();

    this.resizeObserver = new ResizeObserver((entries) => {
      if (this.isResizing) return;
      if (!entries || entries.length === 0) return;
      this.isResizing = true;
      try {
        renderPie();
      } finally {
        this.isResizing = false;
      }
    });

    if (parentNode) {
      this.resizeObserver.observe(parentNode); // Start observing the container
    }
  };

  isResizing = false;
  resizeObserver: ResizeObserver | undefined = undefined;

  destroy() {
    if (this.resizeObserver) {
      this.resizeObserver.disconnect();
      this.resizeObserver = undefined;
    }
  }
}
