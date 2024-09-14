import {
  FlowCanvasInstance,
  createElement,
  FormComponent,
  FormFieldType,
  InitialValues,
  INodeComponent,
  IRectNodeComponent,
  NodeTask,
  ThumbConnectionType,
  ThumbType,
} from '@devhelpr/visual-programming-system';

import { GLNodeInfo } from '../types/gl-node-info';
import { vec3Type } from '../gl-types/float-vec2-vec3';

const thumbs = [
  {
    thumbType: ThumbType.EndConnectorCenter,
    thumbIndex: 0,
    connectionType: ThumbConnectionType.end,
    color: 'white',
    label: 'v3',
    thumbConstraint: 'vec3',
    name: 'vector',
    prefixLabel: '',
  },
];

export const getSetAndAddColorVariableNode = (
  updated: () => void
): NodeTask<GLNodeInfo> => {
  let node: IRectNodeComponent<GLNodeInfo>;

  const initializeCompute = () => {
    return;
  };
  const compute = (_input: string, _loopIndex?: number, payload?: any) => {
    const variableName =
      (node ?? payload)?.nodeInfo?.formValues?.variableName ?? '';
    const vector = payload?.['vector'] ?? `${vec3Type}(0., 0., 0.)`;
    const shaderCode = `${variableName} += ${vector};`;
    return {
      result: shaderCode,
      output: shaderCode,
      followPath: undefined,
    };
  };

  const nodeName = 'set-and-add-color-variable-node';
  return {
    name: nodeName,
    family: 'flow-canvas',
    isContainer: false,
    category: 'variables',
    thumbs,
    getCompute: () => compute,
    createVisualNode: (
      canvasApp: FlowCanvasInstance<GLNodeInfo>,
      x: number,
      y: number,
      id?: string,
      initalValues?: InitialValues,
      containerNode?: IRectNodeComponent<GLNodeInfo>
    ) => {
      const initialValue = initalValues?.['variableName'] ?? '';
      const formElements = [
        {
          fieldType: FormFieldType.Text,
          fieldName: 'variableName',
          label: 'Variable (add and set)',
          value: initialValue ?? '',
          onChange: (value: string) => {
            if (!node?.nodeInfo) {
              return;
            }
            node.nodeInfo.formValues = {
              ...node.nodeInfo.formValues,
              variableName: value,
            };
            console.log('onChange', node.nodeInfo);
            if (updated) {
              updated();
            }
          },
        },
      ];
      const jsxComponentWrapper = createElement(
        'div',
        {
          class: `inner-node bg-slate-500 p-4 rounded flex flex-row items-center justify-center`,
        },
        undefined,
        ''
      ) as unknown as INodeComponent<GLNodeInfo>;

      FormComponent({
        rootElement: jsxComponentWrapper.domElement as HTMLElement,
        id: id ?? '',
        formElements,
        hasSubmitButton: false,
        onSave: (formValues) => {
          console.log('onSave', formValues);
        },
      }) as unknown as HTMLElement;

      const rect = canvasApp.createRect(
        x,
        y,
        220,
        100,
        undefined,
        thumbs,
        jsxComponentWrapper,
        {
          classNames: `bg-slate-500 p-4 rounded`,
        },
        true,
        undefined,
        true,
        id,
        {
          type: nodeName,
          formValues: {
            variableName: initialValue ?? '',
          },
          compute: compute,
        },
        containerNode
      );
      if (!rect.nodeComponent) {
        throw new Error('rect.nodeComponent is undefined');
      }

      node = rect.nodeComponent;
      if (node.nodeInfo) {
        node.nodeInfo.formElements = formElements;
        node.nodeInfo.compute = compute;
        node.nodeInfo.initializeCompute = initializeCompute;
      }
      return node;
    },
  };
};
