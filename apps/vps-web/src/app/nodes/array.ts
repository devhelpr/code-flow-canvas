import {
  createElement,
  INodeComponent,
  ThumbConnectionType,
  ThumbType,
} from '@devhelpr/visual-programming-system';
import { canvasAppReturnType, NodeInfo } from '../types/node-info';

export const getArray = () => {
  let inputValues: any[] = [];
  let node: INodeComponent<NodeInfo>;
  let htmlNode: INodeComponent<NodeInfo> | undefined = undefined;
  let hasInitialValue = true;
  let rect: ReturnType<canvasAppReturnType['createRect']> | undefined =
    undefined;

  const initializeCompute = () => {
    hasInitialValue = true;
    inputValues = [];
    if (htmlNode) {
      htmlNode.domElement.textContent = 'Array';
      if (rect) {
        rect.resize(240);
      }
    }
    return;
  };

  const setValue = (values: any[]) => {
    if (htmlNode && htmlNode.domElement) {
      (htmlNode.domElement as HTMLElement).textContent = '';

      while (htmlNode.domElement.firstChild) {
        if (htmlNode.domElement) {
          htmlNode.domElement.removeChild(
            (htmlNode.domElement as HTMLElement).lastChild as Node
          );
        }
      }
    }
    values.forEach((value) => {
      const inputElement = createElement(
        'div',
        {
          class:
            'inline-block p-1 m-1 bg-slate-500 border border-slate-600 rounded text-white',
        },
        undefined,
        value.toString()
      ) as unknown as INodeComponent<NodeInfo>;

      // if (htmlNode.domElement.firstChild) {
      //   htmlNode.domElement.insertBefore(
      //     inputElement.domElement as unknown as HTMLElement,
      //     htmlNode.domElement.firstChild
      //   );
      // } else {
      if (htmlNode) {
        htmlNode.domElement.appendChild(
          inputElement.domElement as unknown as HTMLElement
        );
      }
    });
    //}

    if (rect) {
      rect.resize(240);
    }
  };

  const compute = (input: string) => {
    const previousOutput = [...inputValues];
    inputValues.push(input);
    if (htmlNode) {
      if (hasInitialValue) {
        htmlNode.domElement.textContent = '';
        hasInitialValue = false;
      }
      setValue(inputValues);

      // htmlNode.domElement.appendChild(
      //   inputElement.domElement as unknown as HTMLElement
      // );

      // if (rect) {
      //   rect.resize(240);
      // }
    }
    return {
      result: [...inputValues],
      followPath: undefined,
      previousOutput,
    };
  };
  return {
    createVisualNode: (
      canvasApp: canvasAppReturnType,
      x: number,
      y: number,
      id?: string
    ) => {
      htmlNode = createElement(
        'div',
        {
          class: '',
        },
        undefined,
        'Array'
      ) as unknown as INodeComponent<NodeInfo>;

      const wrapper = createElement(
        'div',
        {
          class: `bg-slate-500 p-4 rounded max-w-[240px]`,
        },
        undefined,
        htmlNode.domElement as unknown as HTMLElement
      ) as unknown as INodeComponent<NodeInfo>;

      rect = canvasApp.createRect(
        x,
        y,
        200,
        100,
        undefined,
        undefined,
        [
          {
            thumbType: ThumbType.StartConnectorRight,
            thumbIndex: 0,
            connectionType: ThumbConnectionType.start,
            offsetY: 20,
            label: '[]',
            thumbConstraint: 'array',
            name: 'output',
          },
          {
            thumbType: ThumbType.EndConnectorLeft,
            thumbIndex: 0,
            connectionType: ThumbConnectionType.end,
            offsetY: 20,
            color: 'white',
            label: '#',
            thumbConstraint: 'value',
            name: 'input',
          },
        ],
        wrapper,
        {
          classNames: `bg-slate-500 p-4 rounded`,
        },
        undefined,
        false,
        true,
        id,
        {
          type: 'array',
          formElements: [],
        }
      );

      node = rect.nodeComponent;
      node.nodeInfo.compute = compute;
      node.nodeInfo.initializeCompute = initializeCompute;
      node.nodeInfo.setValue = setValue;
    },
  };
};
