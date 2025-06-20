import { NodeVisual } from '@devhelpr/visual-programming-system';
import { NodeInfo } from '@devhelpr/web-flow-executor';
import * as d3 from 'd3';

// Define proper types for pie chart data
interface PlotDataItem {
  name: string;
  x: number;
  y: number;
  // Using unknown instead of any for better type safety
  [key: string]: string | number | boolean | unknown;
}

type PlotData = PlotDataItem[] & { columns?: string[] };

// Define a type for the input data structure
type InputDataTuple = [string, number, number];

export class PlotVisual extends NodeVisual<NodeInfo> {
  lastData:
    | Record<
        string,
        | {
            type: string;
            data: PlotData;
          }
        | undefined
      >
    | undefined = undefined;

  svg: d3.Selection<SVGSVGElement, undefined, null, undefined> | undefined =
    undefined;
  updateVisual = (
    incomingData: unknown,
    parentNode: HTMLElement,
    // Using underscore prefix to indicate intentionally unused parameter
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _nodeInfo: NodeInfo
  ) => {
    if (
      incomingData === undefined ||
      incomingData === 'clear' ||
      incomingData === 'reset'
    ) {
      console.warn('No data to plot');
      this.lastData = undefined;
      parentNode.innerHTML = '';
      this.svg = undefined;
      return;
    }
    const dataToPlot = (incomingData as any).data;
    const id = (incomingData as any)?.id ?? 'default';
    if (!this.lastData) {
      this.lastData = {};

      parentNode.innerHTML = '';
      this.svg = undefined;
    }
    if (!dataToPlot || !Array.isArray(dataToPlot)) {
      return;
    }
    this.lastData[id] = {
      type: (incomingData as any).type,

      data: dataToPlot.map((d: InputDataTuple | Record<string, unknown>) => {
        // Handle both array-like and object-like structures
        if (Array.isArray(d)) {
          return {
            name: String(d[0]),
            x: Number(d[1]),
            y: Number(d[2]),
          };
        } else if (d && typeof d === 'object') {
          // Handle object format with name/value keys
          const name = d.name !== undefined ? String(d.name) : 'Unknown';
          const x = d.x !== undefined ? Number(d.x) : 0;
          const y = d.y !== undefined ? Number(d.y) : 0;
          return { name, x, y };
        }
        return { name: 'Unknown', x: 0, y: 0 };
      }),
    };

    // this.lastData[id].data.push({
    //   name: 'Zero zero',
    //   x: 0,
    //   y: 0,
    // });
    // Clear the parent node before rendering... should this be handled by the framework?

    const renderScatterPlot = () => {
      const width = parentNode.clientWidth;
      const height = Math.min(width, parentNode.clientHeight);
      let svg = this.svg;
      if (!svg) {
        this.svg = d3
          .create('svg')
          .attr('width', width)
          .attr('height', height)
          .attr('viewBox', [-40, -20, width + 60, height + 20].join(' '))
          .attr(
            'style',
            'max-width: 100%; height: auto; font: 10px sans-serif;'
          );

        parentNode.appendChild(this.svg.node() as Node);
        svg = this.svg;
      }
      svg.selectAll('*').remove(); // Clear previous content
      // create a list of 1000 (x,y) random coordinates
      const data = d3.range(1000).map((_, index) => ({
        name: index.toString(),
        x: Math.random() * 1000,
        y: Math.random() * 1000,
      }));
      if (!this.lastData) {
        return;
      }

      Object.entries(this.lastData).forEach(([_key, value]) => {
        const pieData: PlotData = value?.data
          ? structuredClone(value.data)
          : data;

        console.log('plotchart', pieData);

        const xMin = d3.min(pieData, (d) => d.x) || 0;
        const xMax = d3.max(pieData, (d) => d.x) || 0;
        const yMin = d3.min(pieData, (d) => d.y) || 0;
        const yMax = d3.max(pieData, (d) => d.y) || 0;
        console.log('xMin', xMin, 'xMax', xMax, 'yMin', yMin, 'yMax', yMax);
        const x = d3.scaleLinear().domain([xMin, xMax]).range([0, width]);
        const y = d3.scaleLinear().domain([yMin, yMax]).range([height, 0]);

        if (value?.type === 'plot') {
          svg
            .append('g')
            .attr('transform', 'translate(0,' + height + ')')
            .call(d3.axisBottom(x));

          // Add Y axis

          svg
            .append('g')
            .attr('transform', 'translate(0,0)')
            .call(d3.axisLeft(y));
        }

        if (value?.type === 'line') {
          svg
            .append('path')
            .datum(pieData)
            .attr('fill', 'none')
            .attr('stroke', '#ff0000')
            .attr('stroke-width', 1.5)
            .attr(
              'd',
              d3
                .line<PlotDataItem>()
                .x((d) => x(d.x))
                .y((d) => y(d.y))(pieData)
            );

          // Add dots
          // svg
          //   .append('g')
          //   .selectAll('dot')
          //   .data(pieData as unknown[])
          //   .enter()
          //   .append('circle')
          //   .attr('cx', function (d) {
          //     return x((d as { x: number }).x);
          //   })
          //   .attr('cy', function (d) {
          //     return y((d as { y: number }).y);
          //   })
          //   .attr('r', 1.5)
          //   .style('fill', '#69b3a2');
        }
        if (value?.type === 'plot') {
          //Add the points
          svg
            .append('g')
            .selectAll('dot')
            .data(pieData)
            .enter()
            .append('circle')
            .attr('cx', function (d) {
              return x(d.x);
            })
            .attr('cy', function (d) {
              return y(d.y);
            })
            .attr('r', 5)
            .attr('fill', (d) =>
              d.name === 'Zero zero' ? 'purple' : '#69b3a2'
            );
        }
      });
    };

    renderScatterPlot();

    this.resizeObserver = new ResizeObserver((entries) => {
      if (this.isResizing) return;
      if (!entries || entries.length === 0) return;
      this.isResizing = true;
      try {
        console.log('SCATTERPLOT resize');

        parentNode.innerHTML = '';
        this.svg = undefined;
        renderScatterPlot();
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
