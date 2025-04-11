import {
  FormField,
  IComputeResult,
  IConnectionNodeComponent,
  InitialValues,
  IFlowCanvasBase,
  IRectNodeComponent,
  NodeTask,
  ThumbConnectionType,
  ThumbType,
  visualNodeFactory,
} from '@devhelpr/visual-programming-system';
import { NodeInfo } from '@devhelpr/web-flow-executor';

const fieldName = 'prompt-input';
const nodeTitle = 'Prompt viewer';
export const promptNodeName = 'prompt-rect-node';
const familyName = 'flow-canvas';
const thumbs = [
  {
    thumbType: ThumbType.StartConnectorCenter,
    thumbIndex: 0,
    connectionType: ThumbConnectionType.start,
    color: 'white',
    label: ' ',
    name: 'output',
    maxConnections: -1,
  },
  {
    thumbType: ThumbType.EndConnectorCenter,
    thumbIndex: 0,
    connectionType: ThumbConnectionType.end,
    color: 'white',
    label: ' ',
    name: 'input',
    maxConnections: -1,
  },
];

export const getPromptNode =
  () =>
  (_updated: () => void): NodeTask<NodeInfo> => {
    let node: IRectNodeComponent<NodeInfo> | undefined = undefined;
    let canvasAppInstance: IFlowCanvasBase<NodeInfo> | undefined = undefined;

    const initializeCompute = () => {
      connectedNodeInputs = {};
      return;
    };
    let connectedNodeInputs: Record<string, string> = {};
    const computeAsync = (
      input: string,
      _loopIndex?: number,
      _payload?: any,
      _dummy1?: any,
      _dummy2?: any,
      _dummy3?: any,
      connection?: IConnectionNodeComponent<NodeInfo>
    ) => {
      if (connection?.startNode) {
        connectedNodeInputs[connection?.startNode.id] = input;
      }
      let allSet = true;
      let passThrough = true;
      if (node && node.connections) {
        node.connections.forEach((connectionNode) => {
          if (
            connectionNode?.endNode?.id &&
            connectionNode?.endNode?.id === node?.id
          ) {
            if (connectionNode?.startNode?.id) {
              if (!connectedNodeInputs[connectionNode.startNode.id]) {
                allSet = false;
              }
            } else {
              allSet = false;
            }
          } else {
            if (
              connectionNode?.startNode?.id &&
              connectionNode?.startNode?.id === node?.id &&
              connectionNode?.endNode?.nodeInfo?.taskType !== promptNodeName
            ) {
              passThrough = false;
            }
          }
        });
      }

      /*
        https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=[googleGeminiAI-key]

        {
          "contents": [{
            "parts":[{"text": "prompt"}]
            }]
        }

        output: candidates[0].content.parts[0].text
      */
      if (!allSet) {
        return Promise.resolve({
          output: '',
          result: '',
          followPath: undefined,
          stop: true,
        });
      }

      return new Promise<IComputeResult>((resolve) => {
        let prompt = ''; //(node?.nodeInfo as any).formValues.prompt ?? 'prompt';

        if (node && node.connections) {
          node.connections.forEach((connectionNode) => {
            if (
              connectionNode?.startNode?.id &&
              connectionNode?.endNode?.id &&
              connectionNode?.endNode?.id === node?.id
            ) {
              if (connectedNodeInputs[connectionNode.startNode.id]) {
                prompt = `${prompt} - ${
                  connectedNodeInputs[connectionNode.startNode.id]
                }`;
              }
            }
          });

          const promptTask = `${node?.nodeInfo?.formValues.prompt ?? ''}`;
          if (!passThrough) {
            const googleGeminiAIKey =
              canvasAppInstance?.getTempData('googleGeminiAI-key') ?? '';

            let url =
              'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=[googleGeminiAI-key]';

            url = url.replace('[googleGeminiAI-key]', googleGeminiAIKey);

            const isCondition = node?.nodeInfo?.formValues?.['isCondition'];
            if (isCondition) {
              prompt = `use the following condition: "${promptTask}${
                promptTask ? ': ' : ''
              }" to check if the followinbg is true: "${prompt}"`;

              fetch(url, {
                method: 'post',

                body: JSON.stringify({
                  contents: [
                    {
                      parts: [{ text: prompt }],
                    },
                  ],
                  generationConfig: {
                    response_mime_type: 'application/json',
                    response_schema: {
                      type: 'boolean',
                    },
                  },
                }),
                mode: 'cors',
              })
                .then((response) => response.json())
                .then((result) => {
                  const output =
                    result.candidates[0].content.parts[0].text ?? '-';
                  console.log('prompt output', output);
                  resolve({
                    output: output,
                    result: output,
                    followPath: undefined,
                  });
                });
              return;
            }

            prompt = `${promptTask}${promptTask ? ': ' : ''}${prompt}`;
            console.log('prompt node', prompt);

            fetch(url, {
              method: 'post',

              body: JSON.stringify({
                contents: [
                  {
                    parts: [{ text: prompt }],
                  },
                ],
              }),
              mode: 'cors',
            })
              .then((response) => response.json())
              .then((result) => {
                const output =
                  result.candidates[0].content.parts[0].text ?? '-';
                console.log('prompt output', output);
                resolve({
                  output: output,
                  result: output,
                  followPath: undefined,
                });
              });

            return;
          }
          prompt = `${promptTask} - ${prompt}`;
        }

        console.log('prompt worker', prompt);
        try {
          resolve({
            output: prompt,
            result: prompt,
            followPath: undefined,
          });
        } catch (error) {
          console.error('Error prompting:', error);
          resolve({
            output: '',
            result: '',
            followPath: undefined,
            stop: true,
          });
        }
      });
    };

    return visualNodeFactory(
      promptNodeName,
      nodeTitle,
      familyName,
      fieldName,
      computeAsync as any,
      initializeCompute,
      false,
      100,
      100,
      thumbs,
      (_values?: InitialValues): FormField[] => {
        return [];
      },
      (nodeInstance) => {
        canvasAppInstance = nodeInstance.contextInstance;
        if (!nodeInstance.node.nodeInfo) {
          nodeInstance.node.nodeInfo = {};
        }
        node = nodeInstance.node as IRectNodeComponent<NodeInfo>;
        nodeInstance.node.nodeInfo.shouldNotSendOutputFromWorkerToMainThread =
          true;
      },
      {
        category: 'default',
      },
      undefined,
      true
    );
  };
