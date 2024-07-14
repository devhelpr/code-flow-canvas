import {
  renderElement,
  createJSXElement,
} from '@devhelpr/visual-programming-system';
import { RegisterNodeFactoryFunction } from '@devhelpr/web-flow-executor';

export function ocwgPage() {
  renderElement(
    <div
      id="ocwg"
      class="hidden bg-white z-[50000] overflow-hidden fixed w-[384px] h-[384px] max-w-[calc(100vw-80px)] bottom-[80px] right-[40px] grid grid-rows-[auto_1fr]"
    >
      <div class="flex flex-wrap">
        <h1 class="font-bold text-xl p-2">OpenCanvas(OCWG) WiP Export</h1>
        <button
          id="ocwg-copy-to-clipboard"
          title="Copy to clipboard"
          class="ml-auto icon icon-content_copy"
        ></button>
        <button
          id="ocwg-fullscreen"
          title="Fullscreen toggle"
          class="ml-2 mr-3 icon icon-fullscreen"
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
  ocwgElement.classList.remove('hidden');
  ocwgElement.classList.add('flex');
  const ocwgExport = document.getElementById('ocwg-export')!;
  import('../flow-app.element').then(async (module) => {
    const app = new module.CodeFlowWebAppCanvas();
    app.appRootSelector = '#app-root';
    app.heightSpaceForHeaderFooterToolbars = 100;
    app.widthSpaceForSideToobars = 32;
    app.registerExternalNodes = (
      _registerNodeFactory: RegisterNodeFactoryFunction
    ) => {
      //
    };
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
    app.onStoreFlow = (_flow, canvasApp) => {
      const ocwg = new module.OCWGExporter({
        canvasApp: canvasApp,
        downloadFile: (_data: any, _name: string, _dataType: string) => {
          //
        },
      });
      const file = ocwg.convertToExportFile();
      currentOcwgExport = JSON.stringify(file, null, 2);
      ocwgExport.innerHTML = '';
      //ocwgExport.innerHTML = JSON.stringify(file, null, 2);
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
