import {
  InitialValues,
  NodeTask,
  NodeTaskFactory,
  ThumbConnectionType,
  ThumbType,
  visualNodeFactory,
  IConnectionNodeComponent,
  createJSXElement,
  FormFieldType,
} from '@devhelpr/visual-programming-system';
import { NodeInfo } from '../types/node-info';
import { IRectNodeComponent } from '../../../visual-programming-system/src';
import { RunCounter } from '../follow-path/run-counter';

const fieldName = 'neural-output-node';
const labelName = 'Neural Output Node';
export const nodeName = 'neural-output-node';
const familyName = 'flow-canvas';
const thumbs = [
  {
    thumbType: ThumbType.Center,
    thumbIndex: 0,
    connectionType: ThumbConnectionType.start,
    color: 'white',
    label: ' ',
    maxConnections: 1,
  },
  {
    thumbType: ThumbType.Center,
    thumbIndex: 0,
    connectionType: ThumbConnectionType.end,
    color: 'white',
    label: ' ',
    name: 'input',
    maxConnections: -1,
  },
];

export const getNeuralOutputNode: NodeTaskFactory<NodeInfo> = (
  updated: () => void
): NodeTask<any> => {
  const Text = () => <div class="neural-node-value">value</div>;

  let nodeComponent: IRectNodeComponent<NodeInfo> | undefined = undefined;
  const initializeCompute = () => {
    values = { global: {} };

    nodeComponent?.connections?.forEach((connection) => {
      if (
        connection &&
        nodeComponent &&
        connection?.endNode &&
        connection?.endNode?.id === nodeComponent?.id
      ) {
        values['global'][connection.id] = undefined;
      }
    });
    // nodeComponent?.thumbConnectors?.forEach((thumb) => {
    //   if (thumb.thumbConnectionType === ThumbConnectionType.end) {
    //     values["global"][thumb.thumbName] = undefined;
    //   }
    // });
    return;
  };

  let values = {
    global: {},
  } as Record<string, any>;

  const compute = (
    input: string,
    _loopIndex?: number,
    _payload?: any,
    _thumbName?: string,
    scopeId?: string,
    _runCounter?: RunCounter,
    inputConnection?: IConnectionNodeComponent<NodeInfo>
  ) => {
    if (!inputConnection) {
      return {
        result: undefined,
        output: undefined,
        stop: true,
        followPath: undefined,
      };
    }
    if (scopeId && !values[scopeId]) {
      values[scopeId] = {};

      nodeComponent?.connections?.forEach((connection) => {
        if (
          connection &&
          nodeComponent &&
          connection?.endNode &&
          connection?.endNode?.id === nodeComponent?.id
        ) {
          values[scopeId][connection.id] = undefined;
        }
      });
    }
    const localValues = values[scopeId ?? 'global'];
    localValues[inputConnection.id] = input;
    let stop = false;
    nodeComponent?.connections?.forEach((connection) => {
      if (
        connection &&
        nodeComponent &&
        connection?.endNode &&
        connection?.endNode?.id === nodeComponent?.id
      ) {
        if (localValues[connection.id] === undefined) {
          stop = true;
        }
      }
    });
    if (stop) {
      return {
        result: undefined,
        output: undefined,
        stop: true,
        followPath: undefined,
      };
    }

    let sumValue = 0;
    nodeComponent?.connections?.forEach((connection) => {
      if (
        connection &&
        nodeComponent &&
        connection?.endNode &&
        connection?.endNode?.id === nodeComponent?.id
      ) {
        const weight = connection?.nodeInfo?.formValues?.weight ?? 1;
        sumValue += localValues[connection.id] * weight;
        //localValues[connection.id] = undefined;
      }
    });

    if (nodeComponent) {
      const element = (nodeComponent.domElement as HTMLElement).querySelector(
        '.neural-node-value'
      );
      if (element) {
        element.textContent = `${sumValue.toFixed(2)}`;
      }
    }

    // if (contextInstance && scopeId) {
    //   contextInstance.registerTempVariable('a', value1, scopeId);
    //   contextInstance.registerTempVariable('b', value2, scopeId);
    // }
    // console.log('merge', scopeId, value1, value2, {
    //   ...contextInstance?.getVariables(scopeId),
    // });
    return {
      result: sumValue,
      output: sumValue,
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
    100,
    100,
    thumbs,
    (values?: InitialValues) => {
      return [
        {
          fieldType: FormFieldType.Text,
          fieldName: 'neural-node-name',
          label: 'name',
          value: values?.['neural-node-name'] ?? '',
          onChange: (value: string) => {
            if (!nodeComponent || !nodeComponent.nodeInfo) {
              return;
            }
            nodeComponent.nodeInfo.formValues = {
              ...nodeComponent.nodeInfo.formValues,
              ['neural-node-name']: value,
            };
            console.log('onChange', nodeComponent.nodeInfo);
            if (updated) {
              updated();
            }
          },
        },
      ];
    },
    (nodeInstance) => {
      nodeComponent = nodeInstance.node as IRectNodeComponent<NodeInfo>;
      nodeComponent.nodeInfo = nodeComponent.nodeInfo || {};
    },
    {
      hasTitlebar: false,
      category: 'flow-control',
      hideTitle: true,
      isRectThumb: true,
      isCircleRectThumb: true,
      rectThumbWithStraightConnections: true,
      hasStaticWidthHeight: true,
      backgroundColorClassName: 'bg-sky-600',
      hasFormInPopup: true,
    },
    <Text />
  );
};
