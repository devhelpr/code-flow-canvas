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
  setSelectNode,
} from '@devhelpr/visual-programming-system';
import { NodeInfo } from '../types/node-info';
import { RunCounter } from '../follow-path/run-counter';
import { runNode } from '../flow-engine/flow-engine';

interface FileInfo {
  fileName: string;
  lines: object;
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
            resolve({
              lines: JSON.parse(event.target.result as string),
              fileName: files[0].name,
            });
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

export const loadJSONFileNodeName = 'load-json-file';
const fieldName = 'fileName';
export const loadJSONFile = (_updated: () => void): NodeTask<NodeInfo> => {
  let node: IRectNodeComponent<NodeInfo>;
  let htmlNode: INodeComponent<NodeInfo> | undefined = undefined;
  let hasInitialValue = true;
  let rect: ReturnType<IFlowCanvasBase<NodeInfo>['createRect']> | undefined =
    undefined;
  let runCounter: RunCounter | undefined = undefined;
  let triggerButton = false;
  let lines: object | undefined = undefined;

  const initializeCompute = () => {
    hasInitialValue = true;
    if (htmlNode && htmlNode.domElement) {
      htmlNode.domElement.textContent = 'Click to load JSON file';
    }
    return;
  };
  const compute = (
    _input: string,
    _loopIndex?: number,
    _payload?: any,
    _thumbName?: string,
    _scopeId?: string,
    runCounterCompute?: RunCounter
  ) => {
    if (!triggerButton) {
      runCounter = runCounterCompute;
    } else {
      triggerButton = false;
    }
    if (htmlNode) {
      if (hasInitialValue) {
        hasInitialValue = false;
      }
    }
    if (lines) {
      return {
        result: lines,
        followPath: undefined,
      };
    }
    return {
      result: false,
      output: false,
      stop: true,
      followPath: undefined,
    };
  };
  return {
    name: loadJSONFileNodeName,
    family: 'flow-canvas',
    category: 'data',
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
      const formElements = [
        {
          fieldType: FormFieldType.Button,
          fieldName: fieldName,
          caption: 'Load JSON file',
          onButtonClick: () => {
            return new Promise<void>((resolve, _reject) => {
              selectFile()
                .then((fileInfo) => {
                  if (htmlNode && fileInfo && node) {
                    lines = fileInfo.lines;
                    (
                      htmlNode.domElement as HTMLElement
                    ).textContent = `${fileInfo.fileName}`;

                    triggerButton = true;
                    setSelectNode(undefined);
                    runNode(
                      containerNode ?? node,
                      containerNode
                        ? (containerNode.nodeInfo as any)?.canvasAppInstance
                        : canvasApp,
                      () => {
                        //
                      },
                      undefined,
                      undefined,
                      undefined,
                      undefined,
                      undefined,
                      undefined,
                      runCounter,
                      false
                    );
                  }
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
          class: `inner-node bg-orange-500 text-white font-bold rounded max-w-full flex items-center justify-center `,
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
            thumbType: ThumbType.StartConnectorCenter,
            thumbIndex: 0,
            connectionType: ThumbConnectionType.start,
            label: ' ',
            name: 'output',
            color: 'white',
          },
        ],
        wrapper,
        {
          classNames: ``,
        },
        true,
        false,
        false,
        id,
        {
          type: loadJSONFileNodeName,
          formElements: [],
          formValues: {
            //
          },
        }
      );

      if (initalValues && initalValues[fieldName] && htmlNode?.domElement) {
        hasInitialValue = false;
      }

      if (!rect.nodeComponent) {
        throw new Error('rect.nodeComponent is undefined');
      }

      node = rect.nodeComponent;
      if (node.nodeInfo) {
        node.nodeInfo.formElements = formElements;
        node.nodeInfo.showFormOnlyInPopup = true;
        node.nodeInfo.compute = compute;
        node.nodeInfo.initializeCompute = initializeCompute;
        node.nodeInfo.formValues = {
          //
        };

        node.nodeInfo.meta = [
          {
            propertyName: 'json',
            displayName: 'JSON data',
            type: 'json',
            getData: () => {
              return lines ?? {};
            },
          },
        ];
      }
      return node;
    },
  };
};
