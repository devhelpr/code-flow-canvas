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
    const initializeCompute = () => {
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
        // if (node?.nodeInfo?.offscreenCanvas) {
        //   getGradientColor(40, node.nodeInfo.offscreenCanvas);
        // }
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

          // Create a temporary offscreen canvas to draw the frame
          const tempCanvas = new OffscreenCanvas(frameWidth, frameHeight);
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
