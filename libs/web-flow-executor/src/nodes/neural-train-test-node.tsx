import {
  InitialValues,
  NodeTask,
  visualNodeFactory,
  IConnectionNodeComponent,
  FormFieldType,
  createJSXElement,
  IFlowCanvasBase,
  BaseNodeInfo,
  ThumbConnectionType,
  ThumbType,
} from '@devhelpr/visual-programming-system';
import { NodeInfo } from '../types/node-info';
import { IRectNodeComponent } from '../../../visual-programming-system/src';
import { RunCounter } from '../follow-path/run-counter';

const fieldName = 'neural-train-test-node';
const labelName = 'Neural Test Node';
export const nodeName = 'neural-train-test-node';
const familyName = 'flow-canvas';

const thumbs = [
  {
    thumbType: ThumbType.Center,
    thumbIndex: 0,
    connectionType: ThumbConnectionType.end,
    color: 'white',
    label: ' ',
    maxConnections: 1,
  },
];

export const getNeuralTrainTestNode =
  (
    _createRunCounterContext: (
      isRunViaRunButton: boolean,
      shouldResetConnectionSlider: boolean
    ) => RunCounter
  ) =>
  (updated: () => void): NodeTask<any> => {
    let nodeComponent: IRectNodeComponent<NodeInfo> | undefined = undefined;
    let canvasApp: IFlowCanvasBase<NodeInfo> | undefined = undefined;
    const initializeCompute = () => {
      //
    };

    const Text = () => <div class="neural-node-value">value</div>;

    const compute = (
      _input: string,
      _loopIndex?: number,
      _payload?: any,
      _thumbName?: string,
      _scopeId?: string,
      _runCounter?: RunCounter,
      _inputConnection?: IConnectionNodeComponent<NodeInfo>
    ) => {
      if (canvasApp) {
        let node: IRectNodeComponent<NodeInfo> | undefined = undefined;
        const name = nodeComponent?.nodeInfo?.formValues['neural-node-name'];
        canvasApp.elements.forEach((element) => {
          if (element.nodeInfo?.formValues?.['neural-node-name'] === name) {
            node = element as IRectNodeComponent<NodeInfo>;
          }
        });

        if (node) {
          (node as IRectNodeComponent<NodeInfo>).connections.forEach(
            (connection) => {
              const connectionTextElement = document.querySelector(
                `#${connection.id}_connection-value-label`
              );
              const newValue = Math.random();
              if ((connection?.nodeInfo as BaseNodeInfo)?.formValues) {
                (connection.nodeInfo as BaseNodeInfo).formValues['weight'] =
                  newValue;
              }
              if (connectionTextElement) {
                connectionTextElement.textContent = newValue.toFixed(2);
              }
              updated();
            }
          );
          console.log(
            'neural train test node',
            nodeComponent?.nodeInfo?.formValues['neural-node-name'],
            node
          );
        }
      }

      return {
        result: 0,
        output: 0,
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
            label: 'train name',
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

        if (!nodeComponent.domElement) {
          return;
        }
        const element = (nodeComponent.domElement as HTMLElement).querySelector(
          '.neural-node-value'
        );
        if (!element) {
          return;
        }
        element.textContent = nodeComponent.nodeInfo.formValues['value'] ?? 0;
      },
      {
        hasTitlebar: false,
        category: 'flow-control',
        hideTitle: true,
        isRectThumb: true,
        isCircleRectThumb: true,
        rectThumbWithStraightConnections: true,
        hasStaticWidthHeight: true,
        hasFormInPopup: true,
        backgroundColorClassName: 'bg-white',
        textColorClassName: 'text-black',
      },
      <Text />
    );
  };
