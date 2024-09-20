import {
  IFlowCanvasBase,
  createElement,
  InitialValues,
  INodeComponent,
  IRectNodeComponent,
  NodeTask,
  NodeTaskFactory,
  Rect,
  ThumbConnectionType,
  ThumbType,
  FormFieldType,
} from '@devhelpr/visual-programming-system';
import { NodeInfo } from '../types/node-info';

export const getStart: NodeTaskFactory<NodeInfo> = (
  updated: () => void
): NodeTask<NodeInfo> => {
  let node: IRectNodeComponent<NodeInfo>;
  let htmlNode: INodeComponent<NodeInfo> | undefined = undefined;
  let rect: Rect<NodeInfo> | undefined = undefined;

  const initializeCompute = () => {
    return;
  };
  const compute = (input: string) => {
    return {
      result: input,
      followPath: undefined,
    };
  };
  return {
    name: 'start-node',
    family: 'flow-canvas',
    createVisualNode: (
      canvasApp: IFlowCanvasBase<NodeInfo>,
      x: number,
      y: number,
      id?: string,
      initalValues?: InitialValues,
      containerNode?: IRectNodeComponent<NodeInfo>
    ) => {
      const externalNameInitialValue = initalValues?.['name'] ?? '';
      const groupInitialValue = initalValues?.['group'] ?? '';
      htmlNode = createElement(
        'div',
        {
          class: 'icon icon-play_circle_outline text-white text-[32px]',
        },
        undefined,
        ''
      ) as unknown as INodeComponent<NodeInfo>;

      const wrapper = createElement(
        'div',
        {
          class: `inner-node bg-slate-500 flex items-center justify-center shape-circle  w-[50px] h-[50px] overflow-hidden text-center`,
          style: {
            'clip-path': 'circle(50%)',
          },
        },
        undefined,
        htmlNode?.domElement as unknown as HTMLElement
      ) as unknown as INodeComponent<NodeInfo>;

      rect = canvasApp.createRectThumb(
        x,
        y,
        50,
        50,
        undefined,
        [
          {
            thumbType: ThumbType.Center,
            thumbIndex: 0,
            connectionType: ThumbConnectionType.start,
            color: 'white',
            label: ' ',
            hidden: true,
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
          type: 'start-node',
          formElements: [],
          formValues: {
            name: externalNameInitialValue ?? '',
            group: groupInitialValue ?? '',
          },
        },
        containerNode,
        undefined,
        true,
        true
      );

      if (!rect.nodeComponent) {
        throw new Error('rect.nodeComponent is undefined');
      }

      node = rect.nodeComponent;
      if (node.nodeInfo) {
        node.nodeInfo.compute = compute;
        node.nodeInfo.initializeCompute = initializeCompute;

        node.nodeInfo.formElements = [
          {
            fieldType: FormFieldType.Text,
            fieldName: 'name',
            label: 'External name',
            value: externalNameInitialValue ?? '',
            onChange: (value: string) => {
              if (!node.nodeInfo) {
                return;
              }

              node.nodeInfo.formValues = {
                ...node.nodeInfo.formValues,
                name: value,
              };

              updated();
            },
          },
          {
            fieldType: FormFieldType.Text,
            fieldName: 'group',
            label: 'Group',
            value: groupInitialValue ?? '',
            onChange: (value: string) => {
              if (!node.nodeInfo) {
                return;
              }

              node.nodeInfo.formValues = {
                ...node.nodeInfo.formValues,
                group: value,
              };

              updated();
            },
          },
        ];
      }
      return node;
    },
  };
};
