import {
  CanvasAppInstance,
  createElement,
  INodeComponent,
  IRectNodeComponent,
  ThumbConnectionType,
  ThumbType,
} from '@devhelpr/visual-programming-system';
import { FormComponent, FormsComponent } from '../components/form-component';
import { NodeInfo } from '../types/node-info';
import { InitialValues, NodeTask } from '../node-task-registry';
import { FormFieldType } from '../components/FormField';
import { RunCounter } from '../follow-path/run-counter';
import { AnimatePathFunction } from '../follow-path/animate-path';
import { getRunIndex, runNode } from '../simple-flow-engine/simple-flow-engine';

function parseStringToFloat(value: string): number {
  return parseFloat(value.toString().replace(',', '.'));
}

export const getUserInput =
  (
    animatePath: AnimatePathFunction<NodeInfo>,
    createRunCounterContext: (
      isRunViaRunButton: boolean,
      shouldResetConnectionSlider: boolean
    ) => RunCounter
  ) =>
  (updated: () => void): NodeTask<NodeInfo> => {
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
          if (inputElement) {
            inputElement.value = currentValue.toFixed(decimalCount);
          }
          return {
            result: currentValue.toFixed(decimalCount),
            followPath: undefined,
          };
        }
      }
      return {
        result: false,
        stop,
      };
    };

    return {
      name: 'user-input',
      family: 'flow-canvas',
      isContainer: false,
      createVisualNode: (
        canvasApp: CanvasAppInstance<NodeInfo>,
        x: number,
        y: number,
        id?: string,
        initalValues?: InitialValues,
        containerNode?: IRectNodeComponent<NodeInfo>
      ) => {
        const initialValue = initalValues?.['label'] ?? '';
        const decimalsInitialValue = initalValues?.['decimals'] ?? '0';
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

              runNode(
                containerNode ?? node,
                containerNode
                  ? (containerNode.nodeInfo as any)?.canvasAppInstance
                  : canvasApp,
                animatePath,
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
            },
          },
        ];

        const componentWrapper = createElement(
          'div',
          {
            class: `inner-node bg-slate-500 p-4 rounded`,
          },
          undefined
        ) as unknown as INodeComponent<NodeInfo>;

        form = FormComponent({
          rootElement: componentWrapper.domElement as HTMLElement,
          id: id ?? '',
          formElements,
          hasSubmitButton: false,
          onSave: (formValues) => {
            console.log('onSave', formValues);
          },
        });

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
              thumbType: ThumbType.StartConnectorCenter,
              thumbIndex: 0,
              connectionType: ThumbConnectionType.start,
              color: 'white',
              label: ' ',
              maxConnections: -1,
              //thumbConstraint: 'value',
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
          ];
          node.nodeInfo.compute = compute;
          node.nodeInfo.initializeCompute = initializeCompute;

          node.nodeInfo.isSettingsPopup = true;
        }
        return node;
      },
    };
  };
