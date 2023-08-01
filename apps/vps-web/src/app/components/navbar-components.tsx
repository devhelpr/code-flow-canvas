import {
  CanvasAppInstance,
  IConnectionNodeComponent,
  IElementNode,
  INodeComponent,
  IRectNodeComponent,
  NodeType,
  createElementMap,
  getSelectedNode,
  setSelectNode,
} from '@devhelpr/visual-programming-system';
import { navBarButton } from '../consts/classes';
import {
  AnimatePathFromThumbFunction,
  AnimatePathFunction,
} from '../follow-path/animate-path';
import { getArray } from '../nodes/array';
import { getExpression } from '../nodes/expression';
import { getFetch } from '../nodes/fetch';
import { getIfCondition } from '../nodes/if-condition';
import { getFilter, getMap } from '../nodes/map';
import { getShowInput } from '../nodes/show-input';
import { getShowObject } from '../nodes/show-object';
import { getSum } from '../nodes/sum';
import { NodeInfo } from '../types/node-info';
import { getCanvasNode } from '../nodes/canvas-node';
import { e } from 'vitest/dist/index-5aad25c1';

export interface NavbarComponentsProps {
  selectNodeType: HTMLSelectElement;
  animatePath: AnimatePathFunction<NodeInfo>;
  animatePathFromThumb: AnimatePathFromThumbFunction<NodeInfo>;
  canvasUpdated: () => void;
  canvasApp: CanvasAppInstance;
  removeElement: (element: IElementNode<NodeInfo>) => void;
}

export const NavbarComponents = (props: NavbarComponentsProps) => (
  <element:Fragment>
    <div>
      <button
        class={`${navBarButton} bg-blue-500 hover:bg-blue-700`}
        onclick={(event: Event) => {
          event.preventDefault();
          const nodeType = props.selectNodeType.value;

          const startX = Math.floor(Math.random() * 250);
          const startY = Math.floor(Math.random() * 500);

          if (nodeType === 'expression') {
            const expression = getExpression(props.canvasUpdated);
            const nodeElementId = getSelectedNode();
            if (nodeElementId) {
              const node = props.canvasApp?.elements?.get(
                nodeElementId
              ) as INodeComponent<NodeInfo>;
              if (node && node.nodeInfo.taskTyp === 'canvas-node') {
                expression.createVisualNode(
                  node.nodeInfo.canvasAppInstance,
                  50,
                  50,
                  undefined,
                  undefined,
                  node,
                  node.x,
                  node.y
                );

                return;
              }
            }
            expression.createVisualNode(props.canvasApp, startX, startY);
          } else if (nodeType === 'if') {
            const ifCondition = getIfCondition();
            ifCondition.createVisualNode(props.canvasApp, startX, startY);
          } else if (nodeType === 'show-input') {
            const showInput = getShowInput();
            showInput.createVisualNode(props.canvasApp, startX, startY);
          } else if (nodeType === 'fetch') {
            const fetch = getFetch();
            fetch.createVisualNode(props.canvasApp, startX, startY);
          } else if (nodeType === 'show-object') {
            const showObject = getShowObject();
            showObject.createVisualNode(props.canvasApp, startX, startY);
          } else if (nodeType === 'array') {
            const array = getArray();
            array.createVisualNode(props.canvasApp, startX, startY);
          } else if (nodeType === 'sum') {
            const showObject = getSum();
            showObject.createVisualNode(props.canvasApp, startX, startY);
          } else if (nodeType === 'map') {
            const map = getMap<NodeInfo>(
              props.animatePath,
              props.animatePathFromThumb
            );
            map.createVisualNode(props.canvasApp, startX, startY);
          } else if (nodeType === 'filter') {
            const filter = getFilter<NodeInfo>(
              props.animatePath,
              props.animatePathFromThumb
            );
            filter.createVisualNode(props.canvasApp, startX, startY);
          } else if (nodeType === 'canvas-node') {
            const canvasNode = getCanvasNode(props.canvasUpdated);
            canvasNode.createVisualNode(props.canvasApp, startX, startY);
          }
          return false;
        }}
      >
        Add node
      </button>
      <button
        class={`${navBarButton}`}
        onclick={(event: Event) => {
          event.preventDefault();
          props.canvasApp?.centerCamera();
          return false;
        }}
      >
        Center
      </button>
      <button
        class={`${navBarButton}`}
        onclick={(event: Event) => {
          event.preventDefault();
          const nodeElementId = getSelectedNode();
          if (nodeElementId) {
            const node = props.canvasApp?.elements?.get(
              nodeElementId
            ) as INodeComponent<NodeInfo>;
            if (node) {
              if (node.nodeType === NodeType.Connection) {
                // Remove the connection from the start and end nodes
                const connection = node as IConnectionNodeComponent<NodeInfo>;
                if (connection.startNode) {
                  connection.startNode.connections =
                    connection.startNode?.connections?.filter(
                      (c) => c.id !== connection.id
                    );
                }
                if (connection.endNode) {
                  connection.endNode.connections =
                    connection.endNode?.connections?.filter(
                      (c) => c.id !== connection.id
                    );
                }
              } else if (node.nodeType === NodeType.Shape) {
                //does the shape have connections? yes.. remove the link between the connection and the node
                // OR .. remove the connection as well !?
                const shapeNode = node as IRectNodeComponent<NodeInfo>;
                if (shapeNode.connections) {
                  shapeNode.connections.forEach((c) => {
                    const connection = props.canvasApp?.elements?.get(
                      c.id
                    ) as IConnectionNodeComponent<NodeInfo>;
                    if (connection) {
                      if (connection.startNode?.id === node.id) {
                        connection.startNode = undefined;
                        connection.startNodeThumb = undefined;
                      }
                      if (connection.endNode?.id === node.id) {
                        connection.endNode = undefined;
                        connection.endNodeThumb = undefined;
                      }
                    }
                  });
                }
              } else {
                return;
              }

              props.removeElement(node);
              props.canvasApp?.elements?.delete(nodeElementId);

              setSelectNode(undefined);
              props.canvasUpdated();
            }
          }
          return false;
        }}
      >
        Delete
      </button>
    </div>
  </element:Fragment>
);
