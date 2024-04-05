import {
  CanvasAppInstance,
  createElement,
  INodeComponent,
  IRectNodeComponent,
  ThumbConnectionType,
  ThumbType,
} from '@devhelpr/visual-programming-system';
import { NodeInfo } from '../types/node-info';
import {
  InitialValues,
  NodeTask,
  NodeTaskFactory,
} from '../node-task-registry';
import { FormFieldType } from '../components/FormField';

const selectImage = () => {
  return new Promise((resolve, _reject) => {
    const input = document.createElement('input') as HTMLInputElement & {
      files: FileList;
    };

    input.type = 'file';
    input.setAttribute('accept', '.png,.jpg,.jpeg,.webp');
    input.onchange = () => {
      const files = Array.from(input.files);
      if (files && files.length > 0) {
        const reader = new FileReader();
        reader.addEventListener('load', (event) => {
          if (event && event.target && event.target.result) {
            resolve(window.btoa(event.target.result as string));
          }
          input.remove();
        });
        reader.readAsBinaryString(files[0]);
      }
    };
    input.click();
  });
};

export const getShowImage: NodeTaskFactory<NodeInfo> = (
  updated: () => void
): NodeTask<NodeInfo> => {
  let node: IRectNodeComponent<NodeInfo>;
  let htmlNode: INodeComponent<NodeInfo> | undefined = undefined;
  let hasInitialValue = true;
  let rect: ReturnType<CanvasAppInstance<NodeInfo>['createRect']> | undefined =
    undefined;
  let canvasAppInstance: CanvasAppInstance<NodeInfo> | undefined = undefined;

  const initializeCompute = () => {
    hasInitialValue = true;
    if (htmlNode) {
      htmlNode.domElement.textContent = '-';
    }
    return;
  };
  const compute = (input: string | any[]) => {
    if (htmlNode) {
      if (hasInitialValue) {
        hasInitialValue = false;
      }
      if (typeof input === 'object' && (input as any).image) {
        (
          htmlNode.domElement as HTMLImageElement
        ).src = `data:image/png;base64,${(input as any).image}`;
      } else {
        if (canvasAppInstance && typeof input === 'string') {
          const mediaLibrary = canvasAppInstance.getMediaLibrary();
          if (mediaLibrary) {
            const file = mediaLibrary.getFile(input);
            if (file) {
              try {
                (
                  htmlNode.domElement as HTMLImageElement
                ).src = `data:image/png;base64,${file.data}`;
              } catch (e) {
                console.error('Error when assigning file/media to image', e);
              }
            }
          }
        }
      }
    }

    return {
      result: input,
      followPath: undefined,
    };
  };
  return {
    name: 'show-image',
    family: 'flow-canvas',
    category: 'UI',
    createVisualNode: (
      canvasApp: CanvasAppInstance<NodeInfo>,
      x: number,
      y: number,
      id?: string,
      initalValues?: InitialValues,
      _containerNode?: IRectNodeComponent<NodeInfo>,
      width?: number,
      height?: number
    ) => {
      canvasAppInstance = canvasApp;
      const formElements = [
        {
          fieldType: FormFieldType.Button,
          fieldName: 'loadImage',
          caption: 'Load image',
          onButtonClick: () => {
            return new Promise<void>((resolve, reject) => {
              selectImage().then((image) => {
                if (
                  htmlNode &&
                  image &&
                  node &&
                  node.nodeInfo &&
                  node.nodeInfo.formValues
                ) {
                  node.nodeInfo.formValues.image = image;
                  updated?.();

                  (
                    htmlNode.domElement as HTMLImageElement
                  ).src = `data:image/png;base64,${image}`;
                  resolve();
                } else {
                  reject();
                }
              });
            });
          },
        },
      ];
      htmlNode = createElement(
        'img',
        {
          class:
            'w-full h-full block min-h-[32px] pointer-events-none object-covwr overflow-hidden',
          src: 'data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw==',
        },
        undefined
      ) as unknown as INodeComponent<NodeInfo>;

      const wrapper = createElement(
        'div',
        {
          class: `inner-node bg-slate-500 rounded max-w-full `,
        },
        undefined,
        htmlNode.domElement as unknown as HTMLElement
      ) as unknown as INodeComponent<NodeInfo>;
      rect = canvasApp.createRect(
        x,
        y,
        width ?? 256,
        height ?? 256,
        undefined,
        [
          {
            thumbType: ThumbType.StartConnectorRight,
            thumbIndex: 0,
            connectionType: ThumbConnectionType.start,
            label: ' ',

            name: 'output',
            color: 'white',
          },
          {
            thumbType: ThumbType.EndConnectorLeft,
            thumbIndex: 0,
            connectionType: ThumbConnectionType.end,
            label: ' ',

            name: 'input',
            color: 'white',
          },
        ],
        wrapper,
        {
          classNames: `bg-slate-500 p-4 rounded`,
        },
        true,
        false,
        false,
        id,
        {
          type: 'show-image',
          formElements: [],
        }
      );

      if (initalValues && initalValues['image']) {
        hasInitialValue = false;
        (
          htmlNode.domElement as HTMLImageElement
        ).src = `data:image/png;base64,${initalValues['image']}`;
      }

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
          image: initalValues?.['image'] ?? '',
        };
      }
      return node;
    },
  };
};
