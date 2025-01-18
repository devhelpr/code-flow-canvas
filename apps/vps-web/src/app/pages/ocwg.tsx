import {
  renderElement,
  createJSXElement,
  standardTheme,
} from '@devhelpr/visual-programming-system';
import { RegisterNodeFactoryFunction } from '@devhelpr/web-flow-executor';

// Add Shoelace imports at the top
import '@shoelace-style/shoelace/dist/themes/light.css';
import '@shoelace-style/shoelace/dist/components/color-picker/color-picker.js';
import { getMermaidNode, mermaidNodeName } from '../custom-nodes/mermaid';
import { registerNodes } from '../custom-nodes/register-nodes';

export function ocwgPage() {
  // Add color picker popup
  renderElement(
    <div
      id="color-picker-popup"
      class=" hidden bg-white z-[100000]  fixed w-[300px] h-auto max-w-[calc(100vw-80px)] top-[80px] right-[40px] shadow-lg rounded-lg"
    >
      <div class="flex flex-wrap p-4">
        <h2 class="font-bold text-lg mb-4 w-full">Theme Colors</h2>

        <div class="w-full mb-4">
          <label class="block text-sm font-medium mb-2">Background Color</label>
          <sl-color-picker
            id="background-color"
            format="hex"
            size="small"
            label="Background"
            value="#336699"
          ></sl-color-picker>
        </div>

        <div class="w-full mb-4">
          <label class="block text-sm font-medium mb-2">Node Background</label>
          <sl-color-picker
            id="node-background-color"
            format="hex"
            size="small"
            label="Node Background"
            value="#113366"
          ></sl-color-picker>
        </div>
      </div>
    </div>,
    document.body
  );

  // Original OCWG popup
  renderElement(
    <div
      id="ocwg"
      class="hidden bg-white z-[50000] overflow-hidden fixed w-[384px] h-[384px] max-w-[calc(100vw-80px)] bottom-[80px] right-[40px] grid grid-rows-[auto_1fr]"
    >
      <div class="flex flex-wrap">
        <h1 class="font-bold text-xl p-2">OpenCanvas OCIF 0.2 (WiP)</h1>
        <button
          id="ocwg-copy-to-clipboard"
          title="Copy to clipboard"
          class="ml-auto icon icon-content_copy"
        ></button>
        <button
          id="ocwg-fullscreen"
          title="Fullscreen toggle"
          class="ml-2 icon icon-fullscreen"
        ></button>
        <button
          id="theme-settings"
          title="Theme Settings"
          class="ml-2 mr-3 icon icon-palette"
        ></button>
      </div>
      <div
        id="ocwg-export"
        class="flex whitespace-pre font-mono overflow-auto"
      ></div>
    </div>,
    document.body
  );

  const ocwgElement = document.getElementById('ocwg')!;
  const colorPickerPopup = document.getElementById('color-picker-popup')!;
  ocwgElement.classList.remove('hidden');
  ocwgElement.classList.add('flex');
  const ocwgExport = document.getElementById('ocwg-export')!;

  // Show/hide color picker popup
  document.getElementById('theme-settings')?.addEventListener('click', () => {
    colorPickerPopup.classList.toggle('hidden');
  });

  import('../flow-app.element').then(async (module) => {
    const app = new module.CodeFlowWebAppCanvas();
    app.appRootSelector = '#app-root';
    app.heightSpaceForHeaderFooterToolbars = 100;
    app.widthSpaceForSideToobars = 32;

    app.theme = { ...standardTheme };
    app.theme.background = 'bg-[#336699]';
    app.theme.backgroundAsHexColor = '#336699';
    app.theme.nodeBackground = 'bg-[#113366]';

    app.registerExternalNodes = registerNodes;

    // Add color picker change handlers
    const backgroundPicker = document.getElementById('background-color') as any;
    const nodeBackgroundPicker = document.getElementById(
      'node-background-color'
    ) as any;

    backgroundPicker?.addEventListener('sl-change', (event: any) => {
      const color = event.target.value;
      if (app.theme) {
        app.theme.background = `bg-[${color}]`;
        app.theme.backgroundAsHexColor = color;
      }
      // Trigger re-render if needed
      if (app.updateTheme) {
        app.updateTheme();
      }
    });

    nodeBackgroundPicker?.addEventListener('sl-change', (event: any) => {
      const color = event.target.value;
      if (app.theme) {
        app.theme.nodeBackground = `bg-[${color}]`;
      }
      // Trigger re-render if needed
      if (app.updateTheme) {
        app.updateTheme();
      }
    });

    // Rest of the existing code...
    let currentOcwgExport = '';
    ocwgElement
      .querySelector('#ocwg-copy-to-clipboard')
      ?.addEventListener('click', () => {
        if (currentOcwgExport) {
          navigator.clipboard.writeText(currentOcwgExport);
        }
      });

    let isFullscreen = false;
    ocwgElement
      .querySelector('#ocwg-fullscreen')
      ?.addEventListener('click', () => {
        const button = ocwgElement.querySelector('#ocwg-fullscreen')!;
        isFullscreen = !isFullscreen;
        if (isFullscreen) {
          ocwgElement.classList.remove('w-[384px]');
          ocwgElement.classList.remove('h-[384px]');
          ocwgElement.classList.add('w-[calc(100vw-80px)]');
          ocwgElement.classList.add('h-[calc(100vh-160px)]');

          button.classList.remove('icon-fullscreen');
          button.classList.add('icon-fullscreen_exit');
        } else {
          ocwgElement.classList.remove('w-[calc(100vw-80px)]');
          ocwgElement.classList.remove('h-[calc(100vh-160px)]');
          ocwgElement.classList.add('w-[384px]');
          ocwgElement.classList.add('h-[384px]');

          button.classList.remove('icon-fullscreen_exit');
          button.classList.add('icon-fullscreen');
        }
      });

    app.onStoreFlow = (_flow, canvasApp, getNodeTaskFactory) => {
      const ocwg = new module.OCWGExporter(
        {
          canvasApp: canvasApp,
          downloadFile: (_data: any, _name: string, _dataType: string) => {
            //
          },
        },
        getNodeTaskFactory
      );
      const file = ocwg.convertToExportFile();
      currentOcwgExport = JSON.stringify(file, null, 2);
      ocwgExport.innerHTML = '';
      renderElement(
        <div class="border-t border-solid border-slate-200">
          {JSON.stringify(file, null, 2)
            .split(/\r?\n|\r|\n/g)
            .map((line: string, index: number) => (
              <div class="relative">
                <span
                  class="absolute px-2 text-right w-16 bg-slate-200 after:content-[attr(data-line-number)] text-slate-500 select-none"
                  data-line-number={index + 1}
                ></span>
                <span class="ml-12  pl-5">{line}</span>
              </div>
            ))}
        </div>,
        ocwgExport
      );
    };
    app.render();
  });
}
