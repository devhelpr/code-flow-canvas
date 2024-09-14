import {
  FlowCanvas,
  createElement,
  FormFieldType,
  IDOMElement,
  InitialValues,
  INodeComponent,
  IRectNodeComponent,
  NodeTask,
  replaceValues,
  ThumbConnectionType,
  ThumbType,
} from '@devhelpr/visual-programming-system';
import { NodeInfo } from '../types/node-info';

export const getStyledNode = (updated: () => void): NodeTask<NodeInfo> => {
  let node: IRectNodeComponent<NodeInfo>;
  let divNode: IDOMElement | undefined = undefined;

  const defaultStyling = `{
      display:"block"
    }`;

  //let stylingCache = '';

  const setStyling = (value: string) => {
    if (!divNode) {
      return;
    }
    try {
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
      console.log('setStyling', styling);
      //stylingCache = styling;
    } catch (error) {
      console.log('Error in setStyling', error);
    }
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
  // const getNodeStatedHandler = () => {
  //   return {
  //     data: stylingCache,
  //     id: node.id,
  //   };
  // };

  // const setNodeStatedHandler = (_id: string, data: any) => {
  //   if (divNode) {
  //     (divNode.domElement as HTMLElement).removeAttribute('style');
  //     Object.assign((divNode.domElement as HTMLElement).style, data);
  //   }
  // };
  return {
    name: 'styled-node',
    family: 'flow-canvas',
    isContainer: false,
    category: 'html',
    createVisualNode: (
      canvasApp: FlowCanvas<NodeInfo>,
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
        componentWrapper?.domElement
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
          formElements: [],
        },
        containerNode
      );
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
          styling: initialValue || defaultStyling,
        };
        // if (id) {
        //   canvasApp.registeGetNodeStateHandler(id, getNodeStatedHandler);
        //   canvasApp.registeSetNodeStateHandler(id, setNodeStatedHandler);
        // }
      }
      setStyling('');

      return node;
    },
  };
};
