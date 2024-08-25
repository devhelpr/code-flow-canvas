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
      class={'max-h-[100vh] overflow-auto text-center'}
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

    const nodeRadius = 15;
    const nodeSpace = 50;
    const spaceBetweenLayers = 600;

    const layersInfo: {
      nodeCount: number;
      clampedNodeCount: number;
      dots: number;
    }[] = [];
    layersInfo.push({
      nodeCount: currentLayerNodeCount,
      clampedNodeCount: Math.min(currentLayerNodeCount, 10),
      dots: 0,
    });
    layerCounts.forEach((nodeCount) => {
      layersInfo.push({
        nodeCount,
        clampedNodeCount: Math.min(nodeCount, 10),
        dots: 0,
      });
    });

    const sortedLayersInfo: number[] = [];
    layersInfo.forEach((layerInfo) => {
      if (
        layerInfo.nodeCount > 10 &&
        !sortedLayersInfo.includes(layerInfo.nodeCount)
      ) {
        sortedLayersInfo.push(layerInfo.nodeCount);
      }
    });
    sortedLayersInfo.sort((a, b) => a - b);

    let maxHeight = -1;
    let maxIndex = -1;
    layersInfo.forEach((layerInfo, index) => {
      if (layerInfo.nodeCount > 10) {
        layerInfo.dots = sortedLayersInfo.indexOf(layerInfo.nodeCount) + 1;
      }
      if (layerInfo.clampedNodeCount > maxHeight) {
        maxHeight = layerInfo.clampedNodeCount;
        maxIndex = index;
      }
    });

    const dotRadius = 2;
    height =
      maxHeight * (nodeRadius * 2 + nodeSpace) +
      layersInfo[maxIndex].dots * (dotRadius * 2 + nodeSpace);

    let loopLayers = 0;
    while (loopLayers < layersInfo.length) {
      let color = '#D2E8C8';
      // C9CAE9
      // E9D1C9
      if (loopLayers > 0) {
        color = '#C9CAE9';
      }
      if (loopLayers > 0 && loopLayers === layersInfo.length - 1) {
        color = '#E9D1C9';
      }
      const actualNodeCount = layersInfo[loopLayers].nodeCount;
      const currentLayerNodeCount = layersInfo[loopLayers].clampedNodeCount;
      const layerHeight =
        currentLayerNodeCount * (nodeRadius * 2 + nodeSpace) +
        layersInfo[loopLayers].dots * (dotRadius * 2 + nodeSpace);

      const halfNodeCount = Math.ceil(currentLayerNodeCount / 2);
      let y = nodeRadius;
      let loop = 0;
      while (loop < halfNodeCount) {
        renderElement(
          <circle
            fill={color}
            r={nodeRadius}
            cx={
              spaceBetweenLayers * loopLayers +
              (loopLayers + 1) * (nodeRadius * 2 + nodeSpace)
            }
            cy={height / 2 - layerHeight / 2 + y}
          ></circle>,
          svgElement
        );

        renderElement(
          <text
            text-anchor="middle"
            x={
              spaceBetweenLayers * loopLayers +
              (loopLayers + 1) * (nodeRadius * 2 + nodeSpace)
            }
            y={height / 2 - layerHeight / 2 + y}
            stroke="black"
            dy=".3em"
            font-size="10px"
          >
            {loop + 1}
          </text>,
          svgElement
        );
        y += nodeRadius * 2 + nodeSpace;
        loop++;
      }

      if (layersInfo[loopLayers].dots > 0) {
        y -= nodeRadius * 2 - dotRadius;
        let loopDots = 0;
        while (loopDots < layersInfo[loopLayers].dots) {
          renderElement(
            <circle
              r={dotRadius}
              cx={
                spaceBetweenLayers * loopLayers +
                (loopLayers + 1) * (nodeRadius * 2 + nodeSpace)
              }
              cy={height / 2 - layerHeight / 2 + y}
            ></circle>,
            svgElement
          );
          y += dotRadius * 2 + nodeSpace;
          loopDots++;
        }
      }

      while (loop < currentLayerNodeCount) {
        renderElement(
          <circle
            fill={color}
            r={nodeRadius}
            cx={
              spaceBetweenLayers * loopLayers +
              (loopLayers + 1) * (nodeRadius * 2 + nodeSpace)
            }
            cy={height / 2 - layerHeight / 2 + y}
          ></circle>,
          svgElement
        );
        renderElement(
          <text
            text-anchor="middle"
            x={
              spaceBetweenLayers * loopLayers +
              (loopLayers + 1) * (nodeRadius * 2 + nodeSpace)
            }
            y={height / 2 - layerHeight / 2 + y}
            stroke="black"
            dy=".3em"
            font-size="10px"
          >
            {actualNodeCount - currentLayerNodeCount + loop + 1}
          </text>,
          svgElement
        );
        y += nodeRadius * 2 + nodeSpace;
        loop++;
      }

      // draw lines
      if (loopLayers > 0) {
        const previousLayerNodeCount =
          layersInfo[loopLayers - 1].clampedNodeCount;
        const currentLayerNodeCount = layersInfo[loopLayers].clampedNodeCount;
        const previousLayerHeight =
          previousLayerNodeCount * (nodeRadius * 2 + nodeSpace) +
          layersInfo[loopLayers - 1].dots * (dotRadius * 2 + nodeSpace);

        const currentLayerHeight =
          currentLayerNodeCount * (nodeRadius * 2 + nodeSpace) +
          layersInfo[loopLayers].dots * (dotRadius * 2 + nodeSpace);

        let loopLines = 0;
        while (loopLines < previousLayerNodeCount) {
          let loopCurrent = 0;
          while (loopCurrent < currentLayerNodeCount) {
            const x1 =
              spaceBetweenLayers * (loopLayers - 1) +
              nodeRadius +
              loopLayers * (nodeRadius * 2 + nodeSpace);
            const x2 =
              spaceBetweenLayers * loopLayers +
              (loopLayers + 1) * (nodeRadius * 2 + nodeSpace) -
              nodeRadius;
            let y1 =
              height / 2 -
              previousLayerHeight / 2 +
              loopLines * (nodeRadius * 2 + nodeSpace) +
              nodeRadius;
            if (loopLines >= halfNodeCount) {
              y1 +=
                layersInfo[loopLayers - 1].dots * (dotRadius * 2 + nodeSpace);
            }
            let y2 =
              height / 2 -
              currentLayerHeight / 2 +
              loopCurrent * (nodeRadius * 2 + nodeSpace) +
              nodeRadius;
            if (loopCurrent >= halfNodeCount) {
              y2 += layersInfo[loopLayers].dots * (dotRadius * 2 + nodeSpace);
            }

            renderElement(
              <line
                x1={x1}
                y1={y1}
                x2={x2}
                y2={y2}
                style="stroke:black;stroke-width:1"
              ></line>,
              svgElement
            );
            loopCurrent++;
          }
          loopLines++;
        }
      }

      loopLayers++;
    }

    const width =
      (layersInfo.length + 1) * (nodeRadius * 2 + nodeSpace) +
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
