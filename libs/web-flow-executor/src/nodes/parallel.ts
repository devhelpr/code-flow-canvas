import {
  FlowCanvas,
  createNodeElement,
  FormFieldType,
  InitialValues,
  INodeComponent,
  IRectNodeComponent,
  NodeTask,
  ThumbConnectionType,
  ThumbType,
} from '@devhelpr/visual-programming-system';
import { NodeInfo } from '../types/node-info';

import { RunCounter } from '../follow-path/run-counter';
import { runNodeFromThumb } from '../flow-engine/flow-engine';

const thumbs = [
  {
    thumbType: ThumbType.StartConnectorRight,
    thumbIndex: 0,
    connectionType: ThumbConnectionType.start,
    color: 'white',
    label: ' ',
    name: 'output1',
  },
  {
    thumbType: ThumbType.StartConnectorRight,
    thumbIndex: 1,
    connectionType: ThumbConnectionType.start,
    color: 'white',
    label: ' ',
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

export const getParallel = (updated: () => void): NodeTask<NodeInfo> => {
  let node: IRectNodeComponent<NodeInfo>;
  let canvasAppInstance: FlowCanvas<NodeInfo> | undefined = undefined;

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
    return new Promise((resolve, reject) => {
      if (
        !node.thumbConnectors ||
        node.thumbConnectors.length < 2 ||
        !canvasAppInstance
      ) {
        reject();
        return;
      }
      let seq1Ran = false;
      let seq2Ran = false;
      let parallelRunCount =
        node.nodeInfo?.formValues?.['output-thumbs']?.length ?? 0;

      runNodeFromThumb(
        node.thumbConnectors[0],
        canvasAppInstance,
        (inputFromFirstRun: string | any[]) => {
          console.log('Parallel inputFromFirstRun', inputFromFirstRun);
          if (!node.thumbConnectors || node.thumbConnectors.length < 2) {
            reject();
            return;
          }
          seq1Ran = true;
          if (seq2Ran && parallelRunCount === 0) {
            resolve({
              result: inputFromFirstRun,
              output: inputFromFirstRun,
              stop: true,
              dummyEndpoint: true,
            });
          }
        },
        input,
        node,
        loopIndex,
        scopeId,
        runCounter,
        true
      );

      runNodeFromThumb(
        node.thumbConnectors[1],
        canvasAppInstance,
        (inputFromSecondRun: string | any[]) => {
          seq2Ran = true;
          console.log('Parallel inputFromSecondRun', inputFromSecondRun);

          if (seq1Ran && parallelRunCount === 0) {
            resolve({
              result: inputFromSecondRun,
              output: inputFromSecondRun,
              stop: true,
              dummyEndpoint: true,
            });
          }
        },
        input,
        node,
        loopIndex,
        scopeId,
        runCounter,
        true
      );

      let loop = 0;
      const maxLoop = parallelRunCount;
      while (loop < maxLoop) {
        const thumb = node.thumbConnectors.find(
          (thumb) => thumb.thumbName === `output${3 + loop}`
        );
        if (thumb) {
          runNodeFromThumb(
            thumb,
            canvasAppInstance,
            (inputFromRun: string | any[]) => {
              parallelRunCount--;
              console.log('Parallel inputFromRun', inputFromRun);

              if (seq1Ran && seq2Ran && parallelRunCount === 0) {
                resolve({
                  result: inputFromRun,
                  output: inputFromRun,
                  stop: true,
                  dummyEndpoint: true,
                });
              }
            },
            input,
            node,
            loopIndex,
            scopeId,
            runCounter,
            true
          );
        }
        loop++;
      }
    });
  };

  return {
    name: 'parallel',
    family: 'flow-canvas',
    category: 'flow-control',
    isContainer: false,
    thumbs,
    createVisualNode: (
      canvasApp: FlowCanvas<NodeInfo>,
      x: number,
      y: number,
      id?: string,
      initalValues?: InitialValues,
      containerNode?: IRectNodeComponent<NodeInfo>
    ) => {
      canvasAppInstance = canvasApp;
      const jsxComponentWrapper = createNodeElement(
        'div',
        {
          class: `inner-node bg-white text-black p-4 pl-8 rounded flex flex-row justify-center items-center`,
          style: {
            'clip-path': 'polygon(0 50%, 100% 0, 100% 100%)',
          },
        },
        undefined,
        'parallel'
      ) as unknown as INodeComponent<NodeInfo>;
      const nodeThumbs = [...thumbs];
      const additionalThumbsLength =
        initalValues?.['output-thumbs']?.length ?? 0;

      for (let i = 0; i < additionalThumbsLength; i++) {
        nodeThumbs.push({
          thumbType: ThumbType.StartConnectorRight,
          thumbIndex: i + 2,
          connectionType: ThumbConnectionType.start,
          color: 'white',
          label: ' ',
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
          type: 'parallel',
          formValues: {
            'output-thumbs': initalValues?.['output-thumbs'] ?? [],
          },
        },
        containerNode
      );
      if (!rect.nodeComponent) {
        throw new Error('rect.nodeComponent is undefined');
      }
      rect.resize();

      node = rect.nodeComponent;
      if (node.nodeInfo) {
        node.nodeInfo.formElements = [
          {
            fieldType: FormFieldType.Array,
            fieldName: 'output-thumbs',
            label: 'Output thumbs',
            value: initalValues?.['output-thumbs'] ?? [],
            hideDeleteButton: true,
            //values: initalValues?.['output-thumbs'] ?? [],
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
              if (rect) {
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
