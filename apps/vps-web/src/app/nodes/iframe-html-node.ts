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
import { FormFieldType } from '../components/form-component';
import { create } from 'domain';

export const getIFrameHtmlNode = (updated: () => void): NodeTask<NodeInfo> => {
  let node: IRectNodeComponent<NodeInfo>;
  let divNode: IElementNode<NodeInfo>;
  let rect: ReturnType<CanvasAppInstance<NodeInfo>['createRect']> | undefined =
    undefined;
  let variables: Record<string, string> = {};

  const defaultHTML = `<div class="bg-sky-800 text-white 
    flex items-center justify-center
    min-w-[200px] min-h-[200px]">Click to edit HTML</div>`;

  function encodeHTMLEntities(text: string) {
    const textArea = document.createElement('textarea');
    textArea.textContent = text;
    return textArea.innerHTML;
  }

  const setHTML = (value: string) => {
    try {
      const splitted = (value ?? '').toString().split(':');
      if (splitted.length === 2) {
        variables[splitted[0]] = splitted[1] || '';
      } else {
        variables['value'] = value;
      }

      const isEmpty = !node?.nodeInfo?.formValues['html'];
      //       const htmlString = `<!DOCTYPE html>
      // <html lang="en">
      //   <head>
      //     <meta charset="utf-8" />
      //   </head>
      //   <body>
      // ${node?.nodeInfo?.formValues['html'] || defaultHTML}
      // </body>
      // </html>`;

      const htmlString = `${node?.nodeInfo?.formValues['html'] || defaultHTML}`;

      console.log('htmlString', htmlString);
      if (isEmpty) {
        (divNode.domElement as HTMLElement).innerHTML = `${htmlString}`;
      } else {
        (divNode.domElement as HTMLElement).innerHTML = '';

        createElement(
          'iframe',
          {
            srcdoc: `${htmlString}`,
            class: 'w-full h-full bg-white',
          },
          divNode.domElement as HTMLElement
        );
      }
      if (rect) {
        rect.resize();
      }
    } catch (error) {
      console.log('setHTML error', error);
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
    name: 'iframe-html-node',
    family: 'flow-canvas',
    isContainer: false,
    createVisualNode: (
      canvasApp: CanvasAppInstance<NodeInfo>,
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
            if (!node.nodeInfo) {
              return;
            }
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
          id: id ?? '',
          class: `inner-node rounded min-h-[100px] overflow-hidden`,
          style: {
            'clip-path': 'polygon(100% 0, 100% 100%, 0% 100%, 0 0%',
          },
        },
        undefined
      ) as unknown as INodeComponent<NodeInfo>;
      createElement(
        'div',
        { class: 'flex items-center bg-slate-600 text-white p-1 px-3' },
        componentWrapper.domElement,
        'HTML Node'
      );
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
          type: 'iframe-html-node',
          formValues: {
            html: initialValue || defaultHTML,
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
          html: initialValue || defaultHTML,
        };
      }
      setHTML('');

      return node;
    },
  };
};
