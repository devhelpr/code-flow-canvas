import {
  FormField,
  IComputeResult,
  InitialValues,
  INodeComponent,
  NodeTask,
  ThumbConnectionType,
  ThumbType,
  visualNodeFactory,
} from '@devhelpr/visual-programming-system';
import { NodeInfo } from '@devhelpr/web-flow-executor';
import { pipeline, env } from '@xenova/transformers'; //RawImage

//env.localModelPath = '/models';

env.allowLocalModels = true;
env.allowRemoteModels = false; // prevent remote fallback
env.localModelPath = '/models'; // or your custom host
env.useBrowserCache = false;

const fieldName = 'canvas-rect-node';
const nodeTitle = 'Canvas Node';
export const canvasNodeName = 'canvas-rect-node';
const familyName = 'flow-canvas';
const thumbs = [
  {
    thumbType: ThumbType.StartConnectorCenter,
    thumbIndex: 0,
    connectionType: ThumbConnectionType.start,
    color: 'white',
    label: ' ',
    name: 'output',
    maxConnections: -1,
  },
  {
    thumbType: ThumbType.EndConnectorCenter,
    thumbIndex: 0,
    connectionType: ThumbConnectionType.end,
    color: 'white',
    label: ' ',
    name: 'input',
    maxConnections: 1,
  },
];

