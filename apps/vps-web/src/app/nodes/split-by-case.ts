import {
  CanvasAppInstance,
  createElement,
  INodeComponent,
  IRectNodeComponent,
  IThumbNodeComponent,
  ThumbConnectionType,
  ThumbType,
} from '@devhelpr/visual-programming-system';
import { FormComponent } from '../components/form-component';
import { NodeInfo } from '../types/node-info';

import { runNodeFromThumb } from '../simple-flow-engine/simple-flow-engine';
import { InitialValues, NodeTask } from '../node-task-registry';
import {
  AnimatePathFromThumbFunction,
  AnimatePathFunction,
} from '../follow-path/animate-path';
import { FormFieldType } from '../components/FormField';
import { RunCounter } from '../follow-path/run-counter';

export const getSplitByCase =
  (
    _animatePath: AnimatePathFunction<NodeInfo>,
    animatePathFromThumb: AnimatePathFromThumbFunction<NodeInfo>
  ) =>
  (updated: () => void): NodeTask<NodeInfo> => {
    let node: IRectNodeComponent<NodeInfo>;
    let canvasAppInstance: CanvasAppInstance<NodeInfo> | undefined = undefined;

    const initializeCompute = () => {
      return;
    };
    const computeAsync = (
      input: string,
      loopIndex?: number,
      _payload?: any,
      _thumbName?: string,
      scopeId?: string,
      runCounterCompute?: RunCounter
    ) => {
      return new Promise((resolve, reject) => {
        if (
          !node.thumbConnectors ||
          node.thumbConnectors.length < 3 ||
          !canvasAppInstance
        ) {
          reject();
          return;
        }
        let inputAsString = input.toString();
        if (typeof input === 'object' && (input as any).state) {
          inputAsString = (input as any).state;
        }
        const case1 = node?.nodeInfo?.formValues?.['case1'] ?? '';
        const case2 = node?.nodeInfo?.formValues?.['case2'] ?? '';
        const case3 = node?.nodeInfo?.formValues?.['case3'] ?? '';
        console.log(
          'input',
          inputAsString,
          'case1',
          case1,
          'case2',
          case2,
          'case3',
          case3
        );

        let thumbNode: IThumbNodeComponent<NodeInfo> | undefined = undefined;
        if (input !== 'true') {
          if (typeof inputAsString === 'string') {
            if (case1 && inputAsString === case1) {
              thumbNode = node.thumbConnectors[0];
            } else if (case2 && inputAsString === case2) {
              thumbNode = node.thumbConnectors[1];
            } else if (case3 && inputAsString === case3) {
              thumbNode = node.thumbConnectors[2];
            } else if ((case2 || '').trim() == '') {
              thumbNode = node.thumbConnectors[1];
            } else if ((case3 || '').trim() == '') {
              thumbNode = node.thumbConnectors[2];
            }
          }
        }
        if (thumbNode) {
          runNodeFromThumb(
            thumbNode,
            canvasAppInstance,
            animatePathFromThumb,
            (_input: string | any[]) => {
              resolve({
                result: true,
                stop: true,
              });
            },
            input,
            node,
            loopIndex,
            scopeId,
            runCounterCompute
          );
        } else {
          resolve({
            result: true,
            stop: true,
          });
        }
      });
    };

    return {
      name: 'split-by-case',
      family: 'flow-canvas',
      isContainer: false,
      category: 'flow-control',
      createVisualNode: (
        canvasApp: CanvasAppInstance<NodeInfo>,
        x: number,
        y: number,
        id?: string,
        initalValues?: InitialValues,
        containerNode?: IRectNodeComponent<NodeInfo>
      ) => {
        canvasAppInstance = canvasApp;
        const formElements = [
          {
            fieldType: FormFieldType.Text,
            fieldName: 'case1',
            label: '=',
            isRow: true,
            value: initalValues?.['case1'] ?? '',
            onChange: (value: string) => {
              if (!node.nodeInfo) {
                return;
              }
              node.nodeInfo.formValues = {
                ...node.nodeInfo.formValues,
                case1: value,
              };

              if (updated) {
                updated();
              }
            },
          },
          {
            fieldType: FormFieldType.Text,
            fieldName: 'case2',
            label: '=',
            isRow: true,
            value: initalValues?.['case2'] ?? '',
            onChange: (value: string) => {
              if (!node.nodeInfo) {
                return;
              }
              node.nodeInfo.formValues = {
                ...node.nodeInfo.formValues,
                case2: value,
              };

              if (updated) {
                updated();
              }
            },
          },
          {
            fieldType: FormFieldType.Text,
            fieldName: 'case3',
            label: '=',
            isRow: true,
            value: initalValues?.['case3'] ?? '',
            onChange: (value: string) => {
              if (!node.nodeInfo) {
                return;
              }
              node.nodeInfo.formValues = {
                ...node.nodeInfo.formValues,
                case3: value,
              };

              if (updated) {
                updated();
              }
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

        FormComponent({
          rootElement: componentWrapper.domElement as HTMLElement,
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
          200,
          110,
          undefined,
          [
            {
              thumbType: ThumbType.StartConnectorRight,
              thumbIndex: 0,
              connectionType: ThumbConnectionType.start,
              color: 'white',
              label: ' ',
              name: 'output1',
              formId: id,
              formFieldName: 'case1',
            },
            {
              thumbType: ThumbType.StartConnectorRight,
              thumbIndex: 1,
              connectionType: ThumbConnectionType.start,
              color: 'white',
              label: ' ',
              name: 'output2',
              formId: id,
              formFieldName: 'case2',
            },
            {
              thumbType: ThumbType.StartConnectorRight,
              thumbIndex: 2,
              connectionType: ThumbConnectionType.start,
              color: 'white',
              label: ' ',
              name: 'output3',
              formId: id,
              formFieldName: 'case3',
            },
            {
              thumbType: ThumbType.EndConnectorCenter,
              thumbIndex: 0,
              connectionType: ThumbConnectionType.end,
              color: 'white',
              label: ' ',
            },
          ],
          componentWrapper,
          {
            classNames: `bg-slate-500 p-4 rounded`,
          },
          false,
          undefined,
          undefined,
          id,
          {
            type: 'split-by-case',
            formValues: { ...initalValues },
          },
          containerNode
        );
        if (!rect.nodeComponent) {
          throw new Error('rect.nodeComponent is undefined');
        }

        node = rect.nodeComponent;
        if (node.nodeInfo) {
          node.nodeInfo.formElements = formElements;
          node.nodeInfo.computeAsync = computeAsync;
          node.nodeInfo.initializeCompute = initializeCompute;
        }
        return node;
      },
    };
  };
