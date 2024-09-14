import {
  FlowCanvas,
  createElement,
  createNodeElement,
  FormFieldType,
  IDOMElement,
  InitialValues,
  INodeComponent,
  IRectNodeComponent,
  NodeTask,
  ThumbConnectionType,
  ThumbType,
} from '@devhelpr/visual-programming-system';
import { NodeInfo } from '../types/node-info';
import { RunCounter } from '../follow-path/run-counter';
import { runNode } from '../flow-engine/flow-engine';

export const getButton =
  (
    _createRunCounterContext: (
      isRunViaRunButton: boolean,
      shouldResetConnectionSlider: boolean
    ) => RunCounter
  ) =>
  (updated: () => void): NodeTask<NodeInfo> => {
    let node: IRectNodeComponent<NodeInfo>;
    let button: IDOMElement | undefined = undefined;
    let currentValue = 0;
    let triggerButton = false;
    let runCounter: RunCounter | undefined = undefined;
    const initializeCompute = () => {
      currentValue = 0;
      return;
    };
    const compute = (
      input: string,
      _loopIndex?: number,
      _payload?: any,
      _thumbName?: string,
      _scopeId?: string,
      runCounterCompute?: RunCounter
    ) => {
      if (!triggerButton) {
        runCounter = runCounterCompute;
      }
      try {
        currentValue = parseFloat(input) || 0;
      } catch {
        currentValue = 0;
      }
      if (triggerButton && node.nodeInfo) {
        triggerButton = false;
        return {
          result: node.nodeInfo.formValues['caption'] || 'Button',
        };
        // return {
        //   result: currentValue,
        // };
      }
      return {
        result: false,
        stop: true,
      };
    };

    return {
      name: 'button',
      family: 'flow-canvas',
      isContainer: false,
      category: 'UI',
      createVisualNode: (
        canvasApp: FlowCanvas<NodeInfo>,
        x: number,
        y: number,
        id?: string,
        initalValues?: InitialValues,
        containerNode?: IRectNodeComponent<NodeInfo>
      ) => {
        const initialValue = initalValues?.['caption'] || 'Button';

        const formElements = [
          {
            fieldType: FormFieldType.Text,
            fieldName: 'caption',
            value: initialValue,
            onChange: (value: string) => {
              if (!node.nodeInfo || !button) {
                return;
              }
              node.nodeInfo.formValues = {
                ...node.nodeInfo.formValues,
                caption: value,
              };
              button.domElement.textContent =
                node.nodeInfo.formValues['caption'] || 'Button';
              console.log('onChange', node.nodeInfo);

              rect.resize(200);
              if (updated) {
                updated();
              }
            },
          },
        ];

        const componentWrapper = createNodeElement(
          'div',
          {
            class: `inner-node bg-sky-900 p-4 rounded`,
          },
          undefined
        ) as unknown as INodeComponent<NodeInfo>;

        button = createElement(
          'button',
          {
            class: `bg-sky-600 hover:bg-sky-500 w-full p-2 text-center block text-white font-bold rounded`,
            click: (event: Event) => {
              event.preventDefault();
              event.stopPropagation();
              if (!node.nodeInfo) {
                return;
              }
              triggerButton = true;
              //runCounter = createRunCounterContext(false, false);

              runNode(
                containerNode ?? node,
                containerNode
                  ? (containerNode.nodeInfo as any)?.canvasAppInstance
                  : canvasApp,
                () => {
                  //
                },
                containerNode
                  ? node.nodeInfo.formValues['caption'] || 'Button'
                  : currentValue.toString(),
                undefined,
                undefined,
                undefined,
                undefined,
                undefined,
                runCounter,
                false
              );

              return false;
            },
          },
          componentWrapper.domElement
        );
        if (button) {
          button.domElement.textContent = initialValue ?? 'Button';
        }
        const rect = canvasApp.createRect(
          x,
          y,
          200,
          100,
          undefined,

          containerNode
            ? []
            : [
                {
                  thumbType: ThumbType.StartConnectorCenter,
                  thumbIndex: 0,
                  connectionType: ThumbConnectionType.start,
                  color: 'white',
                  label: '',
                  //thumbConstraint: 'value',
                },
                // {
                //   thumbType: ThumbType.EndConnectorCenter,
                //   thumbIndex: 0,
                //   connectionType: ThumbConnectionType.end,
                //   color: 'white',
                //   label: ' ',
                //   //thumbConstraint: 'value',
                // },
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
            type: 'button',
            formValues: {
              caption: initialValue || 'Button',
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
          node.nodeInfo.showFormOnlyInPopup = true;
          node.nodeInfo.isUINode = true;
        }
        return node;
      },
    };
  };
