import {
  createElement,
  createJSXElement,
  FlowNode,
  IComputeResult,
  renderElement,
} from '@devhelpr/visual-programming-system';
import { getRunIndex, NodeInfo, runNode } from '@devhelpr/web-flow-executor';

import { BaseRectNode } from './base-rect-node-class';

interface WebcamViewerSettings {
  fadeRadius: number;
  fadePower: number;
  gamma: number;
  gridSize: number;
}

class WebcamViewer {
  //private rectNode: BaseRectNode;
  private videoElement: HTMLVideoElement | null = null;
  private stream: MediaStream | null = null;
  private isStreaming = false;
  private canvas: HTMLCanvasElement | null = null;
  private frameInterval: number | null = null;
  private readonly FPS = 30;
  private readonly FRAME_INTERVAL = 1000 / this.FPS;

  constructor(
    gridContainer: HTMLDivElement,
    _rectNode: BaseRectNode,
    _settings: WebcamViewerSettings
  ) {
    //this.rectNode = rectNode;
    this.initializeWebcam(gridContainer);
  }

  private async initializeWebcam(container: HTMLDivElement) {
    try {
      // Create video element
      this.videoElement = document.createElement('video');
      this.videoElement.autoplay = true;
      this.videoElement.playsInline = true;
      this.videoElement.style.width = '100%';
      this.videoElement.style.height = '100%';
      this.videoElement.style.objectFit = 'cover';

      // Create canvas for frame capture
      this.canvas = document.createElement('canvas');
      this.canvas.style.display = 'none';

      // Add elements to container
      container.appendChild(this.videoElement);
      container.appendChild(this.canvas);

      // Get webcam stream
      this.stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: false,
      });

      // Attach stream to video element
      if (this.videoElement) {
        this.videoElement.srcObject = this.stream;
        this.isStreaming = true;

        // Start frame capture
        this.startFrameCapture();
      }
    } catch (error) {
      console.error('Error accessing webcam:', error);
    }
  }

  private startFrameCapture() {
    if (this.frameInterval) {
      clearInterval(this.frameInterval);
    }

    this.frameInterval = window.setInterval(() => {
      if (this.videoElement && this.canvas && this.isStreaming) {
        // Set canvas dimensions to match video
        this.canvas.width = this.videoElement.videoWidth;
        this.canvas.height = this.videoElement.videoHeight;
        if (this.canvas.width === 0 || this.canvas.height === 0) {
          return;
        }
        // Draw current video frame to canvas
        const ctx = this.canvas.getContext('2d', { willReadFrequently: true });
        if (ctx) {
          ctx.drawImage(this.videoElement, 0, 0);

          // Get image data as RGBA array
          const imageData = ctx.getImageData(
            0,
            0,
            this.canvas.width,
            this.canvas.height
          );
          const rgbaArray = imageData.data;

          // Convert flat array to 2D array
          const frameData: number[][] = [];
          for (let y = 0; y < this.canvas.height; y++) {
            const row: number[] = [];
            for (let x = 0; x < this.canvas.width; x++) {
              const i = (y * this.canvas.width + x) * 4;
              row.push(
                rgbaArray[i], // R
                rgbaArray[i + 1], // G
                rgbaArray[i + 2], // B
                rgbaArray[i + 3] // A
              );
            }
            frameData.push(row);
          }

          // Call the callback with frame data
          if (this.onReceiveWebcamFrame) {
            this.onReceiveWebcamFrame(frameData);
          }
        }
      }
    }, this.FRAME_INTERVAL);
  }

  public cleanup() {
    if (this.frameInterval) {
      clearInterval(this.frameInterval);
      this.frameInterval = null;
    }

    if (this.stream) {
      this.stream.getTracks().forEach((track) => track.stop());
      this.stream = null;
      this.isStreaming = false;
    }

    if (this.videoElement) {
      this.videoElement.srcObject = null;
      this.videoElement.remove();
      this.videoElement = null;
    }

    if (this.canvas) {
      this.canvas.remove();
      this.canvas = null;
    }
  }

  public setupControlPanel(panel: HTMLDivElement) {
    panel.className = 'control-panel';

    const controlsContainer = document.createElement('div');
    controlsContainer.className = 'controls-container';

    renderElement(
      <element:Fragment>
        <div>Webcam Controls</div>
        <button onclick={() => this.toggleWebcam()}>
          {this.isStreaming ? 'Stop Webcam' : 'Start Webcam'}
        </button>
      </element:Fragment>,
      controlsContainer
    );

    panel.appendChild(controlsContainer);
  }

  private async toggleWebcam() {
    if (this.isStreaming) {
      this.cleanup();
    } else {
      if (this.videoElement) {
        await this.initializeWebcam(
          this.videoElement.parentElement as HTMLDivElement
        );
      }
    }
  }

  onReceiveWebcamFrame: undefined | ((frameData: number[][]) => void) =
    undefined;
  onStorageChange: undefined | ((storageObject: WebcamViewerSettings) => void) =
    undefined;
}

