import {
  CanvasAppInstance,
  FormFieldType,
  IRectNodeComponent,
  IThumb,
  InitialValues,
  NodeTask,
  NodeTaskFactory,
  ThumbConnectionType,
  ThumbType,
  createJSXElement,
} from '@devhelpr/visual-programming-system';
import { NodeInfo } from '../types/node-info';

export const sumMergeModeName = 'merge-sum';
const thumbs = [
  {
    thumbType: ThumbType.StartConnectorCenter,
    thumbIndex: 0,
    connectionType: ThumbConnectionType.start,
    color: 'white',
    label: ' ',
    maxConnections: 1,
  },
  {
    thumbType: ThumbType.EndConnectorLeft,
    thumbIndex: 0,
    connectionType: ThumbConnectionType.end,
    color: 'white',
    label: ' ',
    name: 'a',
    maxConnections: 1,
    prefixLabel: '',
  },
  {
    thumbType: ThumbType.EndConnectorLeft,
    thumbIndex: 1,
    connectionType: ThumbConnectionType.end,
    color: 'white',
    label: ' ',
    name: 'b',
    maxConnections: 1,
    prefixLabel: '',
  },
];

export const getMergeSumNode: NodeTaskFactory<NodeInfo> = (
  updated: () => void
): NodeTask<any> => {
  //let contextInstance: CanvasAppInstance<NodeInfo> | undefined = undefined;
  let node: IRectNodeComponent<NodeInfo>;
  let canvasAppInstance: CanvasAppInstance<NodeInfo> | undefined = undefined;
  const initializeCompute = () => {
    values = { global: { value1: undefined, value2: undefined } };
    return;
  };

  let values = {
    global: {
      value1: undefined,
      value2: undefined,
    },
  } as Record<string, Record<string, string | undefined>>;

  const compute = (
    input: string,
    _loopIndex?: number,
    _payload?: any,
    thumbName?: string,
    scopeId?: string
  ) => {
    const extraInputCount =
      node.nodeInfo?.formValues?.['input-thumbs']?.length ?? 0;
    if (scopeId && !values[scopeId]) {
      values[scopeId] = {
        value1: undefined,
        value2: undefined,
      };
    }
    const localValues = values[scopeId ?? 'global'];
    if (thumbName === 'a') {
      localValues['value1'] = input;
    } else {
      if (thumbName === 'b') {
        localValues['value2'] = input;
      } else if (
        node &&
        node.thumbConnectors &&
        thumbName?.startsWith('input')
      ) {
        const thumb = node.thumbConnectors.find(
          (thumb) => thumb.thumbName === thumbName
        );
        if (thumb) {
          const thumbIndex = thumb.thumbIndex;
          if (thumbIndex !== undefined) {
            const inputIndex = thumbIndex;
            if (inputIndex < extraInputCount + 2) {
              localValues[`input${inputIndex}`] = input;
            }
          }
        }
      }
    }
    let loop = 0;
    while (loop < extraInputCount) {
      if (localValues[`input${loop + 2}`] === undefined) {
        return {
          result: undefined,
          output: undefined,
          stop: true,
          followPath: undefined,
        };
      }
      loop++;
    }
    if (
      localValues['value1'] === undefined ||
      localValues['value2'] === undefined
    ) {
      return {
        result: undefined,
        output: undefined,
        stop: true,
        followPath: undefined,
      };
    }
    const value1 = localValues['value1'];
    const value2 = localValues['value2'];
    localValues['value1'] = undefined;
    localValues['value2'] = undefined;
    let sum = 0;
    loop = 0;
    while (loop < extraInputCount) {
      sum += Number(localValues[`input${loop + 2}`]);
      localValues[`input${loop + 2}`] = undefined;
      loop++;
    }

    // if (contextInstance && scopeId) {
    //   contextInstance.registerTempVariable('a', value1, scopeId);
    //   contextInstance.registerTempVariable('b', value2, scopeId);
    // }
    // console.log('merge', scopeId, value1, value2, {
    //   ...contextInstance?.getVariables(scopeId),
    // });
    return {
      result: value1 + value2 + sum,
      output: value1 + value2 + sum,
      followPath: undefined,
    };
  };

  return {
    name: sumMergeModeName,
    family: 'flow-canvas',
    category: 'flow-control',
    isContainer: false,
    thumbs,
    createVisualNode: (
      canvasApp: CanvasAppInstance<NodeInfo>,
      x: number,
      y: number,
      id?: string,
      initalValues?: InitialValues,
      containerNode?: IRectNodeComponent<NodeInfo>
    ) => {
      canvasAppInstance = canvasApp;
      //contextInstance = canvasApp;

      const Component = () => (
        <div class="inner-node bg-white text-black p-4 rounded flex flex-col justify-center items-center min-w-[150px] clip-merge">
          <div class="text-7xl">&#8721;</div>
          <div>Sum</div>
        </div>
      );
      const nodeThumbs: IThumb[] = [...thumbs];
      const additionalThumbsLength =
        initalValues?.['input-thumbs']?.length ?? 0;

      for (let i = 0; i < additionalThumbsLength; i++) {
        nodeThumbs.push({
          thumbType: ThumbType.EndConnectorLeft,
          thumbIndex: i + 2,
          connectionType: ThumbConnectionType.end,
          color: 'white',
          label: ' ',
          name: `input${i + 3}`,
        });
      }

      const rect = canvasApp.createRect(
        x,
        y,
        150,
        110,
        undefined,
        nodeThumbs,
        Component() as unknown as HTMLElement,
        {
          classNames: `bg-slate-500 p-4 rounded`,
        },
        false,
        undefined,
        undefined,
        id,
        {
          type: sumMergeModeName,
          formValues: {
            'input-thumbs': initalValues?.['input-thumbs'] ?? [],
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
            fieldName: 'input-thumbs',
            label: 'Input thumbs',
            hideDeleteButton: true,
            value: initalValues?.['input-thumbs'] ?? [],
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
                node.nodeInfo.formValues?.['input-thumbs']?.length ?? 0;
              node.nodeInfo.formValues = {
                ...node.nodeInfo.formValues,
                ['input-thumbs']: [...values],
              };
              const newThumbLength = values.length - oldThumbsLength;
              if (newThumbLength > 0) {
                for (let i = 0; i < newThumbLength; i++) {
                  if (node) {
                    canvasAppInstance?.addThumbToNode(
                      {
                        thumbType: ThumbType.EndConnectorLeft,
                        thumbIndex: i + oldThumbsLength + 2,
                        connectionType: ThumbConnectionType.end,
                        color: 'white',
                        label: ' ',
                        name: `input${i + oldThumbsLength + 3}`,
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
        node.nodeInfo.compute = compute;
        node.nodeInfo.initializeCompute = initializeCompute;
      }
      return node;
    },
  };

  // return visualNodeFactory(
  //   sumMergeModeName,
  //   labelName,
  //   familyName,
  //   fieldName,
  //   compute,
  //   initializeCompute,
  //   false,
  //   100,
  //   320,
  //   thumbs,
  //   (_values?: InitialValues) => {
  //     return [];
  //   },
  //   (nodeInstance) => {
  //     contextInstance = nodeInstance.contextInstance;
  //   },
  //   {
  //     hasTitlebar: false,
  //     category: 'flow-control',
  //   }
  // );
};
