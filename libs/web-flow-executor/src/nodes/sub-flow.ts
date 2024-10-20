import {
  IFlowCanvasBase,
  createElement,
  FormFieldType,
  InitialValues,
  INodeComponent,
  IRectNodeComponent,
  NodeTask,
  ThumbConnectionType,
  ThumbType,
} from '@devhelpr/visual-programming-system';
import { NodeInfo } from '../types/node-info';
import { RuntimeFlowEngine } from '../flow-engine/runtime-flow-engine';

interface FileInfo {
  fileName: string;
  flow: any;
}

const selectFile = () => {
  return new Promise<FileInfo>((resolve, reject) => {
    const input = document.createElement('input') as HTMLInputElement & {
      files: FileList;
    };

    input.type = 'file';
    input.setAttribute('accept', 'application/json');
    input.onchange = () => {
      const files = Array.from(input.files);
      if (files && files.length > 0) {
        const reader = new FileReader();
        reader.addEventListener('load', (event) => {
          if (event && event.target && event.target.result) {
            try {
              const json = JSON.parse(event.target.result as string);

              resolve({ flow: json, fileName: files[0].name });
            } catch (e) {
              alert('Invalid JSON file');
              reject();
            }
          }
          input.remove();
        });
        reader.readAsText(files[0]);
      } else {
        reject();
      }
    };
    input.addEventListener('cancel', () => {
      reject();
    });
    input.click();
  });
};

export const subFlowNodeName = 'sub-flow';
export const subFlowNode = (updated: () => void): NodeTask<NodeInfo> => {
  let node: IRectNodeComponent<NodeInfo>;
  let htmlNode: INodeComponent<NodeInfo> | undefined = undefined;
  let hasInitialValue = true;
  let rect: ReturnType<IFlowCanvasBase<NodeInfo>['createRect']> | undefined =
    undefined;

  const initializeCompute = () => {
    hasInitialValue = true;

    return;
  };
  const computeAsync = (input: string) => {
    if (htmlNode) {
      if (hasInitialValue) {
        hasInitialValue = false;
      }
    }
    const flowEngine = new RuntimeFlowEngine();
    flowEngine.initialize(
      structuredClone(
        node.nodeInfo?.formValues?.['flow']?.flows?.flow?.nodes
      ) ?? []
    );

    return new Promise((resolve) => {
      // resolve({
      //   result: 'output',
      //   output: 'output',
      //   followPath: undefined,
      // });
      flowEngine
        .run(input)
        .then((output) => {
          resolve({
            result: output,
            output: output,
            followPath: undefined,
          });
        })
        .catch((_e) => {
          resolve({
            result: false,
            output: false,
            followPath: undefined,
          });
        })
        .finally(() => {
          flowEngine.destroy();
        });
    });
  };
  return {
    name: subFlowNodeName,
    family: 'flow-canvas',
    category: 'data',
    createVisualNode: (
      canvasApp: IFlowCanvasBase<NodeInfo>,
      x: number,
      y: number,
      id?: string,
      initalValues?: InitialValues,
      _containerNode?: IRectNodeComponent<NodeInfo>,
      width?: number,
      height?: number
    ) => {
      const formElements = [
        {
          fieldType: FormFieldType.Button,
          fieldName: 'fileName',
          caption: 'Load flow file',
          onButtonClick: () => {
            return new Promise<void>((resolve, _reject) => {
              selectFile()
                .then((fileInfo) => {
                  if (node) {
                    if (node.nodeInfo) {
                      node.nodeInfo.formValues.flow = fileInfo.flow;
                      node.nodeInfo.formValues.fileName = fileInfo.fileName;
                    }
                  }
                  if (htmlNode && fileInfo && node) {
                    (
                      htmlNode.domElement as HTMLImageElement
                    ).textContent = `${fileInfo.fileName}`;
                  }
                  updated();
                  resolve();
                })
                .catch(() => {
                  resolve();
                });
            });
          },
        },
      ];
      htmlNode = createElement(
        'div',
        {
          class: '',
        },
        undefined,
        '-'
      ) as unknown as INodeComponent<NodeInfo>;

      const wrapper = createElement(
        'div',
        {
          class: `inner-node bg-slate-500 rounded max-w-full flex items-center justify-center `,
        },
        undefined,
        htmlNode?.domElement as unknown as HTMLElement
      ) as unknown as INodeComponent<NodeInfo>;
      rect = canvasApp.createRect(
        x,
        y,
        width ?? 200,
        height ?? 100,
        undefined,
        [
          {
            thumbType: ThumbType.EndConnectorLeft,
            thumbIndex: 0,
            connectionType: ThumbConnectionType.end,
            label: ' ',
            name: 'input',
            color: 'white',
          },
          {
            thumbType: ThumbType.StartConnectorRight,
            thumbIndex: 0,
            connectionType: ThumbConnectionType.start,
            label: ' ',
            name: 'output',
            color: 'white',
          },
        ],
        wrapper,
        {
          classNames: `bg-slate-500 p-4 rounded`,
        },
        false,
        false,
        false,
        id,
        {
          type: subFlowNodeName,
          formElements: [],
          formValues: {
            fileName: initalValues?.['fileName'] ?? '',
            flow: initalValues?.['flow'] ?? undefined,
          },
        }
      );

      // if (initalValues && initalValues["fileName"] && htmlNode?.domElement) {
      //   hasInitialValue = false;
      //   (
      //     htmlNode.domElement as HTMLImageElement
      //   ).src = `data:image/png;base64,${initalValues["fileName"]}`;
      // }

      if (!rect.nodeComponent) {
        throw new Error('rect.nodeComponent is undefined');
      }

      node = rect.nodeComponent;
      if (node.nodeInfo) {
        node.nodeInfo.formElements = formElements;
        node.nodeInfo.showFormOnlyInPopup = true;
        node.nodeInfo.computeAsync = computeAsync;
        node.nodeInfo.initializeCompute = initializeCompute;
        node.nodeInfo.formValues = {
          fileName: initalValues?.['fileName'] ?? '',
          flow: initalValues?.['flow'] ?? undefined,
        };

        if (htmlNode) {
          if (node.nodeInfo.formValues?.fileName && node) {
            (
              htmlNode.domElement as HTMLImageElement
            ).textContent = `${node.nodeInfo.formValues?.fileName}`;
          } else {
            if (htmlNode && htmlNode.domElement) {
              htmlNode.domElement.textContent = 'Click to load flow file';
            }
          }
        }
      }
      return node;
    },
  };
};
