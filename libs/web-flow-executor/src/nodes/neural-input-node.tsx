import {
  InitialValues,
  NodeTask,
  NodeTaskFactory,
  ThumbConnectionType,
  ThumbType,
  visualNodeFactory,
  IConnectionNodeComponent,
  FormFieldType,
  IFormsComponent,
  createJSXElement,
} from '@devhelpr/visual-programming-system';
import { NodeInfo } from '../types/node-info';
import { IRectNodeComponent } from '../../../visual-programming-system/src';
import { RunCounter } from '../follow-path/run-counter';

const fieldName = 'neural-input-node';
const labelName = 'Neural Input Node';
export const nodeName = 'neural-input-node';
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
];

export const getNeuralInputNode: NodeTaskFactory<NodeInfo> = (
  updated: () => void
): NodeTask<any> => {
  let nodeComponent: IRectNodeComponent<NodeInfo> | undefined = undefined;
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
    const value = parseFloat(
      nodeComponent?.nodeInfo?.formValues['value'] ?? '0'
    );
    return {
      result: value,
      output: value,
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
          fieldType: FormFieldType.Slider,
          fieldName: 'value',
          label: 'Value',
          value: values?.['value'] ?? '0',
          min: 0,
          max: 255,
          step: 1,
          onChange: (value: string, _formComponent: IFormsComponent) => {
            if (!nodeComponent?.nodeInfo) {
              return;
            }
            nodeComponent.nodeInfo.formValues = {
              ...nodeComponent.nodeInfo.formValues,
              value: value,
            };
            const element = (
              nodeComponent.domElement as HTMLElement
            ).querySelector('.neural-node-value');
            if (!element) {
              return;
            }
            element.textContent = value;
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
      };
      if (!nodeComponent.domElement) {
        return;
      }
      const element = (nodeComponent.domElement as HTMLElement).querySelector(
        '.neural-node-value'
      );
      if (!element) {
        return;
      }
      element.textContent = nodeComponent.nodeInfo.formValues['value'];
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
