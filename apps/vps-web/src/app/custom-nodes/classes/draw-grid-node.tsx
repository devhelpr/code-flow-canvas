import {
  createElement,
  createJSXElement,
  FlowNode,
  IComputeResult,
  renderElement,
} from '@devhelpr/visual-programming-system';
import { getRunIndex, NodeInfo, runNode } from '@devhelpr/web-flow-executor';

import { BaseRectNode } from './base-rect-node-class';

class Label extends HTMLElement {
  constructor() {
    super();
    const shadowRoot = this.attachShadow({ mode: 'open' });

    renderElement(
      <div part="label">
        <slot name="label-text">Test</slot>
      </div>,
      shadowRoot
    );
  }
}

customElements.define('draw-grid-label', Label);

interface GridDrawSettings {
  fadeRadius: number;
  fadePower: number;
  gamma: number;
  gridSize: number;
}

class GridDraw {
  private grid: HTMLDivElement[][] = [];
  public gridValues: number[][] = []; // Store intensity values (0 to 1)
  public gridColors: [number, number, number][][] = []; // Store RGB colors
  private isDrawing = false;
  //private GRID_SIZE = 28; //64;
  //private readonly MIN_CELL_SIZE = 2; // Minimum cell size in pixels
  private readonly BG_COLOR: [number, number, number] = [255, 255, 255]; // White background
  private gridContainer: HTMLDivElement;
  private clearButton: HTMLButtonElement | undefined;
  private currentColor: [number, number, number] = [0, 0, 0]; // Default black

  private rectNode: BaseRectNode;

  // Configurable brush parameters
  private brushParams: GridDrawSettings = {
    fadeRadius: 5, // 11x11 brush (5 cells in each direction from center)
    fadePower: 1.0,
    gamma: 2.0,
    gridSize: 28,
  };

  private readonly COLOR_PRESETS: [number, number, number][] = [
    [0, 0, 0], // black
    [255, 255, 255], // white
    // Reds & Pinks
    [214, 39, 40], // d3 red (darker)
    [239, 68, 68], // red-500
    [236, 72, 153], // pink-500

    // Oranges & Browns
    [140, 86, 75], // d3 brown
    [255, 127, 14], // d3 orange (bright)
    [249, 115, 22], // orange-500
    [245, 158, 11], // amber-500

    // Greens
    [44, 160, 44], // d3 green (darker)
    [34, 197, 94], // green-500
    [20, 184, 166], // teal-500

    // Blues & Cyans
    [31, 119, 180], // d3 blue (darker)
    [59, 130, 246], // blue-500
    [99, 102, 241], // indigo-500
    [6, 182, 212], // cyan-500

    // Purples
    [168, 85, 247], // purple-500
    [148, 103, 189], // d3 purple
  ];

  constructor(
    gridContainer: HTMLDivElement,
    rectNode: BaseRectNode,
    settings: GridDrawSettings
  ) {
    this.rectNode = rectNode;
    this.gridContainer = gridContainer as HTMLDivElement;
    this.brushParams = settings;

    if (!this.gridContainer) {
      console.error('Grid container not found!');
      return;
    }

    this.setupGrid();
    //this.setupControlPanel();
    this.addEventListeners();
  }

  private setupGrid() {
    // Clear any existing content
    this.gridContainer.innerHTML = '';

    // Set grid template
    this.gridContainer.style.gridTemplateColumns = `repeat(${this.brushParams.gridSize}, 1fr)`;
    this.gridContainer.style.gridTemplateRows = `repeat(${this.brushParams.gridSize}, 1fr)`;

    // Initialize grid arrays
    this.gridValues = Array(this.brushParams.gridSize)
      .fill(0)
      .map(() => Array(this.brushParams.gridSize).fill(0));
    this.grid = Array(this.brushParams.gridSize)
      .fill(null)
      .map(() => Array(this.brushParams.gridSize).fill(null));
    this.gridColors = Array(this.brushParams.gridSize)
      .fill(null)
      .map(() => Array(this.brushParams.gridSize).fill([...this.BG_COLOR]));

    // Create grid cells
    for (let y = 0; y < this.brushParams.gridSize; y++) {
      for (let x = 0; x < this.brushParams.gridSize; x++) {
        const cell = document.createElement('div');
        cell.className = 'draw-grid-cell';
        cell.setAttribute('data-disable-interaction', 'true');
        this.gridContainer.appendChild(cell);
        this.grid[y][x] = cell;
      }
    }
    // const buttonElement = document.createElement('button');
    // buttonElement.innerHTML = 'Clear Grid';
    // buttonElement.className = 'control-button';
    // buttonElement.id = 'clearButtonGrid';
    // this.gridContainer.appendChild(buttonElement);
    // <button id="clearButton" class="control-button">Clear Grid</button>
    console.log('Grid setup complete');
  }

