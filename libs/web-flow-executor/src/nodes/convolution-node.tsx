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
  renderElement,
  ThumbConnectionType,
  ThumbType,
  createJSXElement,
} from '@devhelpr/visual-programming-system';
import { NodeInfo } from '../types/node-info';
import { RunCounter } from '../follow-path/run-counter';

export interface ConvolutionImageData {
  data: Int32Array;
  width: number;
  height: number;
  type: 'ConvolutionImageData';
}

export const getConvolutionNode: NodeTaskFactory<NodeInfo> = (
  updated: () => void
): NodeTask<NodeInfo> => {
  let node: IRectNodeComponent<NodeInfo>;
  let htmlNode: HTMLElement | undefined = undefined;
  let modeElement: HTMLElement | undefined = undefined;
  let hasInitialValue = true;
  let rect: ReturnType<CanvasAppInstance<NodeInfo>['createRect']> | undefined =
    undefined;

  let lastImageData: ConvolutionImageData | undefined = undefined;

  function imagedataToImage(
    imagedata: ImageData | ConvolutionImageData,
    matrix: number[][],
    mode: string
  ): ConvolutionImageData {
    const rows = matrix.length;
    const cols = matrix[0].length;
    let maxPoolingStride = 2;

    let maxWidth = imagedata.width;
    let maxHeight = imagedata.height;
    let width = 0;
    let height = 0;
    if (mode === 'relu') {
      width = imagedata.width;
      height = imagedata.height;
    }
    if (mode === 'max-pooling') {
      width = Math.ceil(imagedata.width / maxPoolingStride);
      height = Math.ceil(imagedata.height / maxPoolingStride);
    } else {
      width = imagedata.width - cols;
      height = imagedata.height - rows;
      maxHeight = height;
      maxWidth = width;
      maxPoolingStride = 1;
    }
    const outputImageData: ConvolutionImageData = {
      data: new Int32Array(width * height * 4),
      width: width,
      height: height,
      type: 'ConvolutionImageData',
    };

    for (let y = 0; y < maxHeight; y += maxPoolingStride) {
      for (let x = 0; x < maxWidth; x += maxPoolingStride) {
        if (mode === 'relu') {
          const index = 4 * (y * imagedata.width + x);
          let r = imagedata.data[index];
          let g = imagedata.data[index + 1];
          let b = imagedata.data[index + 2];
          if (r < 0) {
            r = 0;
          }
          if (g < 0) {
            g = 0;
          }
          if (b < 0) {
            b = 0;
          }
          const outputIndex = 4 * (y * outputImageData.width + x);
          outputImageData.data[outputIndex] = r;
          outputImageData.data[outputIndex + 1] = g;
          outputImageData.data[outputIndex + 2] = b;
          outputImageData.data[outputIndex + 3] = 1;
        } else if (mode === 'max-pooling') {
          let maxr = 0;
          let maxg = 0;
          let maxb = 0;
          for (let i = 0; i < maxPoolingStride; i++) {
            for (let j = 0; j < maxPoolingStride; j++) {
              if (y + i < imagedata.height && x + j < imagedata.width) {
                const index = 4 * ((y + i) * imagedata.width) + 4 * (x + j);
                maxr = Math.max(imagedata.data[index], maxr);
                maxg = Math.max(imagedata.data[index + 1], maxg);
                maxb = Math.max(imagedata.data[index + 2], maxb);
              }
            }
          }

          const index =
            Math.floor(y / maxPoolingStride) * outputImageData.width * 4 +
            Math.floor(x / maxPoolingStride) * 4;
          outputImageData.data[index] = maxr;
          outputImageData.data[index + 1] = maxg;
          outputImageData.data[index + 2] = maxb;
          outputImageData.data[index + 3] = 1;
        } else {
          let sumr = 0;
          let sumg = 0;
          let sumb = 0;
          for (let i = 0; i < rows; i++) {
            for (let j = 0; j < cols; j++) {
              const index = 4 * ((y + i) * imagedata.width) + 4 * (x + j);
              sumr += imagedata.data[index] * matrix[i][j];
              sumg += imagedata.data[index + 1] * matrix[i][j];
              sumb += imagedata.data[index + 2] * matrix[i][j];
            }
          }
          const index = 4 * y * outputImageData.width + x * 4;
          outputImageData.data[index] = sumr;
          outputImageData.data[index + 1] = sumg;
          outputImageData.data[index + 2] = sumb;
          outputImageData.data[index + 3] = 1;
        }
      }
    }
    return outputImageData;
  }

  const initializeCompute = () => {
    hasInitialValue = true;
    lastImageData = undefined;
    return;
  };
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
        /*
          if input is convoluted image data, then use that as the source
          ... only in image node convert this first to ImageData
        */
        if (
          inputObject.data?.imageData &&
          (inputObject.data.imageData === 'ImageData' ||
            inputObject.data.imageData === 'ConvolutionImageData')
        ) {
          const mode = node.nodeInfo?.formValues?.mode;
          const imageData = (
            connection?.startNode?.nodeInfo as any
          )?.getImageData?.();
          if (
            imageData &&
            (imageData instanceof ImageData ||
              imageData.type === 'ConvolutionImageData')
          ) {
            // const kernel = [
            //   [1, 0, 0, 0, 0],
            //   [0, 3, 0, 0, 0],
            //   [0, 0, -1, 0, 0],
            //   [0, 0, 0, 3, 0],
            //   [0, 0, 0, 0, 1],
            // ];

            // const kernel = [
            //   // emboss
            //   [-2, -1, 0],
            //   [-1, 1, 1],
            //   [0, 1, 2],
            // ];

            const kernel = [
              // sharpen
              [0, -1, 0],
              [-1, 5, -1],
              [0, -1, 0],
            ];
            lastImageData = imagedataToImage(imageData, kernel, mode);
            inputObject.data.imageData = 'ConvolutionImageData';
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
    name: 'convolution-node',
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
      const wrapper = createElement(
        'div',
        {
          class: `inner-node bg-slate-500 rounded max-w-full flex flex-col items-center justify-center`,
        },
        undefined,
        undefined
      ) as unknown as INodeComponent<NodeInfo>;

      renderElement(
        <div
          class="text-white text-center"
          getElement={(element: HTMLElement) => (htmlNode = element)}
        >
          Convolution Node
          <br />
          <div getelement={(element: HTMLElement) => (modeElement = element)}>
            {initalValues?.['mode']}
          </div>
        </div>,
        wrapper.domElement as HTMLElement
      );

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
          type: 'convolution-node',
          formElements: [],
        }
      );

      if (!rect.nodeComponent) {
        throw new Error('rect.nodeComponent is undefined');
      }

      node = rect.nodeComponent;
      if (node.nodeInfo) {
        node.nodeInfo.formElements = [
          {
            fieldType: FormFieldType.Select,
            fieldName: 'mode',
            label: 'Mode',

            value: initalValues?.['mode'] ?? 'kernel',
            options: [
              { value: 'kernel', label: 'Filter Kernel' },
              { value: 'max-pooling', label: 'Max pooling' },
              { value: 'relu', label: 'ReLU' },
            ],
            onChange: (value: string) => {
              if (!node || !node.nodeInfo) {
                return;
              }
              node.nodeInfo.formValues = {
                ...node.nodeInfo.formValues,
                ['mode']: value,
              };
              if (modeElement) {
                modeElement.textContent = value;
              }
              if (updated) {
                updated();
              }
            },
          },
        ];
        //node.nodeInfo.showFormOnlyInPopup = true;
        node.nodeInfo.computeAsync = computeAsync;
        node.nodeInfo.initializeCompute = initializeCompute;
        node.nodeInfo.formValues = {
          mode: initalValues?.['mode'] ?? 'kernel',
        };
        node.nodeInfo.isSettingsPopup = true;
        (node.nodeInfo as any).getImageData = () => lastImageData;
      }
      return node;
    },
  };
};
