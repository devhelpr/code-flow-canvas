import { RegisterNodeFactoryFunction } from '@devhelpr/web-flow-executor';
import { loadPyodide } from 'pyodide';
import { getExternalTestNode } from '../custom-nodes/external-test-node';

export function pythonPage() {
  import('../flow-app.element').then(async (module) => {
    const pyodide = await loadPyodide({
      indexURL: 'pyodide',
    });
    await pyodide.loadPackage('numpy');
    const app = new module.CodeFlowWebAppCanvas();
    app.flowId = 'python-flow';
    app.appRootSelector = '#app-root';
    app.heightSpaceForHeaderFooterToolbars = 100;
    app.widthSpaceForSideToobars = 32;
    app.registerExternalNodes = (
      registerNodeFactory: RegisterNodeFactoryFunction
    ) => {
      registerNodeFactory('test-external-node', getExternalTestNode(pyodide));
    };
    //app.clearPresetRegistry = true;
    app.render();
  });
}
