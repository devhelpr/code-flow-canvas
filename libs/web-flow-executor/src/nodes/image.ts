import {
  CanvasAppInstance,
  createElement,
  FormFieldType,
  IConnectionNodeComponent,
  InitialValues,
  INodeComponent,
  IRectNodeComponent,
  NodeTask,
  NodeTaskFactory,
  ThumbConnectionType,
  ThumbType,
} from '@devhelpr/visual-programming-system';
import { NodeInfo } from '../types/node-info';
import { emptyImage } from './emptyImage';
import { RunCounter } from '../follow-path/run-counter';
import { ConvolutionImageData } from './convolution-node';

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

export const getImage: NodeTaskFactory<NodeInfo> = (
  updated: () => void
): NodeTask<NodeInfo> => {
  let node: IRectNodeComponent<NodeInfo>;
  let htmlNode: INodeComponent<NodeInfo> | undefined = undefined;
  let hasInitialValue = true;
  let rect: ReturnType<CanvasAppInstance<NodeInfo>['createRect']> | undefined =
    undefined;

  function convolutionImagedataToImage(imagedata: ConvolutionImageData) {
    var canvas = document.createElement('canvas');
    canvas.width = imagedata.width;
    canvas.height = imagedata.height;
    var context = canvas.getContext('2d');
    context!.imageSmoothingEnabled = false;
    for (let y = 0; y < imagedata.height; y++) {
      for (let x = 0; x < imagedata.width; x++) {
        const index = y * imagedata.width * 4 + x * 4;
        const r = Math.min(255, Math.max(0, imagedata.data[index]));
        const g = Math.min(255, Math.max(0, imagedata.data[index + 1]));
        const b = Math.min(255, Math.max(0, imagedata.data[index + 2]));
        const a = 1; //Math.min(Math.max(imagedata.data[index + 3]));
        context!.fillStyle = `rgba(${r},${g},${b},${a})`;
        context!.fillRect(x, y, 1, 1);
      }
    }

    return canvas.toDataURL();
  }

  function imageDataFromSource(image: HTMLImageElement) {
    //const image = Object.assign(new Image(), { src: source });
    //await new Promise(resolve => image.addEventListener('load', () => resolve()));
    console.log('imageDataFromSource', image.width, image.height);
    const context = Object.assign(document.createElement('canvas'), {
      width: image.width,
      height: image.height,
    }).getContext('2d');
    if (!context) {
      throw new Error('Could not create 2d context');
    }
    context.imageSmoothingEnabled = false;
    context.drawImage(image, 0, 0);
    return context.getImageData(0, 0, image.width, image.height);
  }

  function imagedataToImage(imagedata: ImageData) {
    var canvas = document.createElement('canvas');
    canvas.width = imagedata.width;
    canvas.height = imagedata.height;
    var context = canvas.getContext('2d');
    context!.imageSmoothingEnabled = false;
    console.log('imagedataToImage', imagedata.width, imagedata.height);

    context!.putImageData(imagedata, 0, 0);

    return canvas.toDataURL();
  }

  const initializeCompute = () => {
    hasInitialValue = true;
    if (htmlNode) {
      htmlNode.domElement.textContent = '-';
    }
    return;
  };
  let lastImageData: ImageData | undefined = undefined;
  const computeAsync = (
    input: string | any[],
    _loopIndex?: number,
    _payload?: any,
    _thumbName?: string,
    _scopeId?: string,
    _runCounter?: RunCounter,
    connection?: IConnectionNodeComponent<NodeInfo>
  ) => {
    return new Promise((resolve) => {
      if (htmlNode) {
        const inputObject = input as any;
        if (
          inputObject.data?.imageData &&
          inputObject.data.imageData === 'ConvolutionImageData'
        ) {
          const imageData: ConvolutionImageData = (
            connection?.startNode?.nodeInfo as any
          )?.getImageData?.();
          if (imageData) {
            const imageDataUrl = convolutionImagedataToImage(imageData);
            (htmlNode.domElement as HTMLImageElement).src = imageDataUrl;
            inputObject.connectionHistory = true;
            resolve({
              result: inputObject,
              output: inputObject,
              followPath: undefined,
            });
            return;
          }
        } else if (
          inputObject.data?.imageData &&
          inputObject.data.imageData === 'ImageData'
        ) {
          const imageData = (
            connection?.startNode?.nodeInfo as any
          )?.getImageData?.();
          if (imageData && imageData instanceof ImageData) {
            const imageDataUrl = imagedataToImage(imageData);
            (htmlNode.domElement as HTMLImageElement).src = imageDataUrl;
            inputObject.connectionHistory = true;
            resolve({
              result: inputObject,
              output: inputObject,
              followPath: undefined,
            });
            return;
          }
        }
        if (hasInitialValue) {
          hasInitialValue = false;
        }
        const image = new Image();
        image.onload = () => {
          const imageData = imageDataFromSource(image);
          if (imageData) {
            const output = {
              data: {
                imageData: 'ImageData',
              },
              width: imageData.width,
              height: imageData.height,
              connectionHistory: false,
            };
            lastImageData = imageData;
            resolve({
              result: output,
              output,
              followPath: undefined,
            });
          }
        };
        image.src = (htmlNode.domElement as HTMLImageElement).src;
        return;
      }

      resolve({
        result: false,
        output: false,
        stop: true,
        followPath: undefined,
      });
    });
  };

  return {
    name: 'image',
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
            'w-full h-full object-contain block min-h-[32px] pointer-events-none object-covwr overflow-hidden',
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
            thumbType: ThumbType.StartConnectorCenter,
            thumbIndex: 0,
            connectionType: ThumbConnectionType.start,
            label: ' ',
            maxConnections: -1,
            name: 'output',
            color: 'white',
            thumbConstraint: 'image',
          },
          {
            thumbType: ThumbType.EndConnectorCenter,
            thumbIndex: 0,
            connectionType: ThumbConnectionType.end,
            label: ' ',
            name: 'input',
            color: 'white',
            thumbConstraint: 'image',
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
          type: 'image',
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
        node.nodeInfo.computeAsync = computeAsync;
        node.nodeInfo.initializeCompute = initializeCompute;
        node.nodeInfo.formValues = {
          image: initalValues?.['image'] ?? '',
        };

        node.nodeInfo.isSettingsPopup = true;
        (node.nodeInfo as any).getImageData = () => lastImageData;
      }
      return node;
    },
  };
};
