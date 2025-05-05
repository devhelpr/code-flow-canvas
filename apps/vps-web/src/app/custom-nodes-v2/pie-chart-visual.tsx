import {
  renderElement,
  createJSXElement,
  NodeVisual,
} from '@devhelpr/visual-programming-system';
import { NodeInfo } from '@devhelpr/web-flow-executor';

export const pieChartVisual: NodeVisual<NodeInfo> = {
  updateVisual: (data: unknown, parentNode: HTMLElement) => {
    // Clear the parent node before rendering... should this be handled by the framework?
    parentNode.innerHTML = '';
    renderElement(<div>Pie Chart {data}</div>, parentNode);
    // perhaps additionally allow for returning jsx here?
  },
};
