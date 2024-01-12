import {
  CanvasAppInstance,
  createElement,
  IElementNode,
  INodeComponent,
  IRectNodeComponent,
  ThumbConnectionType,
  ThumbType,
} from '@devhelpr/visual-programming-system';
import { NodeInfo } from '../types/node-info';
import { InitialValues, NodeTask } from '../node-task-registry';
import { AnimatePathFunction } from '../follow-path/animate-path';
import { FormFieldType } from '../components/FormField';
import { replaceValues } from '../utils/replace-values';

export const getStyledNode =
  (_animatePath: AnimatePathFunction) =>
  (updated: () => void): NodeTask<NodeInfo> => {
    let node: IRectNodeComponent<NodeInfo>;
    let divNode: IElementNode<NodeInfo>;

    const defaultStyling = `{
      display:"block"
    }`;

    const setStyling = (value: string) => {
      let stylingString =
        node?.nodeInfo?.formValues['styling'] || defaultStyling;
      stylingString = replaceValues(stylingString, { value: value }, true);
      const styling = JSON.parse(stylingString);
      const classes = styling['class'] || '';
      const classList = classes.split(' ').filter(Boolean);
      if (classList && classList.length > 0) {
        (divNode.domElement as HTMLElement).className = '';
        (divNode.domElement as HTMLElement).classList.add(...classList);
      }
      if (styling['class']) {
        delete styling['class'];
      }
      (divNode.domElement as HTMLElement).removeAttribute('style');
      Object.assign((divNode.domElement as HTMLElement).style, styling);
    };

    const initializeCompute = () => {
      return;
    };
    const compute = (input: string) => {
      setStyling(input);

      return {
        result: input,
      };
    };

    return {
      name: 'styled-node',
      family: 'flow-canvas',
      isContainer: false,
      category: 'html',
      createVisualNode: (
        canvasApp: CanvasAppInstance<NodeInfo>,
        x: number,
        y: number,
        id?: string,
        initalValues?: InitialValues,
        containerNode?: IRectNodeComponent<NodeInfo>
      ) => {
        const initialValue = initalValues?.['styling'] || defaultStyling;

        const formElements = [
          {
            fieldType: FormFieldType.TextArea,
            fieldName: 'styling',
            value: initialValue,
            onChange: (value: string) => {
              if (!node.nodeInfo) {
                return;
              }
              node.nodeInfo.formValues = {
                ...node.nodeInfo.formValues,
                styling: value,
              };
              console.log('onChange', node.nodeInfo);
              if (updated) {
                setStyling('');
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

        divNode = createElement(
          'div',
          {
            //class: `bg-sky-600 hover:bg-sky-500 w-full p-2 text-center block text-white font-bold rounded`,
          },
          componentWrapper.domElement
        );
        //button.domElement.textContent = initialValue ?? 'Button';
        const rect = canvasApp.createRect(
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
              //thumbConstraint: 'value',
            },
            {
              thumbType: ThumbType.EndConnectorCenter,
              thumbIndex: 0,
              connectionType: ThumbConnectionType.end,
              color: 'white',
              label: ' ',
              //thumbConstraint: 'value',
            },
          ],
          componentWrapper,
          {
            classNames: `bg-sky-900 p-4 rounded`,
          },
          undefined,
          undefined,
          undefined,
          id,
          {
            type: 'styled-node',
            formValues: {
              styling: initialValue || defaultStyling,
            },
          },
          containerNode
        );
        if (!rect.nodeComponent) {
          throw new Error('rect.nodeComponent is undefined');
        }

        node = rect.nodeComponent;
        if (node.nodeInfo) {
          node.nodeInfo.formElements = formElements;
          node.nodeInfo.compute = compute;
          node.nodeInfo.initializeCompute = initializeCompute;
          node.nodeInfo.formValues = {
            styling: initialValue || defaultStyling,
          };
        }
        setStyling('');

        return node;
      },
    };
  };
