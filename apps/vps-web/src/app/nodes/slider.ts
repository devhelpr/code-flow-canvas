import {
  CanvasAppInstance,
  IRectNodeComponent,
  ThumbConnectionType,
  ThumbType,
} from '@devhelpr/visual-programming-system';
import { NodeInfo } from '../types/node-info';
import { InitialValues, NodeTask } from '../node-task-registry';
import { runNode } from '../simple-flow-engine/simple-flow-engine';
import { AnimatePathFunction } from '../follow-path/animate-path';
import { RunCounter } from '../follow-path/run-counter';
import {
  IComputeResult,
  visualNodeFactory,
} from '../node-task-registry/createRectNode';
import { FormFieldType } from '../components/FormField';

export const getSlider =
  (
    animatePath: AnimatePathFunction<NodeInfo>,
    createRunCounterContext: (
      isRunViaRunButton: boolean,
      shouldResetConnectionSlider: boolean
    ) => RunCounter
  ) =>
  (_updated: () => void): NodeTask<NodeInfo> => {
    let canvasAppInstance: CanvasAppInstance<NodeInfo> | undefined = undefined;
    let node: IRectNodeComponent<NodeInfo>;
    let currentValue = 0;
    let triggerButton = false;
    let runCounter: RunCounter | undefined = undefined;
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
            value: values?.['value'] ?? '',
            min: -1.0,
            max: 1.0,
            step: 0.01,
            settings: {
              showLabel: false,
            },
            onChange: (value: string) => {
              if (!node.nodeInfo) {
                return;
              }

              node.nodeInfo.formValues = {
                ...node.nodeInfo.formValues,
                ['value']: value,
              };

              // dont call updated() ... slider position is not stored in the node (do we need to store it via a command by the user?)
              // or only after throttle?
              // .. updated() has a side-effect : it clears the connection history..

              // if (updated) {
              //   updated();
              // }

              if (!canvasAppInstance) {
                return;
              }
              triggerButton = true;
              runCounter = createRunCounterContext(false, false);
              currentValue = parseFloat(value);
              runNode(
                node as unknown as IRectNodeComponent<NodeInfo>,
                canvasAppInstance,
                animatePath,
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
      },
      {
        category: 'UI',
      }
    );
  };
