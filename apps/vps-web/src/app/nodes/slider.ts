import {
  CanvasAppInstance,
  IRectNodeComponent,
  ThumbConnectionType,
  ThumbType,
} from '@devhelpr/visual-programming-system';
import { NodeInfo } from '../types/node-info';
import { InitialValues, NodeTask } from '../node-task-registry';
import { runNode } from '../simple-flow-engine/simple-flow-engine';
import { RunCounter } from '../follow-path/run-counter';
import {
  IComputeResult,
  visualNodeFactory,
} from '../node-task-registry/createRectNode';
import { FormFieldType } from '../components/FormField';

export const getSlider =
  (
    createRunCounterContext: (
      isRunViaRunButton: boolean,
      shouldResetConnectionSlider: boolean
    ) => RunCounter
  ) =>
  (
    updated: (shouldClearExecutionHistory?: boolean) => void
  ): NodeTask<NodeInfo> => {
    let canvasAppInstance: CanvasAppInstance<NodeInfo> | undefined = undefined;
    let node: IRectNodeComponent<NodeInfo>;
    let currentValue = 0;
    let triggerButton = false;
    let runCounter: RunCounter | undefined = undefined;
    let labelElement: HTMLLabelElement | undefined = undefined;
    const initializeCompute = () => {
      currentValue = 0;
      return;
    };
    const compute = (input: string): IComputeResult => {
      try {
        currentValue = parseFloat(input) || 0;
      } catch {
        currentValue = 0;
      }
      if (triggerButton) {
        triggerButton = false;
        return {
          result: currentValue,
          followPath: undefined,
          output: currentValue,
        };
      }
      return {
        result: false,
        output: false,
        stop: true,
        followPath: undefined,
      };
    };

    return visualNodeFactory(
      'slider',
      'Value',
      'flow-canvas',
      'value',
      compute,
      initializeCompute,
      false,
      200,
      100,
      [
        {
          thumbType: ThumbType.StartConnectorCenter,
          thumbIndex: 0,
          connectionType: ThumbConnectionType.start,
          color: 'white',
          label: '#',
          thumbConstraint: 'value',
        },
      ],
      (values?: InitialValues) => {
        const formElements = [
          {
            fieldType: FormFieldType.Slider,
            fieldName: 'value',
            label: 'Slider',
            value: values?.['value'] ?? '',
            min: -1.0,
            max: 1.0,
            step: 0.01,
            settings: {
              showLabel: true,
            },
            onChange: (value: string) => {
              if (!node.nodeInfo) {
                return;
              }

              node.nodeInfo.formValues = {
                ...node.nodeInfo.formValues,
                ['value']: value,
              };

              // updated() stores this change in the flow
              // .. updated() has a side-effect : it clears the connection history..
              // .. so call it for the slider with an extra optional parameter: false
              // .. because below the slider triggers the flow and by not
              //  clearing the connection history, the slider changes can be seen

              if (updated) {
                updated(false);
              }

              if (!canvasAppInstance) {
                return;
              }
              triggerButton = true;
              runCounter = createRunCounterContext(false, false);
              currentValue = parseFloat(value);
              runNode(
                node as unknown as IRectNodeComponent<NodeInfo>,
                canvasAppInstance,
                undefined,
                currentValue.toString(),
                undefined,
                undefined,
                undefined,
                undefined,
                undefined,
                runCounter,
                false
              );
            },
          },
        ];
        return formElements;
      },
      (nodeInstance) => {
        node = nodeInstance.node as IRectNodeComponent<NodeInfo>;
        canvasAppInstance = nodeInstance.contextInstance;

        labelElement = (
          nodeInstance.node.domElement as HTMLElement
        ).querySelector('form label') as HTMLLabelElement;

        if (node.nodeInfo) {
          node.nodeInfo.isSettingsPopup = true;
          if (labelElement) {
            labelElement.textContent =
              node.nodeInfo.formValues?.['label'] ?? '';
          }
          node.nodeInfo.formElements = [
            {
              fieldType: FormFieldType.Text,
              fieldName: 'label',
              value: node.nodeInfo.formValues?.['label'] ?? '',
              onChange: (value: string) => {
                if (!node.nodeInfo) {
                  return;
                }
                node.nodeInfo.formValues = {
                  ...node.nodeInfo.formValues,
                  label: value,
                };
                if (labelElement) {
                  (labelElement as HTMLElement).textContent = value;
                }
                updated();
                nodeInstance.rect?.resize();
              },
            },
          ];
        }
      },
      {
        category: 'UI',
      }
    );
  };
