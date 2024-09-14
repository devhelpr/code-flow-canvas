import {
  FlowCanvasInstance,
  FormFieldType,
  IComputeResult,
  IRectNodeComponent,
  InitialValues,
  NodeTask,
  ThumbConnectionType,
  ThumbType,
  visualNodeFactory,
} from '@devhelpr/visual-programming-system';
import { NodeInfo } from '../types/node-info';
import { runNode } from '../flow-engine/flow-engine';
import { RunCounter } from '../follow-path/run-counter';

export const getSlider =
  (
    _createRunCounterContext: (
      isRunViaRunButton: boolean,
      shouldResetConnectionSlider: boolean
    ) => RunCounter
  ) =>
  (
    updated: (shouldClearExecutionHistory?: boolean) => void
  ): NodeTask<NodeInfo> => {
    let canvasAppInstance: FlowCanvasInstance<NodeInfo> | undefined = undefined;
    let node: IRectNodeComponent<NodeInfo>;
    let currentValue = 0;
    let triggerButton = false;
    //let runCounter: RunCounter | undefined = undefined;
    let labelElement: HTMLLabelElement | undefined = undefined;

    let currentRunCounter: RunCounter | undefined;

    const initializeCompute = () => {
      currentValue = 0;
      if (timer !== undefined) {
        clearInterval(timer);
        timer = undefined;
      }
      return;
    };
    const compute = (
      input: string,
      _loopIndex?: number,
      payload?: any,
      _thumbName?: string,
      _scopeId?: string,
      runCounter?: RunCounter
    ): IComputeResult => {
      try {
        currentValue = parseFloat(input) || 0;
      } catch {
        currentValue = 0;
      }
      if (!triggerButton) {
        currentRunCounter = runCounter;
      }
      if (triggerButton || payload?.trigger) {
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
    let timer: number | undefined;
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
          prefixIcon: 'icon-bolt',
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
              //const runCounter = createRunCounterContext(false, false);
              currentValue = parseFloat(value);

              function start() {
                if (!canvasAppInstance) {
                  return;
                }
                console.log('start()');

                runNode(
                  node as unknown as IRectNodeComponent<NodeInfo>,
                  canvasAppInstance,
                  () => {
                    console.log(
                      'STOPPED RUN-NODE from slider',
                      currentRunCounter?.runCounter === 0
                    );
                  },
                  currentValue.toString(),
                  undefined,
                  undefined,
                  undefined,
                  undefined,
                  undefined, //crypto.randomUUID(),
                  currentRunCounter,
                  false
                );
              }
              if (timer === undefined && currentRunCounter?.runCounter === 0) {
                // && timer === undefined && currentRunCounter?.runCounter === 0) {
                start();
              } else {
                if (timer !== undefined) {
                  clearInterval(timer);
                  timer = undefined;
                }
                timer = setInterval(() => {
                  if (currentRunCounter?.runCounter === 0) {
                    if (timer !== undefined) {
                      clearInterval(timer);
                      timer = undefined;
                    }
                    start();
                  }
                }, 0) as unknown as number;
              }
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
          node.nodeInfo.canBeStartedByTrigger = true;
          node.nodeInfo.isUINode = true;
          node.nodeInfo.readPropertyFromNodeInfoForInitialTrigger = 'value';
          node.nodeInfo.delete = () => {
            if (timer !== undefined) {
              clearInterval(timer);
              timer = undefined;
            }
          };
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
        additionalInnerNodeClassNames: 'border-[2px] border-solid pt-5',
      }
    );
  };
