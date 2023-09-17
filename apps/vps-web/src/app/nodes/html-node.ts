import {
  createElement,
  IElementNode,
  INodeComponent,
  IRectNodeComponent,
  ThumbConnectionType,
  ThumbType,
} from '@devhelpr/visual-programming-system';
import { canvasAppReturnType, NodeInfo } from '../types/node-info';
import { InitialValues, NodeTask } from '../node-task-registry';
import { FormFieldType } from '../components/form-component';
import { replaceExpressionScript } from '../utils/replace-expression-script';

export const getHtmlNode = (updated: () => void): NodeTask<NodeInfo> => {
  let node: IRectNodeComponent<NodeInfo>;
  let divNode: IElementNode<NodeInfo>;
  let rect: ReturnType<canvasAppReturnType['createRect']> | undefined =
    undefined;
  let variables: Record<string, string> = {};

  const defaultHTML = ``;

  const setHTML = (value: string) => {
    const splitted = value.split(':');
    if (splitted.length === 2) {
      variables[splitted[0]] = splitted[1] || '';
    }
    let htmlString = node.nodeInfo.formValues['html'] || defaultHTML;
    htmlString = replaceExpressionScript(htmlString, variables, true);

    (divNode.domElement as HTMLElement).innerHTML = htmlString;
    if (rect) {
      rect.resize();
    }
  };

  const initializeCompute = () => {
    variables = {};
    return;
  };
  const compute = (input: string) => {
    setHTML(input);

    return {
      result: input,
    };
  };

  return {
    name: 'html-node',
    family: 'flow-canvas',
    isContainer: false,
    createVisualNode: <NodeInfo>(
      canvasApp: canvasAppReturnType,
      x: number,
      y: number,
      id?: string,
      initalValues?: InitialValues,
      containerNode?: IRectNodeComponent<NodeInfo>
    ) => {
      const initialValue = initalValues?.['html'] || defaultHTML;

      const formElements = [
        {
          fieldType: FormFieldType.TextArea,
          fieldName: 'html',
          value: initialValue,
          onChange: (value: string) => {
            console.log('html-node onchange', value);
            node.nodeInfo.formValues = {
              ...node.nodeInfo.formValues,
              html: value,
            };
            console.log('onChange', node.nodeInfo);
            if (updated) {
              setHTML('');
              updated();
            }
          },
        },
      ];

      const componentWrapper = createElement(
        'div',
        {
          class: `inner-node bg-sky-900 rounded min-h-[100px]`,
        },
        undefined
      ) as unknown as INodeComponent<NodeInfo>;

      divNode = createElement('div', {}, componentWrapper.domElement);
      rect = canvasApp.createRect(
        x,
        y,
        200,
        100,
        undefined,
        [
          {
            thumbType: ThumbType.StartConnectorCenter,
            thumbIndex: 0,
            connectionType: ThumbConnectionType.start,
            color: 'white',
            label: '',
          },
          {
            thumbType: ThumbType.EndConnectorCenter,
            thumbIndex: 0,
            connectionType: ThumbConnectionType.end,
            color: 'white',
            label: ' ',
          },
        ],
        componentWrapper,
        {
          classNames: `bg-sky-900 p-4 rounded`,
        },
        false,
        undefined,
        undefined,
        id,
        {
          type: 'html-node',
          formValues: {
            html: initialValue || defaultHTML,
          },
        },
        containerNode
      );
      if (!rect.nodeComponent) {
        throw new Error('rect.nodeComponent is undefined');
      }
      rect.nodeComponent.nodeInfo.formElements = formElements;

      node = rect.nodeComponent;
      node.nodeInfo.compute = compute;
      node.nodeInfo.initializeCompute = initializeCompute;
      node.nodeInfo.formValues = {
        html: initialValue || defaultHTML,
      };
      setHTML('');

      return node;
    },
  };
};
