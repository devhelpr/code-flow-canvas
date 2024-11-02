import {
  IFlowCanvasBase,
  createNodeElement,
  InitialValues,
  INodeComponent,
  IRectNodeComponent,
  NodeTask,
  ThumbConnectionType,
  ThumbType,
  FormFieldType,
} from '@devhelpr/visual-programming-system';
import { NodeInfo } from '../types/node-info';
import { runNodeFromThumb } from '../flow-engine/flow-engine';
import { RunCounter } from '../follow-path/run-counter';

const thumbs = [
  {
    thumbType: ThumbType.StartConnectorRight,
    thumbIndex: 0,
    connectionType: ThumbConnectionType.start,
    color: 'white',
    label: '1',
    name: 'output1',
  },
  {
    thumbType: ThumbType.StartConnectorRight,
    thumbIndex: 1,
    connectionType: ThumbConnectionType.start,
    color: 'white',
    label: '2',
    name: 'output2',
  },
  {
    thumbType: ThumbType.EndConnectorCenter,
    thumbIndex: 0,
    connectionType: ThumbConnectionType.end,
    color: 'white',
    label: ' ',
  },
];

export const getSequential = (updated: () => void): NodeTask<NodeInfo> => {
  let node: IRectNodeComponent<NodeInfo>;
  let canvasAppInstance: IFlowCanvasBase<NodeInfo> | undefined = undefined;

  const initializeCompute = () => {
    return;
  };
  const computeAsync = (
    input: string,
    loopIndex?: number,
    _payload?: any,
    _thumbName?: string,
    scopeId?: string,
    runCounter?: RunCounter
  ) => {
    const sequentialRunCount =
      node.nodeInfo?.formValues?.['output-thumbs']?.length ?? 0;

    let sequentialRunIndex = 0;

    return new Promise((resolve, reject) => {
      function runAdditionalOutputThumb(
        thumbIndex: number,
        input: string | any[],
        node: IRectNodeComponent<NodeInfo>,
        loopIndex?: number,
        scopeId?: string,
        runCounter?: RunCounter
      ) {
        if (
          !node.thumbConnectors ||
          node.thumbConnectors.length < thumbIndex + 1 ||
          !canvasAppInstance
        ) {
          reject();
          return;
        }
        runNodeFromThumb(
          node.thumbConnectors[thumbIndex + 1],
          canvasAppInstance,
          (inputFromRun: string | any[]) => {
            sequentialRunIndex++;
            if (sequentialRunIndex < sequentialRunCount) {
              runAdditionalOutputThumb(
                thumbIndex + 1,
                input,
                node,
                loopIndex,
                scopeId,
                runCounter
              );
            } else {
              resolve({
                result: inputFromRun,
                output: inputFromRun,
                stop: true,
              });
            }
          },
          input,
          node,
          loopIndex,
          scopeId,
          runCounter
        );
      }
      if (
        !node.thumbConnectors ||
        node.thumbConnectors.length < 2 ||
        !canvasAppInstance
      ) {
        reject();
        return;
      }
      runNodeFromThumb(
        node.thumbConnectors[0],
        canvasAppInstance,
        (_inputFromFirstRun: string | any[]) => {
          if (
            !node.thumbConnectors ||
            node.thumbConnectors.length < 2 ||
            !canvasAppInstance
          ) {
            reject();
            return;
          }
          runNodeFromThumb(
            node.thumbConnectors[1],
            canvasAppInstance,
            (inputFromSecondRun: string | any[]) => {
              if (sequentialRunCount > 0) {
                runAdditionalOutputThumb(
                  2,
                  input,
                  node,
                  loopIndex,
                  scopeId,
                  runCounter
                );
              } else {
                resolve({
                  result: inputFromSecondRun,
                  output: inputFromSecondRun,
                  stop: true,
                });
              }
            },
            input,
            node,
            loopIndex,
            scopeId,
            runCounter
          );
        },
        input,
        node,
        loopIndex,
        scopeId,
        runCounter
      );
    });
  };

  return {
    name: 'sequential',
    family: 'flow-canvas',
    isContainer: false,
    category: 'flow-control',
    createVisualNode: (
      canvasApp: IFlowCanvasBase<NodeInfo>,
      x: number,
      y: number,
      id?: string,
      initialValues?: InitialValues,
      containerNode?: IRectNodeComponent<NodeInfo>
    ) => {
      canvasAppInstance = canvasApp;
      const jsxComponentWrapper = createNodeElement(
        'div',
        {
          class: `inner-node bg-white text-black p-4 rounded pl-6 flex flex-row justify-center items-center`,
          style: {
            'clip-path': 'polygon(0 50%, 100% 0, 100% 100%)',
          },
        },
        undefined,
        'sequential'
      ) as unknown as INodeComponent<NodeInfo>;

      const nodeThumbs = [...thumbs];
      const additionalThumbsLength =
        initialValues?.['output-thumbs']?.length ?? 0;

      for (let i = 0; i < additionalThumbsLength; i++) {
        nodeThumbs.push({
          thumbType: ThumbType.StartConnectorRight,
          thumbIndex: i + 2,
          connectionType: ThumbConnectionType.start,
          color: 'white',
          label: `${i + 3}`,
          name: `output${i + 3}`,
        });
      }

      const rect = canvasApp.createRect(
        x,
        y,
        110,
        110,
        undefined,
        nodeThumbs,
        jsxComponentWrapper,
        {
          classNames: `bg-slate-500 p-4 rounded`,
        },
        false,
        undefined,
        undefined,
        id,
        {
          type: 'sequential',
          formValues: {
            'output-thumbs': initialValues?.['output-thumbs'] ?? [],
          },
        },
        containerNode
      );
      if (!rect.nodeComponent) {
        throw new Error('rect.nodeComponent is undefined');
      }
      if (rect?.resize) {
        rect.resize();
      }

      node = rect.nodeComponent;
      if (node.nodeInfo) {
        node.nodeInfo.formElements = [
          {
            fieldType: FormFieldType.Array,
            fieldName: 'output-thumbs',
            label: 'Output thumbs',
            value: initialValues?.['output-thumbs'] ?? [],
            hideDeleteButton: true,
            formElements: [
              {
                fieldName: 'thumbName',
                fieldType: FormFieldType.Text,
                value: '',
              },
            ],
            onChange: (values: unknown[]) => {
              if (!node.nodeInfo) {
                return;
              }
              const oldThumbsLength =
                node.nodeInfo.formValues?.['output-thumbs']?.length ?? 0;
              node.nodeInfo.formValues = {
                ...node.nodeInfo.formValues,
                ['output-thumbs']: [...values],
              };
              const newThumbLength = values.length - oldThumbsLength;
              if (newThumbLength > 0) {
                for (let i = 0; i < newThumbLength; i++) {
                  if (node) {
                    canvasAppInstance?.addThumbToNode(
                      {
                        thumbType: ThumbType.StartConnectorRight,
                        thumbIndex: i + oldThumbsLength + 2,
                        connectionType: ThumbConnectionType.start,
                        color: 'white',
                        label: ' ',
                        name: `output${i + oldThumbsLength + 3}`,
                      },
                      node
                    );
                  }
                }
              }
              node?.update?.();
              if (updated) {
                updated();
              }
              if (rect && rect.resize) {
                rect.resize();
              }
            },
          },
        ];
        node.nodeInfo.isSettingsPopup = true;
        node.nodeInfo.computeAsync = computeAsync;
        node.nodeInfo.initializeCompute = initializeCompute;
      }
      return node;
    },
  };
};
