import {
  IFlowCanvasBase,
  createElement,
  FormComponent,
  FormFieldType,
  InitialValues,
  INodeComponent,
  IRectNodeComponent,
  IThumbNodeComponent,
  NodeTask,
  ThumbConnectionType,
  ThumbType,
} from '@devhelpr/visual-programming-system';
import { NodeInfo } from '../types/node-info';

import { RunCounter } from '../follow-path/run-counter';
import { runNodeFromThumb } from '../flow-engine/flow-engine';
import {
  compileExpressionAsInfo,
  runExpression,
} from '@devhelpr/expression-compiler';
import { getVariablePayloadInputUtils } from './variable-payload-input-utils.ts/variable-payload-input-utils';

function handleExpression(expression: string, payload: any) {
  try {
    const compiledExpression = compileExpressionAsInfo(expression);
    const expressionFunction = (
      new Function('payload', `${compiledExpression.script}`) as unknown as (
        payload?: any
      ) => any
    ).bind(compiledExpression.bindings);

    const result = runExpression(
      expressionFunction,
      payload,
      false,
      compiledExpression.payloadProperties
    );
    return Boolean(result);
  } catch (error) {
    console.error('Split-by-case: Error in handleExpression', error);
    return false;
  }
}

export const getSplitByCase = (updated: () => void): NodeTask<NodeInfo> => {
  let node: IRectNodeComponent<NodeInfo>;
  let canvasAppInstance: IFlowCanvasBase<NodeInfo> | undefined = undefined;

  const initializeCompute = () => {
    return;
  };
  const computeAsync = (
    input: string,
    loopIndex?: number,
    payload?: any,
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
      const useExpression =
        node?.nodeInfo?.formValues?.['useExpression'] ?? false;

      let thumbNode: IThumbNodeComponent<NodeInfo> | undefined = undefined;
      if (input !== 'true') {
        if (useExpression) {
          const payloadForExpression = getVariablePayloadInputUtils(
            input,
            payload,
            'string',
            -1,
            -1,
            scopeId,
            canvasAppInstance
          );

          if (handleExpression(case1, payloadForExpression)) {
            thumbNode = node.thumbConnectors[0];
          } else if (handleExpression(case2, payloadForExpression)) {
            thumbNode = node.thumbConnectors[1];
          } else if (handleExpression(case3, payloadForExpression)) {
            thumbNode = node.thumbConnectors[2];
          }
        } else if (typeof inputAsString === 'string') {
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
          (_input: string | any[]) => {
            resolve({
              result: true,
              stop: true,
              dummyEndpoint: true,
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
      canvasApp: IFlowCanvasBase<NodeInfo>,
      x: number,
      y: number,
      id?: string,
      initalValues?: InitialValues,
      containerNode?: IRectNodeComponent<NodeInfo>,
      width?: number,
      height?: number
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
        {
          fieldType: FormFieldType.Checkbox,
          fieldName: 'useExpression',
          label: 'Use expressions',
          value: initalValues?.['useExpression'] ?? 'false',
          onChange: (value: boolean) => {
            if (!node.nodeInfo) {
              return;
            }
            node.nodeInfo.formValues = {
              ...node.nodeInfo.formValues,
              useExpression: value,
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
        onSave: (_formValues) => {
          //
        },
      }) as unknown as HTMLElement;
      const rect = canvasApp.createRect(
        x,
        y,
        width ?? 200,
        height ?? 110,
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
        true,
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
        node.nodeInfo.showFormOnlyInPopup = false;
        node.nodeInfo.hasNoFormPopup = true;
        node.nodeInfo.isSettingsPopup = false;
      }
      return node;
    },
  };
};