  public setupControlPanel(panel: HTMLDivElement) {
    //const panel = document.createElement('div');
    panel.className = 'control-panel';

    // Create a container for the controls that can be collapsed
    const controlsContainer = document.createElement('div');
    controlsContainer.className = 'controls-container';

    renderElement(
      <element:Fragment>
        <div class="control-group">
          <draw-grid-label text="Draw Grid">
            <slot name="label-text">Hello webcomponent</slot>
          </draw-grid-label>
          <label>Brush Color</label>
          <input type="color" id="colorPicker" value="#000000" />
          <div class="color-presets">
            {this.COLOR_PRESETS.map((color, _index) => (
              <button
                class="color-preset-button"
                style={`background-color: rgb(${color[0]}, ${color[1]}, ${color[2]})`}
                data-color-index="${index}"
                title="Color ${index + 1}"
              ></button>
            ))}
          </div>
        </div>
        <div class="control-group">
          <label>
            Brush Size ({this.brushParams.fadeRadius * 2 + 1}x
            {this.brushParams.fadeRadius * 2 + 1})
          </label>
          <input
            type="range"
            id="fadeRadius"
            min="2"
            max="8"
            step="1"
            value="{
          this.brushParams.fadeRadius
        }"
          />
        </div>
        <div class="control-group">
          <label>Fade Power (${this.brushParams.fadePower.toFixed(1)})</label>
          <input
            type="range"
            id="fadePower"
            min="0.1"
            max="2"
            step="0.1"
            value="{
          this.brushParams.fadePower
        }"
          />
        </div>
        <div class="control-group">
          <label>Color Intensity (${this.brushParams.gamma.toFixed(1)})</label>
          <input
            type="range"
            id="gamma"
            min="0.1"
            max="4"
            step="0.1"
            value="{
          this.brushParams.gamma
        }"
          />
        </div>
        <div class="control-group">
          <label>Grid size (${this.brushParams.gridSize.toFixed(0)})</label>
          <input
            type="range"
            id="GRID_SIZE"
            min="16"
            max="64"
            step="1"
            value="{
          this.brushParams.gridSize
        }"
          />
        </div>
        <button id="clearButton" class="control-button">
          Clear Grid
        </button>
      </element:Fragment>,

      controlsContainer
    );

    panel.appendChild(controlsContainer);
    //document.body.appendChild(panel);

    // Add event listeners for color preset buttons
    const colorPresetButtons = panel.querySelectorAll('.color-preset-button');
    colorPresetButtons.forEach((button) => {
      button.addEventListener('click', (e) => {
        const target = e.target as HTMLButtonElement;
        const colorIndex = parseInt(target.dataset.colorIndex || '0');
        const color = this.COLOR_PRESETS[colorIndex];
        this.currentColor = [...color];

        // Update color picker to match selected preset
        const colorPicker = document.getElementById(
          'colorPicker'
        ) as HTMLInputElement;
        const hexColor =
          '#' + color.map((c) => c.toString(16).padStart(2, '0')).join('');
        colorPicker.value = hexColor;
      });
    });

    // Add event listeners for sliders and color picker
    const fadeRadiusSlider = document.getElementById(
      'fadeRadius'
    ) as HTMLInputElement;
    const fadePowerSlider = document.getElementById(
      'fadePower'
    ) as HTMLInputElement;
    const gammaSlider = document.getElementById('gamma') as HTMLInputElement;
    const colorPicker = document.getElementById(
      'colorPicker'
    ) as HTMLInputElement;

    const GRID_SIZE = document.getElementById('GRID_SIZE') as HTMLInputElement;

    this.clearButton = document.getElementById(
      'clearButton'
    ) as HTMLButtonElement;

    if (
      !fadeRadiusSlider ||
      !fadePowerSlider ||
      !gammaSlider ||
      !colorPicker ||
      !GRID_SIZE ||
      !this.clearButton
    ) {
      console.error('Control elements not found!');
      return;
    }

    colorPicker.addEventListener('input', (e) => {
      const color = (e.target as HTMLInputElement).value;
      const rgb = this.hexToRgb(color);
      if (rgb) {
        this.currentColor = rgb;
      }
    });

    fadeRadiusSlider.addEventListener('input', (e) => {
      this.brushParams.fadeRadius = parseInt(
        (e.target as HTMLInputElement).value
      );
      fadeRadiusSlider.previousElementSibling!.textContent = `Brush Size (${
        this.brushParams.fadeRadius * 2 + 1
      }x${this.brushParams.fadeRadius * 2 + 1})`;
      this.onStorageChange?.(this.brushParams);
    });

    fadePowerSlider.addEventListener('input', (e) => {
      this.brushParams.fadePower = parseFloat(
        (e.target as HTMLInputElement).value
      );
      fadePowerSlider.previousElementSibling!.textContent = `Fade Power (${this.brushParams.fadePower.toFixed(
        1
      )})`;
      this.onStorageChange?.(this.brushParams);
    });

    gammaSlider.addEventListener('input', (e) => {
      this.brushParams.gamma = parseFloat((e.target as HTMLInputElement).value);
      gammaSlider.previousElementSibling!.textContent = `Color Intensity (${this.brushParams.gamma.toFixed(
        1
      )})`;
      this.onStorageChange?.(this.brushParams);
    });

    GRID_SIZE.addEventListener('input', (e) => {
      this.brushParams.gridSize = parseInt(
        (e.target as HTMLInputElement).value
      );
      GRID_SIZE.previousElementSibling!.textContent = `Grid size (${this.brushParams.gridSize.toFixed(
        1
      )})`;
      this.setupGrid();
      this.onStorageChange?.(this.brushParams);
    });
    this.clearButton.addEventListener('click', () => this.clearGrid());

    console.log('Control panel setup complete');
  }

  private hexToRgb(hex: string): [number, number, number] | null {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result
      ? [
          parseInt(result[1], 16),
          parseInt(result[2], 16),
          parseInt(result[3], 16),
        ]
      : null;
  }

  // private updateGridSize() {
  //   const viewportMin = Math.min(window.innerWidth, window.innerHeight);
  //   const maxGridSize = Math.floor(viewportMin * 0.9); // 90% of viewport's smaller dimension
  //   const cellSize = Math.max(this.MIN_CELL_SIZE, maxGridSize / this.GRID_SIZE);
  //   const totalSize = cellSize * this.GRID_SIZE;

  //   this.gridContainer.style.width = `${totalSize}px`;
  //   this.gridContainer.style.height = `${totalSize}px`;
  // }

  private addEventListeners() {
    const handleStart = (e: MouseEvent | TouchEvent) => {
      if (e.shiftKey) return;
      if (!this.rectNode.rectInstance?.isSelected()) {
        this.rectNode.rectInstance?.selectNode();
        //return;
      }

      e.preventDefault();
      this.isDrawing = true;

      if (e instanceof MouseEvent) {
        this.handleDraw(e);
      } else {
        const touch = e.touches[0];
        this.handleDraw(touch);
      }
      return false;
    };

    const handleMove = (e: MouseEvent | TouchEvent) => {
      if (e.shiftKey) return;
      e.preventDefault();
      if (!this.isDrawing) return;
      if (e instanceof MouseEvent) {
        this.handleDraw(e);
      } else {
        const touch = e.touches[0];
        this.handleDraw(touch);
      }
      if (this.onDrawCell) {
        this.onDrawCell();
      }
      return false;
    };

    const handleEnd = (e: MouseEvent | TouchEvent) => {
      e.preventDefault();
      console.log('handleEnd');
      this.isDrawing = false;
      if (this.onDrawCell) {
        this.onDrawCell();
      }
      return false;
    };

    // Mouse events
    this.gridContainer.addEventListener('mousedown', handleStart);
    this.gridContainer.addEventListener('mousemove', handleMove);
    this.gridContainer.addEventListener('mouseup', handleEnd);

    // Touch events
    this.gridContainer.addEventListener('touchstart', handleStart, {
      passive: false,
    });
    this.gridContainer.addEventListener('touchmove', handleMove, {
      passive: false,
    });
    this.gridContainer.addEventListener('touchend', handleEnd, {
      passive: false,
    });

    // Handle window resize
    // window.addEventListener('resize', () => {
    //   this.updateGridSize();
    // });
  }

  public clearGrid() {
    // Reset all grid values and colors
    for (let y = 0; y < this.brushParams.gridSize; y++) {
      for (let x = 0; x < this.brushParams.gridSize; x++) {
        this.gridValues[y][x] = 0;
        this.gridColors[y][x] = [...this.BG_COLOR];
        this.updateCellColor(x, y);
      }
    }
    if (this.onDrawCell) {
      this.onDrawCell();
    }
  }

  private handleDraw(e: MouseEvent | Touch) {
    const rect = this.gridContainer.getBoundingClientRect();
    const x = Math.floor(
      ((e.clientX - rect.left) / rect.width) * this.brushParams.gridSize
    );
    const y = Math.floor(
      ((e.clientY - rect.top) / rect.height) * this.brushParams.gridSize
    );

    if (
      x >= 0 &&
      x < this.brushParams.gridSize &&
      y >= 0 &&
      y < this.brushParams.gridSize
    ) {
      // Set center cell to current color
      this.gridValues[y][x] = 1;
      this.gridColors[y][x] = [...this.currentColor] as [
        number,
        number,
        number
      ];
      this.updateCellColor(x, y);

      // Create fade effect for surrounding cells
      for (
        let dy = -this.brushParams.fadeRadius;
        dy <= this.brushParams.fadeRadius;
        dy++
      ) {
        for (
          let dx = -this.brushParams.fadeRadius;
          dx <= this.brushParams.fadeRadius;
          dx++
        ) {
          if (dx === 0 && dy === 0) continue;

          const newX = x + dx;
          const newY = y + dy;

          if (
            newX >= 0 &&
            newX < this.brushParams.gridSize &&
            newY >= 0 &&
            newY < this.brushParams.gridSize
          ) {
            const distance = Math.sqrt(dx * dx + dy * dy);
            const maxDistance = Math.sqrt(
              this.brushParams.fadeRadius * this.brushParams.fadeRadius * 2
            );

            // Calculate fade intensity using current brush parameters
            const normalizedDistance = Math.min(1, distance / maxDistance);
            const fadeIntensity = Math.max(
              0,
              1 - Math.pow(normalizedDistance, this.brushParams.fadePower)
            );

            // Get current cell color and value
            const currentValue = this.gridValues[newY][newX];
            const currentColor = this.gridColors[newY][newX];

            // Calculate blend factor based on both current value and new intensity
            const blendedValue = Math.max(currentValue, fadeIntensity);

            if (blendedValue > currentValue) {
              // Blend colors based on relative strengths
              const currentStrength = Math.pow(
                currentValue,
                this.brushParams.gamma
              );
              const newStrength = Math.pow(
                fadeIntensity,
                this.brushParams.gamma
              );
              const totalStrength = currentStrength + newStrength;

              // Calculate weighted average of colors
              const blendedColor: [number, number, number] = [
                Math.round(
                  (currentColor[0] * currentStrength +
                    this.currentColor[0] * newStrength) /
                    totalStrength
                ),
                Math.round(
                  (currentColor[1] * currentStrength +
                    this.currentColor[1] * newStrength) /
                    totalStrength
                ),
                Math.round(
                  (currentColor[2] * currentStrength +
                    this.currentColor[2] * newStrength) /
                    totalStrength
                ),
              ];

              this.gridValues[newY][newX] = blendedValue;
              this.gridColors[newY][newX] = blendedColor;
              this.updateCellColor(newX, newY);
            }
          }
        }
      }
    }
  }

  private updateCellColor(x: number, y: number) {
    const value = this.gridValues[y][x];
    const color = this.gridColors[y][x];

    // Apply gamma correction to the value for better visual appearance
    const intensity = Math.pow(value, this.brushParams.gamma);

    // Interpolate between background color and the cell's color
    const r = Math.floor(
      this.BG_COLOR[0] + (color[0] - this.BG_COLOR[0]) * intensity
    );
    const g = Math.floor(
      this.BG_COLOR[1] + (color[1] - this.BG_COLOR[1]) * intensity
    );
    const b = Math.floor(
      this.BG_COLOR[2] + (color[2] - this.BG_COLOR[2]) * intensity
    );

    this.grid[y][x].style.backgroundColor = `rgb(${r}, ${g}, ${b})`;
  }

  onDrawCell: undefined | (() => void) = undefined;
  onStorageChange: undefined | ((storageObject: GridDrawSettings) => void) =
    undefined;
}

