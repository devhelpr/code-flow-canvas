import { createJSXElement } from '@devhelpr/visual-programming-system';

const COLOR_PRESETS: [number, number, number][] = [
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

export interface CorePropertiesSetupEditorProps {
  strokeColor: string;
  fillColor: string;
  onStrokeColorChange: (color: string) => void;
  onFillColorChange: (color: string) => void;
}
export const CorePropertiesSetupEditor = (
  props: CorePropertiesSetupEditorProps
) => {
  let strokeColorElement: HTMLInputElement | null = null;
  let fillColorElement: HTMLInputElement | null = null;
  const onStrokeColorInputChange = (event: MouseEvent) => {
    const color = (event.target as HTMLButtonElement).value;
    props.onStrokeColorChange(color);
  };
  const onStrokeColorChange = (event: MouseEvent) => {
    const colorIndex = (event.target as HTMLInputElement).getAttribute(
      'data-color-index'
    );
    if (!colorIndex) return;
    const color = COLOR_PRESETS[parseInt(colorIndex)];
    const colorHex = `#${color[0].toString(16).padStart(2, '0')}${color[1]
      .toString(16)
      .padStart(2, '0')}${color[2].toString(16).padStart(2, '0')}`;
    props.onStrokeColorChange(colorHex);

    if (strokeColorElement) {
      (strokeColorElement as HTMLInputElement).value = colorHex;
    }
  };

  const onFillColorInputChange = (event: MouseEvent) => {
    const color = (event.target as HTMLButtonElement).value;
    props.onFillColorChange(color);
  };
  const onFillColorChange = (event: MouseEvent) => {
    const colorIndex = (event.target as HTMLInputElement).getAttribute(
      'data-color-index'
    );
    if (!colorIndex) return;
    const color = COLOR_PRESETS[parseInt(colorIndex)];
    const colorHex = `#${color[0].toString(16).padStart(2, '0')}${color[1]
      .toString(16)
      .padStart(2, '0')}${color[2].toString(16).padStart(2, '0')}`;
    props.onFillColorChange(colorHex);

    if (fillColorElement) {
      (fillColorElement as HTMLInputElement).value = colorHex;
    }
  };

  return (
    <element:Fragment>
      <div class="control-group">
        <label>Stroke color</label>
        <input
          type="color"
          id="strokeColorPicker"
          value={props.strokeColor}
          input={onStrokeColorInputChange}
          getElement={(element: HTMLInputElement) => {
            strokeColorElement = element;
          }}
        />
        <div class="color-presets">
          {COLOR_PRESETS.map((color, index) => (
            <button
              data-control="strokeColorPicker"
              class="color-preset-button"
              style={`background-color: rgb(${color[0]}, ${color[1]}, ${color[2]})`}
              data-color-index={`${index}`}
              title={`Color ${index + 1}`}
              click={onStrokeColorChange}
            ></button>
          ))}
        </div>
      </div>
      <div class="control-group">
        <label>Fill color</label>
        <input
          type="color"
          id="fillColorPicker"
          value={props.fillColor}
          onInput={onFillColorInputChange}
          getElement={(element: HTMLInputElement) => {
            fillColorElement = element;
          }}
        />
        <div class="color-presets">
          {COLOR_PRESETS.map((color, index) => (
            <button
              data-control="fillColorPicker"
              class="color-preset-button"
              style={`background-color: rgb(${color[0]}, ${color[1]}, ${color[2]})`}
              data-color-index={`${index}`}
              title={`Color ${index + 1}`}
              click={onFillColorChange}
            ></button>
          ))}
        </div>
      </div>
    </element:Fragment>
  );
};
