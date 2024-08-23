import {
  renderElement,
  createJSXElement,
  IRectNodeComponent,
} from '@devhelpr/visual-programming-system';
import { NodeInfo } from '../../types/node-info';

function getLayerCounts(neuralNode: IRectNodeComponent<NodeInfo>) {
  let results: number[] = [];
  let hiddenLayerNodeCount = 0;
  neuralNode.connections?.forEach((connection) => {
    if (
      connection.startNode?.id === neuralNode.id &&
      (connection.endNode?.nodeInfo?.type === 'neural-node-hidden-layer' ||
        connection.endNode?.nodeInfo?.type === 'neural-node-output-layer') &&
      connection.endNode?.nodeInfo?.formValues
    ) {
      hiddenLayerNodeCount =
        parseInt(
          connection.endNode.nodeInfo.formValues['neural-layer-node-count']
        ) ?? 0;

      results = [
        ...results,
        hiddenLayerNodeCount,
        ...getLayerCounts(connection.endNode),
      ];
    }
  });

  return results;
}

export const showNeuralNetworkView = (
  _rootElement: HTMLElement,
  neuralInputNode: IRectNodeComponent<NodeInfo>
) => {
  let dialogElement: any = undefined;
  renderElement(
    <dialog
      class={'max-h-[100vh] overflow-auto'}
      getElement={(element: HTMLDialogElement) =>
        (dialogElement = element as HTMLDialogElement)
      }
    ></dialog>,
    document.body
  );
  if (dialogElement && dialogElement instanceof HTMLDialogElement) {
    dialogElement.addEventListener('click', function (event) {
      var rect = dialogElement.getBoundingClientRect();
      var isInDialog =
        rect.top <= event.clientY &&
        event.clientY <= rect.top + rect.height &&
        rect.left <= event.clientX &&
        event.clientX <= rect.left + rect.width;
      if (!isInDialog) {
        dialogElement.close();
      }
    });
    const currentLayerNodeCount =
      parseInt(
        neuralInputNode.nodeInfo?.formValues?.['neural-layer-node-count']
      ) ?? 0;
    const layerCounts = getLayerCounts(neuralInputNode);

    let svgElement: any = undefined;
    renderElement(
      <svg
        getElement={(element: HTMLOrSVGElement) => {
          svgElement = element;
        }}
      ></svg>,
      dialogElement
    );
    let height = 0;

    const nodeRadius = 10;
    const nodeSpace = 50;
    const spaceBetweenLayers = 600;
    let loop = 0;
    while (loop < currentLayerNodeCount) {
      renderElement(
        <circle
          r={nodeRadius}
          cx={nodeSpace + nodeRadius}
          cy={nodeRadius + loop * (nodeRadius * 2 + nodeSpace)}
        ></circle>,
        svgElement
      );
      height += nodeRadius * 2 + nodeSpace;
      loop++;
    }

    let loopLayers = 0;
    while (loopLayers < layerCounts.length) {
      const currentLayerNodeCount = layerCounts[loopLayers];
      const layerHeight = currentLayerNodeCount * (nodeRadius * 2 + nodeSpace);
      loop = 0;
      while (loop < currentLayerNodeCount) {
        renderElement(
          <circle
            r={nodeRadius}
            cx={
              spaceBetweenLayers * (loopLayers + 1) +
              nodeSpace +
              nodeRadius +
              (loopLayers + 1) * (nodeRadius * 2 + nodeSpace)
            }
            cy={
              height / 2 -
              layerHeight / 2 +
              nodeRadius +
              loop * (nodeRadius * 2 + nodeSpace)
            }
          ></circle>,
          svgElement
        );
        loop++;
      }
      loopLayers++;
    }

    const inputLayerCount = currentLayerNodeCount;
    loopLayers = 0;
    while (loopLayers < layerCounts.length) {
      const currentLayerNodeCount = layerCounts[loopLayers];
      const layerHeight = currentLayerNodeCount * (nodeRadius * 2 + nodeSpace);
      loop = 0;
      while (loop < currentLayerNodeCount) {
        // create a line from each node in the previous layer to each node in the current layer
        if (loopLayers === 0) {
          let loopCurrent = 0;
          while (loopCurrent < inputLayerCount) {
            renderElement(
              <line
                x1={nodeRadius + nodeSpace + nodeRadius * 2}
                y1={nodeRadius + loopCurrent * (nodeRadius * 2 + nodeSpace)}
                x2={
                  spaceBetweenLayers +
                  nodeRadius +
                  nodeSpace +
                  nodeRadius * 2 +
                  nodeSpace -
                  nodeRadius
                }
                y2={
                  height / 2 -
                  layerHeight / 2 +
                  nodeRadius +
                  loop * (nodeRadius * 2 + nodeSpace)
                }
                style="stroke:black;stroke-width:1"
              ></line>,
              svgElement
            );
            loopCurrent++;
          }
        } else {
          let loopCurrent = 0;
          const previousLayerNodeCount = layerCounts[loopLayers - 1];
          const previousLayerHeight =
            previousLayerNodeCount * (nodeRadius * 2 + nodeSpace);
          while (loopCurrent < previousLayerNodeCount) {
            renderElement(
              <line
                x1={
                  nodeRadius +
                  nodeSpace +
                  nodeRadius * 2 +
                  spaceBetweenLayers +
                  nodeSpace +
                  nodeRadius +
                  (loopLayers - 1) *
                    (nodeRadius * 2 + nodeSpace + spaceBetweenLayers)
                }
                y1={
                  height / 2 -
                  previousLayerHeight / 2 +
                  nodeRadius +
                  loopCurrent * (nodeRadius * 2 + nodeSpace)
                }
                x2={
                  spaceBetweenLayers +
                  nodeRadius +
                  nodeSpace +
                  nodeRadius * 2 +
                  nodeSpace -
                  nodeRadius +
                  loopLayers * (nodeRadius * 2 + nodeSpace + spaceBetweenLayers)
                }
                y2={
                  height / 2 -
                  layerHeight / 2 +
                  nodeRadius +
                  loop * (nodeRadius * 2 + nodeSpace)
                }
                style="stroke:black;stroke-width:1"
              ></line>,
              svgElement
            );
            loopCurrent++;
          }
        }

        loop++;
      }
      loopLayers++;
    }
    const width =
      (layerCounts.length + 1) * (nodeRadius * 2 + nodeSpace) +
      nodeSpace +
      spaceBetweenLayers * layerCounts.length;
    svgElement.setAttribute('viewBox', `0 0 ${width} ${height}`);
    svgElement.setAttribute('height', `${height}px`);
    svgElement.setAttribute('width', `${width}px`);

    dialogElement!.showModal();
  }
};

/*
	visualisation that I want:
	
	- determine the lowest node count in all the layers
	- max nodes that can be displayed in a layer is 10 but use the lowesr node count of all layers if it's < 10

	- if a layer has more nodes , then show max 10 nodes ..the first 5 and the last 5
	   ... in the middle their should be small dots to indicate that there are more nodes
	   ... the amount of dots depend on the total node count of that layer relative to other layers

				- layer with the lowest node count has 3 dots
				- next layer in order has 4 dots
				- and so on...
			
	- in a layer never show more nodes then the next layer shows and it should be an even count of nodes
	
*/
