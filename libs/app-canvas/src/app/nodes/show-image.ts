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
import { getNodesByNodeType } from '../graph/get-node-by-variable-name';
import { replaceValues } from '../utils/replace-values';
import { emptyImage } from './emptyImage';

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

  let imageData = '';

  const defaultStyling = `{
   
  }`;

  const getStyling = (value: string) => {
    let stylingString = node?.nodeInfo?.formValues['styling'] || defaultStyling;
    stylingString = replaceValues(stylingString, { value: value }, true);
    const styling = JSON.parse(stylingString);
    const classes = styling['class'] || '';
    const classList = classes.split(' ').filter(Boolean);
    if (styling['class']) {
      delete styling['class'];
    }
    return {
      classList,
      styling,
    };
  };

  let stylingCache = '';
  const setStyling = (value: string) => {
    if (!htmlNode) {
      return;
    }
    try {
      // let stylingString =
      //   node?.nodeInfo?.formValues['styling'] || defaultStyling;
      // stylingString = replaceValues(stylingString, { value: value }, true);
      // const styling = JSON.parse(stylingString);
      // const classes = styling['class'] || '';
      // const classList = classes.split(' ').filter(Boolean);
      const result = getStyling(value);

      if (result.classList && result.classList.length > 0) {
        (htmlNode.domElement as HTMLElement).className = '';
        (htmlNode.domElement as HTMLElement).classList.add(...result.classList);
      }
      // if (styling['class']) {
      //   delete styling['class'];
      // }
      (htmlNode.domElement as HTMLElement).removeAttribute('style');
      Object.assign((htmlNode.domElement as HTMLElement).style, result.styling);
      console.log('setStyling', result.styling);
      stylingCache = result.styling;
    } catch (error) {
      console.log('Error in setStyling', error);
    }
  };
  const setImageViaCodeName = (imageCodeName: string) => {
    if (htmlNode && canvasAppInstance && typeof imageCodeName === 'string') {
      const mediaLibrary = canvasAppInstance.getMediaLibrary();
      if (mediaLibrary) {
        const file = mediaLibrary.getFile(imageCodeName);
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
  };

  const initializeCompute = () => {
    hasInitialValue = true;
    imageData = '';
    if (htmlNode) {
      htmlNode.domElement.textContent = '-';
    }
    return;
  };
  const compute = (input: string | any[]) => {
    if (typeof input === 'object' && (input as any).value) {
      setStyling((input as any).value);
    }
    if (htmlNode) {
      if (hasInitialValue) {
        hasInitialValue = false;
      }
      if (typeof input === 'object' && (input as any).image) {
        (
          htmlNode.domElement as HTMLImageElement
        ).src = `data:image/png;base64,${(input as any).image}`;
      } else {
        let imageCodeName = input;
        if (typeof input === 'object' && (input as any).state) {
          imageCodeName = (input as any).state;
        }
        imageData = imageCodeName.toString();

        setImageViaCodeName(imageData);
      }
    }

    return {
      result: input,
      followPath: undefined,
    };
  };

  const getDependencies = (): { startNodeId: string; endNodeId: string }[] => {
    const dependencies: { startNodeId: string; endNodeId: string }[] = [];
    if (canvasAppInstance) {
      const mediaLibrary = getNodesByNodeType(
        'media-library-node',
        canvasAppInstance
      );
      if (mediaLibrary) {
        dependencies.push({
          startNodeId: node.id,
          endNodeId: mediaLibrary.id,
        });
      }
    }
    return dependencies;
  };

  const getNodeStatedHandler = () => {
    return {
      data: { stylingCache, imageData },
      id: node.id,
    };
  };

  const setNodeStatedHandler = (_id: string, data: any) => {
    if (htmlNode) {
      (htmlNode.domElement as HTMLElement).removeAttribute('style');
      Object.assign(
        (htmlNode.domElement as HTMLElement).style,
        data.stylingCache
      );
      if (data.imageData) {
        setImageViaCodeName(data.imageData);
      } else {
        (htmlNode.domElement as HTMLImageElement).src = emptyImage;
      }
    }
  };

  const updateVisual = (data: any) => {
    console.log('updateVisual', data);
    if (htmlNode) {
      if (typeof data === 'object' && (data as any).value) {
        const result = getStyling((data as any).value);

        (htmlNode.domElement as HTMLElement).removeAttribute('style');
        Object.assign(
          (htmlNode.domElement as HTMLElement).style,
          result.styling
        );
      }

      let imageCodeName = data;
      if (typeof data === 'object' && (data as any).state) {
        imageCodeName = (data as any).state;
      }

      if (imageCodeName) {
        setImageViaCodeName(imageCodeName);
      } else {
        (htmlNode.domElement as HTMLImageElement).src = emptyImage;
      }
    }
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
      const initialValue = initalValues?.['styling'] || defaultStyling;
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

      imageData = '';
      htmlNode = createElement(
        'img',
        {
          class:
            'w-full h-full block min-h-[32px] pointer-events-none object-covwr overflow-hidden',
          src: emptyImage,
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
            maxConnections: -1,
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
          styling: initialValue || defaultStyling,
        };
        node.nodeInfo.getDependencies = getDependencies;

        if (id) {
          canvasApp.registeGetNodeStateHandler(id, getNodeStatedHandler);
          canvasApp.registeSetNodeStateHandler(id, setNodeStatedHandler);
        }
        node.nodeInfo.updateVisual = updateVisual;
      }
      return node;
    },
  };
};
