import {
  renderElement,
  createJSXElement,
  NodeVisual,
} from '@devhelpr/visual-programming-system';
import { NodeInfo } from '@devhelpr/web-flow-executor';

/*
  TODO : fix that this work for both main thread and worker

  ... currently this is only used in the worker AND it is also called from the main thread when 
    using the Timeline slider... but with the wrong input (the result of the previous node
    ... instead of the output of the current node)
  )


  ... sendOutputNode opgeven aan flowengine?

*/

export const pieChartVisual: NodeVisual<NodeInfo> = {
  updateVisual: (data: unknown, parentNode: HTMLElement) => {
    console.log('pieChartVisual', data);
    // Clear the parent node before rendering... should this be handled by the framework?
    parentNode.innerHTML = '';
    renderElement(<div>Pie Chart {data}</div>, parentNode);
    // perhaps additionally allow for returning jsx here?
  },
};
