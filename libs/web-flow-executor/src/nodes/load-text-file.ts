import {
  IFlowCanvasBase,
  createElement,
  FormFieldType,
  InitialValues,
  INodeComponent,
  IRectNodeComponent,
  NodeTask,
  ThumbConnectionType,
  thumbConstraints,
  ThumbType,
} from '@devhelpr/visual-programming-system';
import { NodeInfo } from '../types/node-info';

interface FileInfo {
  fileName: string;
  lines: string[];
}

const selectFile = () => {
  return new Promise<FileInfo>((resolve, reject) => {
    const input = document.createElement('input') as HTMLInputElement & {
      files: FileList;
    };

    input.type = 'file';
    input.setAttribute('accept', 'text/plain');
    input.onchange = () => {
      const files = Array.from(input.files);
      if (files && files.length > 0) {
        const reader = new FileReader();
        reader.addEventListener('load', (event) => {
          if (event && event.target && event.target.result) {
            const lines = (event.target.result as string).split(/\r\n|\n/);
            resolve({ lines, fileName: files[0].name });
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

export const loadTextFileNodeName = 'load-text-file';
const fieldName = 'fileName';
export const loadTextFile = (_updated: () => void): NodeTask<NodeInfo> => {
  let node: IRectNodeComponent<NodeInfo>;
  let htmlNode: INodeComponent<NodeInfo> | undefined = undefined;
  let hasInitialValue = true;
  let rect: ReturnType<IFlowCanvasBase<NodeInfo>['createRect']> | undefined =
    undefined;
  let lines: string[] = [];
  const initializeCompute = () => {
    hasInitialValue = true;
    if (htmlNode && htmlNode.domElement) {
      htmlNode.domElement.textContent = 'Click to load text file';
    }
    return;
  };
  const compute = () => {
    if (htmlNode) {
      if (hasInitialValue) {
        hasInitialValue = false;
      }
    }
    return {
      result: lines,
      followPath: undefined,
    };
  };
  return {
    name: loadTextFileNodeName,
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
          fieldName: fieldName,
          caption: 'Load text file',
          onButtonClick: () => {
            return new Promise<void>((resolve, _reject) => {
              selectFile()
                .then((fileInfo) => {
                  if (htmlNode && fileInfo && node) {
                    lines = fileInfo.lines;
                    (htmlNode.domElement as HTMLImageElement).textContent = `${
                      fileInfo.fileName
                    }: ${lines.length.toString()}`;
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
            thumbConstraint: thumbConstraints.array,
            name: 'input',
            color: 'white',
          },
          {
            thumbType: ThumbType.StartConnectorRight,
            thumbIndex: 0,
            connectionType: ThumbConnectionType.start,
            label: ' ',
            thumbConstraint: thumbConstraints.array,
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
          type: loadTextFileNodeName,
          formElements: [],
        }
      );

      if (initalValues && initalValues[fieldName] && htmlNode?.domElement) {
        hasInitialValue = false;
        (
          htmlNode.domElement as HTMLImageElement
        ).src = `data:image/png;base64,${initalValues[fieldName]}`;
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
          image: initalValues?.[fieldName] ?? '',
        };
      }
      return node;
    },
  };
};
