import { Flow } from '@devhelpr/visual-programming-system';
import flowData from './example-data/counter.json';
import { loadPyodide } from 'pyodide';
const url = new URL(window.location.href);
import './userWorker';
import {
  NodeInfo,
  RegisterNodeFactoryFunction,
} from '@devhelpr/web-flow-executor';
import { runFlow } from './app/run-flow';
import { getExternalTestNode } from './app/custom-nodes/external-test-node';

const appElement = document.getElementById('app-root')!;
const pageElement = document.getElementById('page-root')!;
const ocwgElement = document.getElementById('ocwg')!;
if (url.pathname === '/run-flow') {
  runFlow();
} else if (url.pathname === '/example') {
  import('./app/flow-app.element').then((module) => {
    const storageProvider = {
      getFlow: async (_flowId: string) => {
        return new Promise<Flow<NodeInfo>>((resolve, _reject) => {
          resolve(flowData as Flow<NodeInfo>);
        });
      },
      saveFlow: async (_flowId: string, _flow: any) => {
        return Promise.resolve();
      },
    };
    appElement.classList.add('hidden');
    pageElement.classList.remove('hidden');
    new module.FlowAppElement('#page-app-root', storageProvider, false, 20, 32);
    //result.destroy();
  });
} else if (url.pathname === '/gl') {
  import('./app/gl-app.element').then((module) => {
    new module.GLAppElement('#app-root');
  });
} else if (url.pathname === '/ocwg') {
  ocwgElement.classList.remove('hidden');
  ocwgElement.classList.add('flex');
  const ocwgExport = document.getElementById('ocwg-export')!;
  import('./app/flow-app.element').then(async (module) => {
    const pyodide = await loadPyodide({
      indexURL: 'pyodide',
    });
    await pyodide.loadPackage('numpy');
    const app = new module.CodeFlowWebAppCanvas();
    app.appRootSelector = '#app-root';
    app.heightSpaceForHeaderFooterToolbars = 100;
    app.widthSpaceForSideToobars = 32;
    app.registerExternalNodes = (
      registerNodeFactory: RegisterNodeFactoryFunction
    ) => {
      registerNodeFactory('test-external-node', getExternalTestNode(pyodide));
    };
    app.onStoreFlow = (_flow, canvasApp) => {
      const ocwg = new module.OCWGExporter({
        canvasApp: canvasApp,
        downloadFile: (_data: any, _name: string, _dataType: string) => {
          //
        },
      });
      const file = ocwg.convertToExportFile();
      ocwgExport.innerHTML = JSON.stringify(file, null, 2);
    };
    app.render();
  });
} else {
  import('./app/flow-app.element').then(async (module) => {
    const pyodide = await loadPyodide({
      indexURL: 'pyodide',
    });
    await pyodide.loadPackage('numpy');
    new module.FlowAppElement(
      '#app-root',
      undefined,
      false,
      100,
      32,
      undefined,
      (registerNodeFactory: RegisterNodeFactoryFunction) => {
        registerNodeFactory('test-external-node', getExternalTestNode(pyodide));
      }
    ); //, 100, 32);
  });
}
