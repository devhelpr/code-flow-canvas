import {
  InitialValues,
  NodeTask,
  ThumbConnectionType,
  ThumbType,
  visualNodeFactory,
  IConnectionNodeComponent,
  FormFieldType,
  createJSXElement,
  FlowCanvas,
  BaseNodeInfo,
} from '@devhelpr/visual-programming-system';
import { NodeInfo } from '../types/node-info';
import { IRectNodeComponent } from '../../../visual-programming-system/src';
import { RunCounter } from '../follow-path/run-counter';
import { runNode, getRunIndex } from '../flow-engine/flow-engine';

const fieldName = 'neural-node';
const labelName = 'Neural Node';
export const nodeName = 'neural-node';
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

function sigmoid(z: number) {
  return 1 / (1 + Math.exp(-z));
}

export const getNeuralNode =
  (
    _createRunCounterContext: (
      isRunViaRunButton: boolean,
      shouldResetConnectionSlider: boolean
    ) => RunCounter
  ) =>
  (updated: () => void): NodeTask<any> => {
    const Text = () => <div class="neural-node-value">value</div>;

    let nodeComponent: IRectNodeComponent<NodeInfo> | undefined = undefined;
    let canvasApp: FlowCanvas<NodeInfo> | undefined = undefined;
    let currentRunCounter: RunCounter | undefined;
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
      runCounter?: RunCounter,
      inputConnection?: IConnectionNodeComponent<NodeInfo>
    ) => {
      currentRunCounter = runCounter;
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
      const activationValue = sigmoid(sumValue);
      if (nodeComponent) {
        const element = (nodeComponent.domElement as HTMLElement).querySelector(
          '.neural-node-value'
        );
        if (element) {
          element.textContent = `${sumValue.toFixed(
            2
          )} | ${activationValue.toFixed(2)}`;
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
        result: activationValue,
        output: activationValue,
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
        canvasApp = nodeInstance.contextInstance;
        nodeComponent = nodeInstance.node as IRectNodeComponent<NodeInfo>;
        nodeComponent.nodeInfo = nodeComponent.nodeInfo || {};
        nodeComponent.nodeInfo.outputConnectionInfo = {
          text: 'Weight',
          fieldName: 'weight',
          form: [
            {
              fieldType: FormFieldType.Slider,
              fieldName: 'weight',
              label: 'Weight',
              value: '0',
              min: -1,
              max: 1,
              step: 0.01,
            },
          ],
          onChanged: (connection: IConnectionNodeComponent<BaseNodeInfo>) => {
            if (!nodeComponent || !canvasApp) {
              return;
            }
            // TODO : fix this : inputConnection is needed in compute
            // .. so currently the below doesnt trigger the compute
            runNode(
              nodeComponent,
              canvasApp,
              () => {
                //
              },
              '',
              undefined,
              undefined,
              getRunIndex(),
              connection,
              undefined,
              currentRunCounter, //createRunCounterContext(false, false),
              false,
              {
                trigger: true,
              }
            );
          },
        };
      },
      {
        hasTitlebar: false,
        category: 'flow-control',
        hideTitle: true,
        isRectThumb: true,
        isCircleRectThumb: true,
        rectThumbWithStraightConnections: true,
        hasStaticWidthHeight: true,
        backgroundColorClassName: 'bg-stone-600',
        hasFormInPopup: true,
      },
      <Text />
    );
  };
