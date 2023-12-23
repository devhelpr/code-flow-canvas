import {
  CanvasAppInstance,
  IRectNodeComponent,
  ThumbConnectionType,
  ThumbType,
  createElement,
} from '@devhelpr/visual-programming-system';
import { FormFieldType } from '../components/form-component';
import { NodeInfo } from '../types/node-info';
import {
  RunNodeResult,
  runNodeFromThumb,
} from '../simple-flow-engine/simple-flow-engine';
import {
  InitialValues,
  NodeTask,
  NodeTaskFactory,
} from '../node-task-registry';
import {
  IComputeResult,
  visualNodeFactory,
} from '../node-task-registry/createRectNode';
import {
  createElementFromTemplate,
  createTemplate,
} from '@devhelpr/dom-components';
import { navBarButton } from '../consts/classes';
import {
  AnimatePathFunction,
  AnimatePathFromThumbFunction,
} from '../follow-path/animate-path';

const fieldName = 'message';
export const dialogFormNodeName = 'dialog-form-node';

export const dialogFormNode =
  (
    animatePath: AnimatePathFunction<NodeInfo>,
    animatePathFromThumb: AnimatePathFromThumbFunction<NodeInfo>
  ) =>
  (updated: () => void): NodeTask<NodeInfo> => {
    let node: IRectNodeComponent<NodeInfo>;
    let contextInstance: CanvasAppInstance<NodeInfo> | undefined = undefined;

    const initializeCompute = () => {
      return;
    };

    const computeAsync = (
      input: string,
      pathExecution?: RunNodeResult<NodeInfo>[],
      loopIndex?: number,
      payload?: any,
      thumbName?: string,
      scopeId?: string
    ) => {
      return new Promise<IComputeResult>((resolve, reject) => {
        if (!node) {
          reject();
          return;
        }
        const template = createTemplate(
          `<div class="h-full flex flex-row">
          <div class="h-full flex flex-col flex-auto">
            <p>Dialog form node</p>
            <p class="mb-4">${node?.nodeInfo?.formValues?.[fieldName]}</p>
            <form method="dialog" class="justify-end flex flex-auto items-end">
              <div class="flex w-full flex-row justify-end">
                <button type="submit" class="${navBarButton} m-0 form-ok">OK</button>
                <button type="button" class="${navBarButton} m-0 form-cancel">Cancel</button>
              </div>
            </form>
          </div>
        </div>`
        );
        const formElement = createElementFromTemplate(template);

        const dialogFormNode = createElement(
          'dialog',
          {},
          document.body,
          formElement
        );
        const form = (dialogFormNode.domElement as HTMLElement).querySelector(
          'form'
        );
        (dialogFormNode.domElement as HTMLDialogElement).showModal();
        form?.addEventListener('submit', (event) => {
          event.preventDefault();

          (dialogFormNode.domElement as HTMLDialogElement).close();
          console.log('form submit', node.nodeInfo);

          if (
            !node ||
            !node.thumbConnectors ||
            node.thumbConnectors.length < 2
          ) {
            reject();
            return;
          }

          runNodeFromThumb(
            node.thumbConnectors[0],
            animatePathFromThumb,
            (outputFromMap: string | any[]) => {
              if (!node.thumbConnectors || node.thumbConnectors.length < 2) {
                reject();
                return;
              }

              resolve({
                result: input,
                output: input,
                followPath: undefined,
                stop: true,
              });
            },
            input,
            pathExecution,
            node,
            loopIndex,
            scopeId
          );
        });
        const cancelButton = (
          dialogFormNode.domElement as HTMLElement
        ).querySelector('.form-cancel');
        cancelButton?.addEventListener('click', (event) => {
          event.preventDefault();
          (dialogFormNode.domElement as HTMLDialogElement).close();
          console.log('form cancel', node.nodeInfo);
          if (
            !node ||
            !node.thumbConnectors ||
            node.thumbConnectors.length < 2
          ) {
            reject();
            return;
          }
          runNodeFromThumb(
            node.thumbConnectors[1],
            animatePathFromThumb,
            (outputFromMap: string | any[]) => {
              if (!node.thumbConnectors || node.thumbConnectors.length < 2) {
                reject();
                return;
              }

              resolve({
                result: input,
                output: input,
                followPath: undefined,
                stop: true,
              });
            },
            input,
            pathExecution,
            node,
            loopIndex,
            scopeId
          );
        });
      });
    };

    const template = createTemplate(
      `<div class="h-full w-full flex flex-row">
      <div class="h-full flex flex-col flex-auto">
        <p class="pt-[24px]">Dialog Form</p>
        <div method="dialog" class="justify-end flex flex-auto items-end">
          <div class="flex w-full flex-row justify-end gap-[2px]">
            <div class="bg-slate-700 m-0 w-[16px] h-[8px]"></div>
            <div class="bg-slate-700 m-0 w-[16px] h-[8px]"></div>
          </div>
        </div>
      </div>
    </div>`
    );
    const dialogNodeElement = createElementFromTemplate(template);

    return visualNodeFactory(
      dialogFormNodeName,
      '',
      'flow-canvas',
      'variableName',
      computeAsync,
      initializeCompute,
      false,
      205,
      140,
      [
        {
          thumbType: ThumbType.StartConnectorRight,
          thumbIndex: 0,
          connectionType: ThumbConnectionType.start,
          color: 'white',
          label: ' ',
          prefixLabel: 'Ok',
          name: 'ok',
        },
        {
          thumbType: ThumbType.StartConnectorRight,
          thumbIndex: 1,
          connectionType: ThumbConnectionType.start,
          color: 'white',
          label: ' ',
          prefixLabel: 'Cancel',
          name: 'cancel',
        },
        {
          thumbType: ThumbType.EndConnectorCenter,
          thumbIndex: 0,
          connectionType: ThumbConnectionType.end,
          color: 'white',
          label: ' ',
          maxConnections: 1,
        },
      ],
      (values?: InitialValues) => {
        const formElements = [
          {
            fieldType: FormFieldType.Text,
            fieldName: fieldName,
            value: values?.[fieldName] ?? '',
            settings: {
              showLabel: true,
            },
            onChange: (value: string) => {
              if (!node.nodeInfo) {
                return;
              }
              node.nodeInfo.formValues = {
                ...node.nodeInfo.formValues,
                [fieldName]: value,
              };
              console.log('onChange', node.nodeInfo);
              if (updated) {
                updated();
              }
            },
          },
        ];
        return formElements;
      },
      (nodeInstance) => {
        contextInstance = nodeInstance.contextInstance;
        node = nodeInstance.node;
      },
      {
        hasTitlebar: false,
        hasFormInPopup: true,
        childNodeWrapperClass: 'flex w-full h-full p-[16px]',
        additionalClassNames: 'text-center',
        hasStaticWidthHeight: true,
      },
      dialogNodeElement,
      true
    );
  };
