import {
  FormField,
  IComputeResult,
  IRectNodeComponent,
  InitialValues,
  NodeTask,
  ThumbConnectionType,
  ThumbType,
  visualNodeFactory,
} from '@devhelpr/visual-programming-system';
import { NodeInfo } from '@devhelpr/web-flow-executor';
import { PyodideInterface } from 'pyodide';

// type PyodideAPI = ReturnType<typeof loadPyodide>;

const fieldName = 'test-external-input';
const nodeTitle = 'Test external input';
const nodeName = 'test-external-node';
const familyName = 'flow-canvas';
const thumbConstraint = 'value';
const thumbs = [
  {
    thumbType: ThumbType.StartConnectorCenter,
    thumbIndex: 0,
    connectionType: ThumbConnectionType.start,
    color: 'white',
    label: ' ',
    name: 'output',
    thumbConstraint: thumbConstraint,
    maxConnections: -1,
  },
  {
    thumbType: ThumbType.EndConnectorCenter,
    thumbIndex: 0,
    connectionType: ThumbConnectionType.end,
    color: 'white',
    label: ' ',
    name: 'input',
    thumbConstraint: thumbConstraint,
    maxConnections: 1,
  },
];

export const getExternalTestNode =
  (pyodide: PyodideInterface) =>
  // (): NodeTaskFactory<NodeInfo> =>
  (_updated: () => void): NodeTask<NodeInfo> => {
    let node: IRectNodeComponent<NodeInfo>;
    ///let rect: Rect<NodeInfo> | undefined;
    const initializeCompute = () => {
      return;
    };
    const computeAsync = (
      _input: string,
      _loopIndex?: number,
      _payload?: any
    ) => {
      //const result = input;
      return new Promise<IComputeResult>((resolve) => {
        const my_namespace = pyodide.toPy({ x: 2, y: [1, 2, 3] });
        pyodide
          .runPythonAsync(
            `
              import numpy as np
              z = np.sum(np.array(y))+x`,
            { globals: my_namespace }
          )
          .then((_result) => {
            const test = my_namespace.get('z').toString();
            console.log('python result', test);
            resolve({
              result: test,
              output: test,
              followPath: undefined,
            });
          });
      });
    };

    return visualNodeFactory(
      nodeName,
      nodeTitle,
      familyName,
      fieldName,
      computeAsync,
      initializeCompute,
      false,
      200,
      100,
      thumbs,
      (values?: InitialValues): FormField[] => {
        return [];
      },
      (nodeInstance) => {
        //rect = nodeInstance.rect;
        node = nodeInstance.node as IRectNodeComponent<NodeInfo>;
        //rect?.resize();
      },
      {
        category: 'Test',
      },
      undefined,
      true
    );
  };