export const getCanvasNode =
  () =>
  (_updated: () => void): NodeTask<NodeInfo> => {
    let node: INodeComponent<NodeInfo> | undefined = undefined;
    let segment: any = null;
    const initializeCompute = () => {
      try {
        if (!segment) {
          pipeline(
            'image-segmentation',
            'Xenova/segformer-b0-finetuned-ade-512-512',
            {
              local_files_only: true,
              quantized: false,
              // progress_callback: (progress: number) => {
              //   //console.log('Loading model:', progress);
              // },
            }
          )
            .then((model) => {
              console.log('MODEL LOADED');
              segment = model;
            })
            .catch((error) => {
              console.error('Error loading segmentation model:', error);
            });
        }
      } catch (error) {
        console.error('Error in computeAsync:', error);
      }
      return;
    };
    const computeAsync = (
      input: string,
      _loopIndex?: number,
      _payload?: any
    ) => {
      return new Promise<IComputeResult>((resolve) => {
        // console.log(
        //   'canvas node compute',
        //   input,
        //   node?.nodeInfo?.offscreenCanvas
        // );

        const data = input as any;
        if (data.frame && node?.nodeInfo?.offscreenCanvas) {
          const helper: number[][] = data.frame as number[][];

          const canvas = node?.nodeInfo?.offscreenCanvas;
          const context = canvas.getContext('2d');
          context!.imageSmoothingEnabled = false;

          const frameHeight = helper.length;
          const frameWidth = helper[0].length / 4;

          // Convert 2D array to flat Uint8ClampedArray
          const flatPixels = new Uint8ClampedArray(
            frameWidth * frameHeight * 4
          );

          for (let y = 0; y < frameHeight; y++) {
            for (let x = 0; x < frameWidth; x++) {
              const i = (y * frameWidth + x) * 4;
              const j = x * 4;

              flatPixels[i] = helper[y][j]; // R
              flatPixels[i + 1] = helper[y][j + 1]; // G
              flatPixels[i + 2] = helper[y][j + 2]; // B
              flatPixels[i + 3] = helper[y][j + 3]; // A
            }
          }
          const imageData = new ImageData(flatPixels, frameWidth, frameHeight);
          const tempCanvas = new OffscreenCanvas(frameWidth, frameHeight);
          // Perform segmentation
          // if (segment) {
          //   const resizedCanvas = new OffscreenCanvas(512, 512);
          //   const rctx = resizedCanvas.getContext('2d')!;
          //   rctx.drawImage(tempCanvas, 0, 0, 512, 512);

          //   // Option 1: Blob → ImageBitmap
          //   resizedCanvas.convertToBlob().then((blob) => {
          //     RawImage.fromBlob(blob).then((rawImage) => {
          //       //

          //       //createImageBitmap(imageData).then((imageBitmap) => {
          //       segment(rawImage, {
          //         threshold: 0.15,
          //       }).then(
          //         (
          //           segmentationData: {
          //             mask: {
          //               width: number;
          //               height: number;
          //               data: Uint8ClampedArray;
          //             };
          //           }[]
          //         ) => {
          //           const results = segmentationData;
          //           // Create output ImageData
          //           const width = results[0].mask.width;
          //           const height = results[0].mask.height;

          //           // This mask is a Uint8ClampedArray with values 0 or 1 (for foreground)
          //           const mask = results[0].mask.data as Uint8ClampedArray;

          //           const maskCanvas = new OffscreenCanvas(512, 512);
          //           const maskCtx = maskCanvas.getContext('2d')!;
          //           const maskImageData = maskCtx.createImageData(512, 512);
          //           for (let i = 0; i < mask.length; i++) {
          //             const val = mask[i] ? 255 : 0;
          //             maskImageData.data[i * 4 + 0] = val;
          //             maskImageData.data[i * 4 + 1] = val;
          //             maskImageData.data[i * 4 + 2] = val;
          //             maskImageData.data[i * 4 + 3] = 255;
          //           }
          //           maskCtx.putImageData(maskImageData, 0, 0);
          //           const scaledMaskCanvas = new OffscreenCanvas(
          //             frameWidth,
          //             frameHeight
          //           );
          //           const scaledCtx = scaledMaskCanvas.getContext('2d')!;
          //           scaledCtx.drawImage(
          //             maskCanvas,
          //             0,
          //             0,
          //             frameWidth,
          //             frameHeight
          //           );
          //           const scaledMask = scaledCtx.getImageData(
          //             0,
          //             0,
          //             frameWidth,
          //             frameHeight
          //           ).data;

          //           // for (let i = 0; i < mask.length; i++) {
          //           //   const isForeground = mask[i];
          //           //   if (!isForeground) {
          //           //     imageData.data[i * 4 + 3] = 0; // Set alpha to 0
          //           //   }
          //           // }

          //           for (let i = 0; i < frameWidth * frameHeight; i++) {
          //             const alpha = scaledMask[i * 4]; // R channel of scaled mask
          //             imageData.data[i * 4 + 0] = imageData.data[i * 4 + 0];
          //             imageData.data[i * 4 + 1] = imageData.data[i * 4 + 1];
          //             imageData.data[i * 4 + 2] = imageData.data[i * 4 + 2];
          //             imageData.data[i * 4 + 3] = alpha; // transparent if not foreground
          //           }
          //           // Create a temporary offscreen canvas to draw the frame

          //           const tempCtx = tempCanvas.getContext('2d');
          //           tempCtx!.putImageData(imageData, 0, 0);

          //           // "cover" logic: scale up and crop overflow
          //           const scale = Math.max(
          //             canvas.width / frameWidth,
          //             canvas.height / frameHeight
          //           );

          //           const displayWidth = frameWidth * scale;
          //           const displayHeight = frameHeight * scale;
          //           const offsetX = (canvas.width - displayWidth) / 2;
          //           const offsetY = (canvas.height - displayHeight) / 2;

          //           context!.clearRect(0, 0, canvas.width, canvas.height);
          //           context!.save();

          //           // mirror horizontally
          //           context!.translate(canvas.width, 0);
          //           context!.scale(-1, 1);

          //           // draw image at correct mirrored position
          //           context!.drawImage(
          //             tempCanvas,
          //             0,
          //             0,
          //             frameWidth,
          //             frameHeight,
          //             canvas.width - offsetX - displayWidth, // flipped X
          //             offsetY,
          //             displayWidth,
          //             displayHeight
          //           );

          //           context!.restore();
          //         }
          //       );
          //     });
          //   });
          //   //});
          //   return;
          // }

          //const imageData = new ImageData(flatPixels, frameWidth, frameHeight);

          // Create a temporary offscreen canvas to draw the frame
          //const tempCanvas = new OffscreenCanvas(frameWidth, frameHeight);
          const tempCtx = tempCanvas.getContext('2d');
          tempCtx!.putImageData(imageData, 0, 0);

          // "cover" logic: scale up and crop overflow
          const scale = Math.max(
            canvas.width / frameWidth,
            canvas.height / frameHeight
          );

          const displayWidth = frameWidth * scale;
          const displayHeight = frameHeight * scale;
          const offsetX = (canvas.width - displayWidth) / 2;
          const offsetY = (canvas.height - displayHeight) / 2;

          context!.clearRect(0, 0, canvas.width, canvas.height);
          context!.save();

          // mirror horizontally
          context!.translate(canvas.width, 0);
          context!.scale(-1, 1);

          // draw image at correct mirrored position
          context!.drawImage(
            tempCanvas,
            0,
            0,
            frameWidth,
            frameHeight,
            canvas.width - offsetX - displayWidth, // flipped X
            offsetY,
            displayWidth,
            displayHeight
          );

          context!.restore();
        }
        resolve({
          result: input,
          output: input,
          followPath: undefined,
        });
      });
    };

    return visualNodeFactory(
      canvasNodeName,
      nodeTitle,
      familyName,
      fieldName,
      computeAsync,
      initializeCompute,
      false,
      200,
      100,
      thumbs,
      (_values?: InitialValues): FormField[] => {
        return [];
      },
      (nodeInstance) => {
        if (!nodeInstance.node.nodeInfo) {
          nodeInstance.node.nodeInfo = {};
        }
        nodeInstance.node.nodeInfo.shouldNotSendOutputFromWorkerToMainThread =
          true;

        node = nodeInstance.node;
      },
      {
        category: 'default',
      },
      undefined,
      true
    );
  };
