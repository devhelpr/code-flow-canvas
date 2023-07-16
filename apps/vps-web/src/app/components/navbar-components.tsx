import { CanvasAppInstance } from '@devhelpr/visual-programming-system';
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

export interface NavbarComponentsProps {
  selectNodeType: HTMLSelectElement;
  animatePath: AnimatePathFunction<NodeInfo>;
  animatePathFromThumb: AnimatePathFromThumbFunction<NodeInfo>;
  canvasUpdated: () => void;
  canvasApp: CanvasAppInstance;
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
    </div>
  </element:Fragment>
);
