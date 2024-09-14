import {
  FlowCanvas,
  IRectNodeComponent,
  InitialValues,
  NodeTask,
  NodeTaskFactory,
  ThumbConnectionType,
  ThumbType,
  createJSXElement,
  getCamera,
} from '@devhelpr/visual-programming-system';
import { NodeInfo } from '../types/node-info';
import { RunCounter } from '../follow-path/run-counter';

export const neuralManualDrawableCanvasInputNodeName =
  'neural-manual-drawable-canvas-input.';
const thumbs = [
  {
    thumbType: ThumbType.StartConnectorCenter,
    thumbIndex: 0,
    connectionType: ThumbConnectionType.start,
    color: 'white',
    label: ' ',
    maxConnections: -1,
    thumbConstraint: 'input-data',
  },
  {
    thumbType: ThumbType.EndConnectorCenter,
    thumbIndex: 0,
    connectionType: ThumbConnectionType.end,
    color: 'white',
    label: ' ',
    maxConnections: 1,
  },
];

export const getNeuralManualDrawableCanvasNode: NodeTaskFactory<NodeInfo> = (
  _updated: () => void
): NodeTask<any> => {
  let nodeComponent: IRectNodeComponent<NodeInfo>;
  let canvasContext: CanvasRenderingContext2D | null = null;
  let canvasElement: HTMLCanvasElement | null = null;
  let inputElement: HTMLInputElement | null = null;
  let paint: boolean = false;
  let clickX: number[] = [];
  let clickY: number[] = [];
  let clickDrag: boolean[] = [];
  const initializeCompute = () => {
    paint = false;
    clickX = [];
    clickY = [];
    clickDrag = [];
    if (canvasContext) {
      canvasContext.clearRect(0, 0, 28, 28);
    }
    return;
  };

  const compute = (
    _input: string,
    _loopIndex?: number,
    _payload?: any,
    _thumbName?: string,
    _scopeId?: string,
    _runCounter?: RunCounter
  ) => {
    if (!canvasContext) {
      return {
        result: undefined,
        output: undefined,
        followPath: undefined,
        stop: true,
      };
    }

    // const imageData = canvasContext.getImageData(0, 0, 28, 28);
    // const outputImageData: number[] = [];
    // let total = 0;
    // imageData.data.forEach((value, index) => {
    //   if (index % 4 === 0) {
    //     outputImageData.push(value > 0 ? 255 : 0);
    //   }
    //   total += value;
    // });
    // console.log('total', total, clickX, clickY);
    let outputImageData: number[] = Array(28 * 28).fill(0);
    for (let i = 0; i < clickX.length; ++i) {
      const x = clickX[i];
      const y = clickY[i];
      const index = y * 28 + x;
      outputImageData[index] = 1;
    }
    console.log('outputImageData', outputImageData);
    const label = parseInt(inputElement!.value) ?? 0;
    const expectedOutput = Array(10).fill(0);
    expectedOutput[label] = 1;
    const output = {
      training: 0,
      inputs: outputImageData,
      expectedOutput: expectedOutput,
    };
    return {
      result: output,
      output: output,
      followPath: undefined,
    };
  };
  const addClick = (x: number, y: number, dragging: boolean) => {
    clickX.push(Math.ceil(x));
    clickY.push(Math.ceil(y));
    clickDrag.push(dragging);
  };

  const redraw = () => {
    if (!canvasContext) {
      return;
    }
    for (let i = 0; i < clickX.length; ++i) {
      canvasContext.beginPath();
      if (clickDrag[i] && i) {
        canvasContext.moveTo(clickX[i - 1], clickY[i - 1]);
      } else {
        canvasContext.moveTo(clickX[i] - 1, clickY[i]);
      }

      canvasContext.lineTo(clickX[i], clickY[i]);
      canvasContext.stroke();
    }
    canvasContext.closePath();
  };

  return {
    name: neuralManualDrawableCanvasInputNodeName,
    family: 'flow-canvas',
    category: 'flow-control',
    isContainer: false,
    thumbs,
    createVisualNode: (
      canvasApp: FlowCanvas<NodeInfo>,
      x: number,
      y: number,
      id?: string,
      _initalValues?: InitialValues,
      containerNode?: IRectNodeComponent<NodeInfo>
    ) => {
      const Component = () => (
        <div class="inner-node bg-white text-black p-4 rounded flex flex-col justify-center items-center min-w-[250px] min-h-[250px]">
          <div>Drawable canvas</div>
          <canvas
            getElement={(element: HTMLCanvasElement) => {
              canvasContext = element.getContext('2d');
              canvasElement = element;
              if (canvasContext) {
                canvasContext.lineCap = 'round';
                canvasContext.lineJoin = 'round';
                canvasContext.strokeStyle = 'black';
                canvasContext.lineWidth = 1;
              }
            }}
            width="28"
            height="28"
            class="border border-solid border-black m-auto cursor-pointer"
            mousedown={(e: MouseEvent | TouchEvent) => {
              if (!canvasContext || !canvasElement) {
                return;
              }
              const camera = getCamera();
              e.preventDefault();
              e.stopPropagation();
              let mouseX = (e as TouchEvent).changedTouches
                ? (e as TouchEvent).changedTouches[0].clientX
                : (e as MouseEvent).x;
              let mouseY = (e as TouchEvent).changedTouches
                ? (e as TouchEvent).changedTouches[0].clientY
                : (e as MouseEvent).y;
              // mouseX -= canvasElement.offsetLeft;
              // mouseY -= canvasElement.offsetTop;

              const bounds = canvasElement.getBoundingClientRect();
              mouseX -= bounds.left;
              mouseY -= bounds.top;
              mouseX /= camera.scale;
              mouseY /= camera.scale;
              console.log(
                'mousedown',
                mouseX,
                mouseY,
                canvasElement.clientTop,
                canvasElement.clientLeft,
                camera.scale,
                bounds
              );
              paint = true;
              addClick(mouseX, mouseY, false);
              redraw();
              return false;
            }}
            mousemove={(e: MouseEvent | TouchEvent) => {
              if (!canvasContext || !canvasElement) {
                return;
              }
              e.preventDefault();
              e.stopPropagation();
              const camera = getCamera();
              let mouseX = (e as TouchEvent).changedTouches
                ? (e as TouchEvent).changedTouches[0].pageX
                : (e as MouseEvent).x;
              let mouseY = (e as TouchEvent).changedTouches
                ? (e as TouchEvent).changedTouches[0].pageY
                : (e as MouseEvent).y;
              const bounds = canvasElement.getBoundingClientRect();
              mouseX -= bounds.left;
              mouseY -= bounds.top;
              mouseX /= camera.scale;
              mouseY /= camera.scale;

              if (paint) {
                addClick(mouseX, mouseY, true);
                redraw();
              }

              e.preventDefault();
              return false;
            }}
            mouseup={() => {
              paint = false;
              redraw();
            }}
            mouseout={() => {
              paint = false;
            }}
          ></canvas>
          <input
            getElement={(element: HTMLInputElement) => (inputElement = element)}
            name="label"
            class="border border-solid border-black p-2 rounded"
          ></input>
          <button
            class="m-auto border border-solid border-black p-2 rounded cursor-pointer"
            click={() => {
              if (!canvasContext) {
                return;
              }
              clickX = [];
              clickY = [];
              clickDrag = [];
              paint = false;
              canvasContext.clearRect(0, 0, 28, 28);
              redraw();
              inputElement!.value = '';
            }}
          >
            clear
          </button>
        </div>
      );

      const rect = canvasApp.createRect(
        x,
        y,
        250,
        250,
        undefined,
        thumbs,
        Component() as unknown as HTMLElement,
        {
          classNames: `bg-slate-500 p-4 rounded`,
        },
        false,
        undefined,
        undefined,
        id,
        {
          type: neuralManualDrawableCanvasInputNodeName,
          formValues: {},
        },

        containerNode,
        undefined,
        'object-node rect-node'
      );
      if (!rect.nodeComponent) {
        throw new Error('rect.nodeComponent is undefined');
      }
      rect.resize();

      nodeComponent = rect.nodeComponent;
      if (nodeComponent.nodeInfo) {
        nodeComponent.nodeInfo.formElements = [];
        nodeComponent.nodeInfo.isSettingsPopup = true;
        nodeComponent.nodeInfo.compute = compute;
        nodeComponent.nodeInfo.initializeCompute = initializeCompute;
      }
      return nodeComponent;
    },
  };
};
