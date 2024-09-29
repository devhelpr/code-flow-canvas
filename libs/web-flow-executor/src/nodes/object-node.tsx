import {
  IFlowCanvasBase,
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
import { RunCounter } from '../follow-path/run-counter';

export const objectNodeName = 'object-node';
const thumbs = [
  {
    thumbType: ThumbType.StartConnectorCenter,
    thumbIndex: 0,
    connectionType: ThumbConnectionType.start,
    color: 'white',
    label: ' ',
    maxConnections: -1,
  },
];

export const getObjectNode: NodeTaskFactory<NodeInfo> = (
  updated: () => void
): NodeTask<any> => {
  //let contextInstance: CanvasAppInstance<NodeInfo> | undefined = undefined;
  let node: IRectNodeComponent<NodeInfo>;
  let canvasAppInstance: IFlowCanvasBase<NodeInfo> | undefined = undefined;
  const initializeCompute = () => {
    values = { global: {} };
    return;
  };

  let values = {
    global: {},
  } as Record<
    string,
    Record<
      string,
      | {
          value: any;
          name: string;
        }
      | undefined
    >
  >;

  const compute = (
    input: string,
    _loopIndex?: number,
    _payload?: any,
    thumbName?: string,
    scopeId?: string,
    runCounter?: RunCounter
  ) => {
    const extraInputCount =
      node.nodeInfo?.formValues?.['input-thumbs']?.length ?? 0;
    if (scopeId && !values[scopeId]) {
      values[scopeId] = {};
    }
    if (runCounter?.runId && !values[runCounter?.runId]) {
      values[runCounter?.runId] = {};
    }
    const localValues = values[runCounter?.runId ?? scopeId ?? 'global'];
    if (node && node.thumbConnectors && thumbName?.startsWith('input')) {
      const thumb = node.thumbConnectors.find(
        (thumb) => thumb.thumbName === thumbName
      );
      if (thumb) {
        const thumbIndex = thumb.thumbIndex;
        if (thumbIndex !== undefined) {
          const inputIndex = thumbIndex;
          if (inputIndex < extraInputCount) {
            localValues[`input${inputIndex}`] = {
              name: thumb?.prefixLabel?.trim() ?? thumbName,
              value: input,
            };
          }
        }
      }
    }
    let loop = 0;

    while (loop < extraInputCount) {
      if (localValues[`input${loop}`] === undefined) {
        (node?.thumbConnectors?.[loop + 1].domElement as HTMLElement)
          ?.querySelector('.inner-thumb')
          ?.classList?.add('blink-thumb');
      }
      loop++;
    }

    loop = 0;
    while (loop < extraInputCount) {
      if (localValues[`input${loop}`] === undefined) {
        return {
          result: undefined,
          output: undefined,
          stop: true,
          followPath: undefined,
        };
      }
      loop++;
    }
    const outputObject: any = {};
    const resetOnTrigger = node.nodeInfo?.formValues?.['clearMode'] === true;
    console.log('resetOnTrigger', resetOnTrigger);
    loop = 0;
    while (loop < extraInputCount) {
      const currentObject = localValues[`input${loop}`];
      if (currentObject) {
        outputObject[currentObject.name] = currentObject.value;
      }
      if (resetOnTrigger) {
        localValues[`input${loop}`] = undefined;
      }

      (node?.thumbConnectors?.[loop + 1].domElement as HTMLElement)
        ?.querySelector('.inner-thumb')
        ?.classList?.remove('blink-thumb');
      loop++;
    }
    if (resetOnTrigger) {
      values[runCounter?.runId ?? scopeId ?? 'global'] = {};
    }
    return {
      result: outputObject,
      output: outputObject,
      followPath: undefined,
    };
  };

  return {
    name: objectNodeName,
    family: 'flow-canvas',
    category: 'flow-control',
    isContainer: false,
    thumbs,
    createVisualNode: (
      canvasApp: IFlowCanvasBase<NodeInfo>,
      x: number,
      y: number,
      id?: string,
      initalValues?: InitialValues,
      containerNode?: IRectNodeComponent<NodeInfo>
    ) => {
      canvasAppInstance = canvasApp;
      //contextInstance = canvasApp;

      const Component = () => (
        <div
          title="Edit 'Node properties' (via sidebar) to edit/add object properties"
          class="inner-node bg-white text-black p-4 rounded flex flex-col justify-center items-center min-w-[150px]"
        >
          <div></div>
        </div>
      );
      const nodeThumbs: IThumb[] = [...thumbs];
      const additionalThumbsLength =
        initalValues?.['input-thumbs']?.length ?? 0;

      for (let i = 0; i < additionalThumbsLength; i++) {
        nodeThumbs.push({
          thumbType: ThumbType.EndConnectorLeft,
          thumbIndex: i,
          connectionType: ThumbConnectionType.end,
          color: 'white',
          prefixLabel: initalValues?.['input-thumbs'][i]?.thumbName,
          label: ' ',
          name: `input${i + 1}`,
          maxConnections: -1,
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
          type: objectNodeName,
          formValues: {
            'input-thumbs': initalValues?.['input-thumbs'] ?? [],
            clearMode: initalValues?.['clearMode'] ?? 'false',
          },
        },
        containerNode,
        undefined,
        'object-node rect-node'
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
              {
                fieldName: 'dataType',
                fieldType: FormFieldType.Select,
                value: 'string',
                options: [
                  { label: 'String', value: 'string' },
                  { label: 'Number', value: 'number' },
                ],
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
                        thumbIndex: i + oldThumbsLength,
                        connectionType: ThumbConnectionType.end,
                        color: 'white',
                        label: ' ',
                        name: `input${i + oldThumbsLength + 1}`,
                        prefixLabel: (values as any)[i + oldThumbsLength]?.[
                          'thumbName'
                        ],
                        maxConnections: -1,
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
          {
            fieldType: FormFieldType.Checkbox,
            fieldName: 'clearMode',
            label: 'Clear properties after all inputs received data',
            value: initalValues?.['clearMode'] ?? 'false',
            onChange: (value: string) => {
              if (!node.nodeInfo) {
                return;
              }

              node.nodeInfo.formValues?.['input-thumbs']?.length ?? 0;
              node.nodeInfo.formValues = {
                ...node.nodeInfo.formValues,
                ['clearMode']: value,
              };
              node?.update?.();
              if (updated) {
                updated();
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
};
