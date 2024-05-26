import {
  CanvasAppInstance,
  createElement,
  createNodeElement,
  INodeComponent,
  IRectNodeComponent,
} from '@devhelpr/visual-programming-system';
import { NodeInfo } from '../types/node-info';
import {
  InitialValues,
  NodeTask,
  NodeTaskFactory,
} from '../node-task-registry';
import { FormFieldType } from '../components/FormField';

export const getAnnotation: NodeTaskFactory<NodeInfo> = (
  updated: () => void
): NodeTask<NodeInfo> => {
  let node: IRectNodeComponent<NodeInfo>;
  const initializeCompute = () => {
    return;
  };
  const compute = () => {
    return {
      result: true,
    };
  };

  return {
    name: 'annotation',
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
      const formElements = [
        {
          fieldType: FormFieldType.TextArea,
          fieldName: 'annotation',
          value: initalValues?.['annotation'] ?? '',
          onChange: (value: string) => {
            if (!node?.nodeInfo) {
              return;
            }
            node.nodeInfo.formValues['annotation'] = value;
            textArea.domElement.textContent = value;
            rect.resize();
            updated();
          },
        },
        {
          fieldType: FormFieldType.Slider,
          fieldName: 'fontSize',
          label: 'Font Size',
          value: initalValues?.['fontSize'] ?? '',
          onChange: (value: string) => {
            if (!node?.nodeInfo) {
              return;
            }
            node.nodeInfo.formValues['fontSize'] = value;
            (textArea.domElement as HTMLElement).style.fontSize = `${value}px`;
            rect.resize();
            updated();
          },
        },
        {
          fieldType: FormFieldType.Checkbox,
          fieldName: 'fontWeight',
          label: 'Bold',
          value: initalValues?.['fontWeight'] ?? '',
          onChange: (value: string) => {
            if (!node?.nodeInfo) {
              return;
            }
            node.nodeInfo.formValues['fontWeight'] = value;
            (textArea.domElement as HTMLElement).style.fontWeight = `${
              value ? '700' : '400'
            }`;
            rect.resize();
            updated();
          },
        },
      ];

      const componentWrapper = createNodeElement(
        'div',
        {
          class: `relative`,
        },
        undefined
      ) as unknown as INodeComponent<NodeInfo>;

      const textArea = createElement(
        'div',
        {
          type: 'annotation',
          class: `relative block text-white bg-transparent h-auto whitespace-pre`,
        },
        componentWrapper.domElement
      );
      textArea.domElement.textContent =
        initalValues?.['annotation'] || 'Annotation';

      const rect = canvasApp.createRect(
        x,
        y,
        240,
        100,
        undefined,
        [],
        componentWrapper,
        {
          classNames: `p-4 bg-transparent `,
        },
        false,
        undefined,
        undefined,
        id,
        {
          type: 'annotation',
          formValues: {
            annotation: initalValues?.['annotation'] || 'Annotation',
            fontSize: initalValues?.['fontSize'] || '16',
            fontWeight: initalValues?.['fontWeight'] || 'false',
          },
        },
        containerNode
      );
      if (!rect.nodeComponent) {
        throw new Error('rect.nodeComponent is undefined');
      }

      (textArea.domElement as HTMLElement).style.fontSize = `${
        initalValues?.['fontSize'] || '16'
      }px`;

      (textArea.domElement as HTMLElement).style.fontWeight = `${
        initalValues?.['fontWeight'] ? '700' : '400'
      }`;
      node = rect.nodeComponent;
      if (node.nodeInfo) {
        node.nodeInfo.formElements = formElements;
        node.nodeInfo.compute = compute;
        node.nodeInfo.initializeCompute = initializeCompute;
        node.nodeInfo.isSettingsPopup = true;
        node.nodeInfo.nodeCannotBeReplaced = true;
      }
      rect.resize();
      return node;
    },
  };
};
