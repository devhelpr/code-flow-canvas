import {
  CanvasAppInstance,
  createElement,
  INodeComponent,
  ThumbConnectionType,
  ThumbType,
  createCanvasApp,
  IRectNodeComponent,
  FormFieldType,
  InitialValues,
  NodeTask,
  NodeTaskFactory,
} from '@devhelpr/visual-programming-system';
import { NodeInfo } from '../types/node-info';

export const createStateCompound: NodeTaskFactory<NodeInfo> = (
  updated: () => void
): NodeTask<NodeInfo> => {
  let node: IRectNodeComponent<NodeInfo>;
  let htmlNode: INodeComponent<NodeInfo> | undefined = undefined;
  let rect: ReturnType<CanvasAppInstance<NodeInfo>['createRect']> | undefined =
    undefined;
  let canvasAppInstance: CanvasAppInstance<NodeInfo> | undefined = undefined;

  let captionNodeComponent: INodeComponent<NodeInfo> | undefined = undefined;

  const initializeCompute = () => {
    return;
  };
  const compute = (_input: string, _loopIndex?: number) => {
    return {
      result: undefined,
      stop: true,
      followPath: undefined,
    };
  };

  return {
    name: 'state-compound',
    family: 'flow-canvas',
    category: 'state-machine',
    isContainer: true,
    isContained: true,
    childNodeTasks: ['state', 'state-transition', 'state-compound'],
    getConnectionInfo: () => {
      return { inputs: [], outputs: [] };
    },
    createVisualNode: (
      canvasApp: CanvasAppInstance<NodeInfo>,
      x: number,
      y: number,
      id?: string,
      initalValues?: InitialValues,
      containerNode?: IRectNodeComponent<NodeInfo>,
      width?: number,
      height?: number,
      nestedLevel?: number
    ) => {
      const initialValue = initalValues?.['caption'] ?? 'State';
      const formElements = [
        {
          fieldType: FormFieldType.Text,
          fieldName: 'caption',
          value: initialValue ?? '',
          onChange: (value: string) => {
            if (!node.nodeInfo) {
              return;
            }
            node.nodeInfo.formValues = {
              ...node.nodeInfo.formValues,
              caption: value,
            };
            if (captionNodeComponent) {
              captionNodeComponent.domElement.textContent =
                node.nodeInfo.formValues['caption'] ?? 'State';
            }

            console.log('onChange', node.nodeInfo);
            if (updated) {
              updated();
            }
          },
        },
      ];

      htmlNode = createElement(
        'div',
        {
          class: 'w-full h-full overflow-hidden',
        },
        undefined,
        ''
      ) as unknown as INodeComponent<NodeInfo>;

      let background = 'bg-slate-500';
      if ((nestedLevel ?? 0) % 2 === 0) {
        background = 'bg-slate-600';
      }
      const wrapper = createElement(
        'div',
        {
          class: ` rounded inner-node ${
            containerNode ? background : 'bg-slate-400'
          }`,
        },
        undefined,
        htmlNode.domElement as unknown as HTMLElement
      ) as unknown as INodeComponent<NodeInfo>;

      rect = canvasApp.createRectThumb(
        x,
        y,
        width ?? 600,
        height ?? 400,
        undefined,
        [
          {
            thumbType: ThumbType.Center,
            thumbIndex: 0,
            connectionType: ThumbConnectionType.startOrEnd,
            color: 'white',
            label: '#',
            thumbConstraint: 'transition',
            name: 'state',
            hidden: true,
          },
        ],
        wrapper,
        {
          //classNames: `p-4 rounded`,
        },
        true,
        undefined,
        undefined,
        id,
        {
          formElements: nestedLevel === 0 ? [] : formElements,
          type: 'state-compound',
          taskType: 'state-compound',
          formValues: {
            caption: initialValue ?? '',
          },
        },
        containerNode
      );
      // rect.nodeComponent.nodeInfo = {};
      // rect.nodeComponent.nodeInfo.formElements = [];
      // rect.nodeComponent.nodeInfo.taskType = nodeTypeName;

      if (!rect.nodeComponent) {
        throw new Error('rect.nodeComponent is undefined');
      }

      rect.nodeComponent.nestedLevel = nestedLevel ?? 0;

      if ((nestedLevel ?? 0) > 0) {
        captionNodeComponent = createElement(
          'div',
          {
            class: `bg-black text-white absolute top-0 left-0 w-full px-4 py-2 z-[1050]`,
          },
          rect.nodeComponent.domElement as unknown as HTMLElement,
          `${initialValue} (${nestedLevel ?? 0})`
        ) as unknown as INodeComponent<NodeInfo>;
      }

      if (htmlNode.domElement) {
        canvasAppInstance = createCanvasApp<NodeInfo>(
          htmlNode.domElement as HTMLElement,
          false,
          true,
          '',
          canvasApp.interactionStateMachine,
          undefined,
          undefined,
          undefined,
          true
        );

        rect.nodeComponent.canvasAppInstance = canvasAppInstance;

        canvasAppInstance.setOnCanvasUpdated(() => {
          updated?.();
        });

        rect.addUpdateEventListener((target) => {
          if (target) {
            //
          }
        });

        (canvasAppInstance.canvas.domElement as HTMLElement).classList.add(
          'pointer-events-auto'
        );
      }

      node = rect.nodeComponent;
      if (node.nodeInfo) {
        if (nestedLevel ?? 0 > 0) {
          node.nodeInfo.formElements = formElements;
        }
        node.nodeInfo.compute = compute;
        node.nodeInfo.initializeCompute = initializeCompute;
        node.nodeInfo.canvasAppInstance = canvasAppInstance;
      }

      return node;
    },
  };
};
