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

export class PieChartVisual extends NodeVisual<NodeInfo> {
  constructor() {
    super();
  }

  lastData: unknown = undefined;
  updateVisual = (
    data: unknown,
    parentNode: HTMLElement,
    _nodeInfo: NodeInfo
  ) => {
    this.lastData = (data as any[])?.map((d: any) => {
      return {
        name: d[0],
        value: d[1],
      };
    });
    console.log('pieChartVisual', data);
    // Clear the parent node before rendering... should this be handled by the framework?

    const renderPie = () => {
      parentNode.innerHTML = '';
      const width = parentNode.clientWidth;
      const height = Math.min(width, parentNode.clientHeight);
      const data = this.lastData
        ? structuredClone(this.lastData as any)
        : [
            {
              name: 'A',
              value: 100,
            },
            {
              name: 'B',
              value: 200,
            },
            {
              name: 'C',
              value: 300,
            },
            {
              name: 'D',
              value: 400,
            },
            {
              name: 'E',
              value: 500,
            },
            {
              name: 'F',
              value: 600,
            },
            {
              name: 'G',
              value: 700,
            },
            {
              name: 'H',
              value: 800,
            },
            {
              name: 'I',
              value: 900,
            },
            {
              name: 'J',
              value: 1000,
            },
          ];
      data['columns'] = ['name', 'value'];
      // Create the color scale.
      const color = d3
        .scaleOrdinal()
        .domain(data.map((d) => d.name))
        .range(
          d3
            .quantize((t) => d3.interpolateSpectral(t * 0.8 + 0.1), data.length)
            .reverse()
        );

      // Create the pie layout and arc generator.
      const pie = d3
        .pie()
        .sort(null)
        .value((d) => d.value);

      const arc = d3
        .arc()
        .innerRadius(0)
        .outerRadius(Math.min(width, height) / 2 - 1);

      const labelRadius = arc.outerRadius()() * 0.8;

      // A separate arc generator for labels.
      const arcLabel = d3
        .arc()
        .innerRadius(labelRadius)
        .outerRadius(labelRadius);

      const arcs = pie(data);

      // Create the SVG container.
      const svg = d3
        .create('svg')
        .attr('width', width)
        .attr('height', height)
        .attr('viewBox', [-width / 2, -height / 2, width, height])
        .attr('style', 'max-width: 100%; height: auto; font: 10px sans-serif;');

      // Add a sector path for each value.
      svg
        .append('g')
        .attr('stroke', 'white')
        .selectAll()
        .data(arcs)
        .join('path')
        .attr('fill', (d) => color(d.data.name))
        .attr('d', arc)
        .append('title')
        .text((d) => `${d.data.name}: ${d.data.value.toLocaleString('en-US')}`);

      // Create a new arc generator to place a label close to the edge.
      // The label shows the value if there is enough room.
      svg
        .append('g')
        .attr('text-anchor', 'middle')
        .selectAll()
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
      //const { width } = entries[0].contentRect;
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

    //renderElement(<div>Pie Chart {data}</div>, parentNode);
    // perhaps additionally allow for returning jsx here?
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
