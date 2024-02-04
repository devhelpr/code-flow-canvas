import {
  ThumbConnectionType,
  ThumbType,
  createElement,
} from '@devhelpr/visual-programming-system';
import {
  InitialValues,
  NodeTask,
  NodeTaskFactory,
} from '../node-task-registry';
import { visualNodeFactory } from '../node-task-registry/createRectNode';
import { GLNodeInfo } from '../types/gl-node-info';
import { registerGLSLFunction } from './custom-glsl-functions-registry';

const fieldName = 'rotate';
const labelName = 'Rotate';
const nodeName = 'rotate-node';
const familyName = 'flow-canvas';
const thumbConstraint = 'vec2';
const thumbs = [
  {
    thumbType: ThumbType.StartConnectorCenter,
    thumbIndex: 0,
    connectionType: ThumbConnectionType.start,
    color: 'white',
    label: ' ',
    thumbConstraint: thumbConstraint,
    maxConnections: -1,
    prefixLabel: 'vector',
  },
  {
    thumbType: ThumbType.EndConnectorLeft,
    thumbIndex: 0,
    connectionType: ThumbConnectionType.end,
    color: 'white',
    label: ' ',

    name: 'vector',
    thumbConstraint: thumbConstraint,
    prefixLabel: 'vector',
  },
  {
    thumbType: ThumbType.EndConnectorLeft,
    thumbIndex: 1,
    connectionType: ThumbConnectionType.end,
    color: 'white',
    label: ' ',

    name: 'degree',
    thumbConstraint: 'value',
    prefixLabel: 'angle',
  },
];

registerGLSLFunction(
  nodeName,
  `vec2 rotate(vec2 v, float a) {
    float degreeToRad = a * 0.017453292519943295;
    return vec2(sin(degreeToRad) * v.x + cos(degreeToRad) * v.y, cos(degreeToRad) * v.x - sin(degreeToRad) * v.y);
  }`
);
export const getRotateNode: NodeTaskFactory<GLNodeInfo> = (
  _updated: () => void
): NodeTask<GLNodeInfo> => {
  const initializeCompute = () => {
    return;
  };

  const element = createElement('div', {
    class: 'block',
  });
  const compute = (input: string, _loopIndex?: number, payload?: any) => {
    const vector = payload?.['vector'];

    const degree = payload?.['degree'];
    if (element) {
      const degreeParsed = parseFloat(payload?.['degree']) ?? 0;
      let degreeAsString = '';
      if (!isNaN(degreeParsed)) {
        degreeAsString = `${(degreeParsed % 360).toFixed(0)}`;
      }
      element.domElement.textContent = degreeAsString;
    }
    return {
      result: `rotate(${vector}, ${degree})`,
      output: input,
      followPath: undefined,
    };
  };
  return visualNodeFactory(
    nodeName,
    labelName,
    familyName,
    fieldName,
    compute,
    initializeCompute,
    false,
    200,
    100,
    thumbs,
    (_values?: InitialValues) => {
      return [];
    },
    (_nodeInstance) => {
      //
    },
    {
      hasTitlebar: false,
      additionalClassNames: 'flex-wrap flex-col',
      childNodeWrapperClass: 'w-full block text-center',
    },
    element.domElement as HTMLElement
  );
};