export class DrawGridNode extends BaseRectNode {
  static readonly nodeTypeName = 'draw-grid-node';
  static readonly nodeTitle = 'Draw grid';
  static readonly category = 'Default';
  static readonly text = 'draw grid';
  static readonly disableManualResize: boolean = true;

  drawGrid: GridDraw | undefined;

  getSettingsPopup = (popupContainer: HTMLElement) => {
    const popupInstance = createElement(
      'div',
      { class: 'max-h-[380px]  h-[fit-content]  p-3 pb-6' },
      popupContainer,
      undefined
    );
    if (popupInstance?.domElement && this.drawGrid) {
      this.drawGrid.setupControlPanel(
        popupInstance.domElement as HTMLDivElement
      );
    }
    return popupInstance;
  };

  compute = (
    input: string,
    _loopIndex?: number,
    _payload?: any
  ): Promise<IComputeResult> => {
    console.log('drawgrid compute', input);
    return new Promise<IComputeResult>((resolve) => {
      if (this.drawGrid) {
        resolve({
          result: this.drawGrid.gridValues,
          output: this.drawGrid.gridValues,
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
  onDrawCell = () => {
    console.log('onDrawCell', this.drawGrid);
    // if (this.changeTimeout) {
    //   clearTimeout(this.changeTimeout);
    //   this.changeTimeout = null;
    // }

    // this.changeTimeout = setTimeout(() => {
    //   this.changeTimeout = null;
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
        JSON.stringify(this.drawGrid?.gridValues ?? []),
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
        undefined,
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
    //}, 50);
  };

  onStorageChange = (storageObject: GridDrawSettings) => {
    if (this.node && this.node.nodeInfo) {
      (this.node.nodeInfo as any).drawGridSettings = storageObject;
      this.updated();
    }
  };

  childElementSelector = '.child-node-wrapper > *:first-child';
  render = (node: FlowNode<NodeInfo>) => {
    //const nodeInfo = node.nodeInfo as any;
    console.log('render rect-node', node.width, node.height);
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
            this.drawGrid = new GridDraw(
              element as HTMLDivElement,
              this,
              (node.nodeInfo as any)?.drawGridSettings ?? {
                fadeRadius: 5, // 11x11 brush (5 cells in each direction from center)
                fadePower: 1.0,
                gamma: 2.0,
                gridSize: 28,
              }
            );

            this.drawGrid.onDrawCell = this.onDrawCell;
            this.drawGrid.onStorageChange = this.onStorageChange;
          }}
          class={`draw-grid  text-center whitespace-nowrap`}
          data-disable-interaction={true}
        ></div>
        <button class="control-button" click={() => this.drawGrid?.clearGrid()}>
          Clear Grid
        </button>
      </div>
    );
  };
}
