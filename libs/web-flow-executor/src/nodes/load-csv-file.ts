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
  setSelectNode,
} from '@devhelpr/visual-programming-system';
import { NodeInfo } from '../types/node-info';
import { RunCounter } from '../follow-path/run-counter';
import { runNode } from '../flow-engine/flow-engine';

interface FileInfo {
  fileName: string;
  lines: string[];
}

const trySplitWithChar = (line1: string, line2: string, splitChar: string) => {
  const split1 = line1.split(splitChar);
  const split2 = line2.split(splitChar);
  return split1.length === split2.length;
};
const determineSplitChar = (lines: string[]) => {
  const firstLine = lines[0];
  const secondLine = lines[1];
  if (firstLine.includes(';') && secondLine.includes(';')) {
    if (trySplitWithChar(firstLine, secondLine, ';')) {
      return ';';
    }
  } else if (firstLine.includes(',') && secondLine.includes(',')) {
    if (trySplitWithChar(firstLine, secondLine, ',')) {
      return ',';
    }
  } else if (firstLine.includes('\t') && secondLine.includes('\t')) {
    if (trySplitWithChar(firstLine, secondLine, '\t')) {
      return '\t';
    }
  }
  return ',';
};

const selectFile = () => {
  return new Promise<FileInfo>((resolve, reject) => {
    const input = document.createElement('input') as HTMLInputElement & {
      files: FileList;
    };

    input.type = 'file';
    input.setAttribute('accept', '.csv');
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

export const loadCSVFileNodeName = 'load-csv-file';
const fieldName = 'fileName';
export const loadCSVFile = (_updated: () => void): NodeTask<NodeInfo> => {
  let node: IRectNodeComponent<NodeInfo>;
  let htmlNode: INodeComponent<NodeInfo> | undefined = undefined;
  let hasInitialValue = true;
  let rect: ReturnType<IFlowCanvasBase<NodeInfo>['createRect']> | undefined =
    undefined;
  let runCounter: RunCounter | undefined = undefined;
  let triggerButton = false;
  let lines: string[] = [];
  const initializeCompute = () => {
    hasInitialValue = true;
    if (htmlNode && htmlNode.domElement) {
      htmlNode.domElement.textContent = 'Click to load csv file';
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
    if (lines.length > 1) {
      // TODO : find way to detect if csv has header

      const splitChar = determineSplitChar(lines);
      //const header = lines[0].split(',');
      const data = lines.slice(1).map((line) => {
        const values = line.split(splitChar);
        const obj: any = [];
        values.forEach((value) => {
          const parsedFloat = parseFloat(value);
          if (!isNaN(parsedFloat)) {
            obj.push(parsedFloat);
          } else {
            obj.push(value);
          }
        });
        // header.forEach((key, index) => {
        //   //obj[key] = values[index];
        //   obj.push(values[index]);
        // });
        return obj;
      });
      return {
        result: data,
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
    name: loadCSVFileNodeName,
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
          caption: 'Load CSV file',
          onButtonClick: () => {
            return new Promise<void>((resolve, _reject) => {
              selectFile()
                .then((fileInfo) => {
                  if (htmlNode && fileInfo && node) {
                    lines = fileInfo.lines;
                    (htmlNode.domElement as HTMLElement).textContent = `${
                      fileInfo.fileName
                    }: ${lines.length.toString()}`;

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
          classNames: ``,
        },
        true,
        false,
        false,
        id,
        {
          type: loadCSVFileNodeName,
          formElements: [],
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
      }
      return node;
    },
  };
};