export class WebcamViewerNode extends BaseRectNode {
  static readonly nodeTypeName = 'webcam-viewer-node';
  static readonly nodeTitle = 'Webcam viewer';
  static readonly category = 'Default';
  static readonly text = 'webcam viewer';
  static readonly disableManualResize: boolean = true;

  webcamViewer: WebcamViewer | undefined;

  getSettingsPopup = (popupContainer: HTMLElement) => {
    const popupInstance = createElement(
      'div',
      { class: 'max-h-[380px]  h-[fit-content]  p-3 pb-6' },
      popupContainer,
      undefined
    );
    if (popupInstance?.domElement && this.webcamViewer) {
      this.webcamViewer.setupControlPanel(
        popupInstance.domElement as HTMLDivElement
      );
    }
    return popupInstance;
  };

  compute = (
    _input: unknown,
    _loopIndex?: number,
    _payload?: any
  ): Promise<IComputeResult> => {
    return new Promise<IComputeResult>((resolve) => {
      if (this.webcamViewer) {
        resolve({
          result: [],
          output: [],
          followPath: undefined,
        });
      } else {
        resolve({
          result: undefined,
          output: undefined,
          followPath: undefined,
          stop: true,
        });
      }
    });
  };

  changeTimeout: NodeJS.Timeout | null = null;
  onReceiveWebcamFrame = (frameData: number[][]) => {
    // console.log('Received webcam frame:', {
    //   width: frameData[0].length / 4,
    //   height: frameData.length,
    //   samplePixel: frameData[0].slice(0, 4), // Log first pixel's RGBA values
    // });

    if (
      !this.node ||
      !this.canvasAppInstance ||
      !this.createRunCounterContext
    ) {
      return;
    }
    if (this.flowEngine?.runNode) {
      this.flowEngine?.runNode(
        undefined,
        this.node,
        this.canvasAppInstance,
        () => {
          //
        },
        JSON.stringify(frameData),
        undefined,
        undefined,
        getRunIndex(),
        undefined,
        undefined,
        this.createRunCounterContext(false, false),
        false,
        {
          trigger: true,
        }
      );
    } else {
      runNode(
        this.node,
        this.canvasAppInstance,
        () => {
          //
        },
        JSON.stringify(frameData),
        undefined,
        undefined,
        getRunIndex(),
        undefined,
        undefined,
        this.createRunCounterContext(false, false),
        false,
        {
          trigger: true,
        }
      );
    }
  };

  onStorageChange = (storageObject: WebcamViewerSettings) => {
    if (this.node && this.node.nodeInfo) {
      (this.node.nodeInfo as any).drawGridSettings = storageObject;
      this.updated();
    }
  };

  childElementSelector = '.child-node-wrapper > *:first-child';
  render = (node: FlowNode<NodeInfo>) => {
    return (
      <div
        style={`min-width:${node.width ?? 50}px;min-height:${
          node.height ?? 50
        }px;`}
      >
        <div
          getElement={(element: HTMLDivElement) => {
            this.rectElement = element;
          }}
          renderElement={(element: HTMLElement) => {
            this.webcamViewer = new WebcamViewer(
              element as HTMLDivElement,
              this,
              (node.nodeInfo as any)?.drawGridSettings ?? {
                fadeRadius: 5, // 11x11 brush (5 cells in each direction from center)
                fadePower: 1.0,
                gamma: 2.0,
                gridSize: 28,
              }
            );

            this.webcamViewer.onReceiveWebcamFrame = this.onReceiveWebcamFrame;
            this.webcamViewer.onStorageChange = this.onStorageChange;
          }}
          class={`draw-grid  text-center whitespace-nowrap`}
          data-disable-interaction={true}
        ></div>
      </div>
    );
  };
}
