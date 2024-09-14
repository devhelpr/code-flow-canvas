import {
  FlowCanvasInstance,
  createElement,
  FormComponent,
  FormFieldType,
  FormsComponent,
  InitialValues,
  INodeComponent,
  IRectNodeComponent,
  NodeTask,
  Theme,
  ThumbConnectionType,
  ThumbType,
} from '@devhelpr/visual-programming-system';
import { NodeInfo } from '../types/node-info';
import { RunCounter } from '../follow-path/run-counter';
import { runNode, getRunIndex } from '../flow-engine/flow-engine';

function parseStringToFloat(value: string): number {
  return parseFloat(value.toString().replace(',', '.'));
}

export const getUserInput =
  (
    createRunCounterContext: (
      isRunViaRunButton: boolean,
      shouldResetConnectionSlider: boolean
    ) => RunCounter
  ) =>
  (updated: () => void, theme?: Theme): NodeTask<NodeInfo> => {
    let canvasAppInstance: FlowCanvasInstance<NodeInfo> | undefined = undefined;
    let node: IRectNodeComponent<NodeInfo>;
    let form: FormsComponent | undefined = undefined;
    let inputElement: HTMLInputElement | undefined = undefined;
    let labelElement: HTMLLabelElement | undefined = undefined;
    let currentValue = 0;
    let decimalCount = 0;
    const initializeCompute = () => {
      return;
    };
    const compute = (
      input: string,
      _loopIndex?: number,
      payload?: any,
      _thumbName?: string,
      _scopeId?: string,
      _runCounterCompute?: RunCounter
    ) => {
      try {
        currentValue = parseStringToFloat(input) || 0;
      } catch {
        currentValue = 0;
      }
      if (payload?.['trigger'] === true && node.nodeInfo) {
        if (!isNaN(currentValue)) {
          return {
            result: currentValue,
            followPath: undefined,
          };
        }
      } else {
        currentValue = parseStringToFloat(input);
        if (!isNaN(currentValue)) {
          if (
            inputElement //&&
            //!document.activeElement?.isSameNode(inputElement)
          ) {
            inputElement.value = currentValue.toFixed(decimalCount);
          }

          if (node.nodeInfo?.formValues['name']) {
            canvasAppInstance?.sendMessageFromNode(
              node.nodeInfo?.formValues['name'],
              currentValue.toFixed(decimalCount)
            );
          }

          // return {
          //   result: currentValue.toFixed(decimalCount),
          //   followPath: undefined,
          // };
        }
      }
      return {
        result: false,
        stop: true,
      };
    };
    let changeTimeout: any = null;
    return {
      name: 'user-input',
      family: 'flow-canvas',
      isContainer: false,
      createVisualNode: (
        canvasApp: FlowCanvasInstance<NodeInfo>,
        x: number,
        y: number,
        id?: string,
        initalValues?: InitialValues,
        containerNode?: IRectNodeComponent<NodeInfo>
      ) => {
        canvasAppInstance = canvasApp;
        const initialValue = initalValues?.['label'] ?? '';
        const decimalsInitialValue = initalValues?.['decimals'] ?? '0';
        const externalNameInitialValue = initalValues?.['name'] ?? '';
        decimalCount = parseInt(decimalsInitialValue) || 0;
        //let isResettingInput = false;
        const formElements = [
          {
            fieldType: FormFieldType.Text,
            fieldName: 'value',
            label: initialValue ?? 'value',
            value: '',
            onChange: (value: string) => {
              // if (isResettingInput) {
              //   isResettingInput = false;
              //   console.log('isResettingInput', value);
              //   return;
              // }
              if (!node.nodeInfo) {
                return;
              }
              if (document.activeElement !== inputElement) {
                return;
              }

              const min = 0;
              const max = decimalCount;
              const dot = decimalCount === 0 ? '' : '[.,]?';
              const regex = new RegExp(`^-?(\\d+(?:${dot}\\d{${min},${max}}))`);
              if (!regex.test(value)) {
                console.log('regex.test(value) failed', value);
                return;
              } else {
                const matches = value.match(regex);
                if (matches) {
                  //isResettingInput = true;

                  // this doesnt trigger a onchange event :-)
                  inputElement.value = matches[0];

                  value = matches[0];
                  console.log('matches', matches[0], min, max, dot, value);
                }
              }
              console.log('onChange user-input', node.nodeInfo);
              const tempValue = parseStringToFloat(value);
              if (isNaN(tempValue)) {
                return;
              }
              currentValue = tempValue;
              if (changeTimeout) {
                clearTimeout(changeTimeout);
                changeTimeout = null;
              }
              changeTimeout = setTimeout(() => {
                changeTimeout = null;
                runNode(
                  containerNode ?? node,
                  containerNode
                    ? (containerNode.nodeInfo as any)?.canvasAppInstance
                    : canvasApp,
                  () => {
                    //
                  },
                  currentValue.toString(),
                  undefined,
                  undefined,
                  getRunIndex(),
                  undefined,
                  undefined,
                  createRunCounterContext(false, false),
                  false,
                  {
                    trigger: true,
                  }
                );
              }, 150);
            },
          },
        ];

        const componentWrapper = createElement(
          'div',
          {
            class: `inner-node bg-slate-400 rounded p-1`, //p-4
          },
          undefined
        ) as unknown as INodeComponent<NodeInfo>;

        const formWrapper = createElement(
          'div',
          {
            class: `ui-form-node p-4 border-[2px] border-solid rounded bg-slate-500`,
            style: {
              'border-color': theme?.backgroundAsHexColor ?? '#000000',
            },
          },
          componentWrapper?.domElement
        ) as unknown as INodeComponent<NodeInfo>;

        form = formWrapper?.domElement
          ? FormComponent({
              rootElement: formWrapper?.domElement as HTMLElement,
              id: id ?? '',
              formElements,
              hasSubmitButton: false,
              onSave: (formValues) => {
                console.log('onSave', formValues);
              },
            })
          : undefined;

        if (form && form.element) {
          inputElement = form.element.querySelector(
            'input'
          ) as HTMLInputElement;
          labelElement = form.element.querySelector(
            'label'
          ) as HTMLLabelElement;
        }
        const rect = canvasApp.createRect(
          x,
          y,
          200,
          100,
          undefined,
          [
            {
              thumbType: ThumbType.StartConnectorRight,
              thumbIndex: 0,
              connectionType: ThumbConnectionType.start,
              color: 'white',
              label: ' ',
              maxConnections: -1,
              //thumbConstraint: 'value',
              prefixIcon: 'icon-bolt',
              formFieldName: 'value',
              formId: id,
              hint: 'onInput event',
            },
            {
              thumbType: ThumbType.EndConnectorCenter,
              thumbIndex: 0,
              connectionType: ThumbConnectionType.end,
              color: 'white',
              label: ' ',
              //thumbConstraint: 'value',
            },
          ],
          componentWrapper,
          {
            classNames: `bg-slate-500 p-4 rounded`,
          },
          undefined,
          undefined,
          undefined,
          id,
          {
            type: 'user-input',
            formValues: {
              label: initialValue ?? '',
              value: '',
              decimals: decimalsInitialValue ?? '0',
              name: externalNameInitialValue ?? '',
            },
          },
          containerNode
        );
        if (!rect.nodeComponent) {
          throw new Error('rect.nodeComponent is undefined');
        }

        node = rect.nodeComponent;

        if (node.nodeInfo) {
          node.nodeInfo.formElements = [
            {
              fieldType: FormFieldType.Text,
              fieldName: 'label',
              value: initialValue ?? '',
              onChange: (value: string) => {
                if (!node.nodeInfo) {
                  return;
                }

                node.nodeInfo.formValues = {
                  ...node.nodeInfo.formValues,
                  label: value,
                };

                if (labelElement) {
                  labelElement.textContent = value;
                }
                updated();
              },
            },
            {
              fieldType: FormFieldType.Text,
              fieldName: 'decimals',
              value: decimalsInitialValue ?? '',
              onChange: (value: string) => {
                if (!node.nodeInfo) {
                  return;
                }
                node.nodeInfo.formValues = {
                  ...node.nodeInfo.formValues,
                  decimals: value,
                };
                decimalCount = parseInt(value) || 0;
                updated();

                if (!isNaN(currentValue)) {
                  if (inputElement) {
                    inputElement.value = currentValue.toFixed(decimalCount);
                  }
                }
              },
            },
            {
              fieldType: FormFieldType.Text,
              fieldName: 'name',
              label: 'External name',
              value: externalNameInitialValue ?? '',
              onChange: (value: string) => {
                if (!node.nodeInfo) {
                  return;
                }
                if (node.nodeInfo.formValues['name']) {
                  canvasApp.removeNodeKeyListener(
                    node.nodeInfo.formValues['name'],
                    listener
                  );
                }
                node.nodeInfo.formValues = {
                  ...node.nodeInfo.formValues,
                  name: value,
                };
                canvasApp.registerNodeKeyListener(
                  node.nodeInfo.formValues['name'],
                  listener
                );

                updated();
              },
            },
          ];
          node.nodeInfo.compute = compute;
          node.nodeInfo.initializeCompute = initializeCompute;

          node.nodeInfo.isSettingsPopup = true;
          node.nodeInfo.isUINode = true; // TODO : use isUINode for detecting loops in pushCallback / flow-engine

          const listener = (_key: string, value: any) => {
            // currentValue = parseStringToFloat(value);
            // if (!isNaN(currentValue)) {
            //   if (inputElement) {
            //     inputElement.value = currentValue.toFixed(decimalCount);
            //   }
            // }

            if (!node.nodeInfo) {
              return;
            }

            const min = 0;
            const max = decimalCount;
            const dot = decimalCount === 0 ? '' : '[.,]?';
            const regex = new RegExp(`^-?(\\d+(?:${dot}\\d{${min},${max}}))`);
            if (!regex.test(value)) {
              console.log('regex.test(value) failed', value);
              return;
            } else {
              const matches = value.match(regex);
              if (matches) {
                value = matches[0];
                console.log('matches', matches[0], min, max, dot, value);
              }
            }
            const tempValue = parseStringToFloat(value);
            if (isNaN(tempValue)) {
              return;
            }
            currentValue = tempValue;
            if (changeTimeout) {
              clearTimeout(changeTimeout);
              changeTimeout = null;
            }
            changeTimeout = setTimeout(() => {
              changeTimeout = null;
              runNode(
                containerNode ?? node,
                containerNode
                  ? (containerNode.nodeInfo as any)?.canvasAppInstance
                  : canvasApp,
                () => {
                  //
                },
                currentValue.toString(),
                undefined,
                undefined,
                getRunIndex(),
                undefined,
                undefined,
                createRunCounterContext(false, false),
                false,
                {
                  trigger: true,
                }
              );
            }, 150);
          };

          if (node.nodeInfo.formValues['name']) {
            canvasApp.registerNodeKeyListener(
              node.nodeInfo.formValues['name'],
              listener
            );

            node.nodeInfo.delete = () => {
              if (node.nodeInfo?.formValues['name']) {
                canvasApp.removeNodeKeyListener(
                  node.nodeInfo.formValues['name'],
                  listener
                );
              }
            };
          }
        }
        return node;
      },
    };
  };
