import { RegisterNodeFactoryFunction } from '@devhelpr/web-flow-executor';
import { getExternalTestNode } from '../custom-nodes/external-test-node';

export function pythonPage() {
  import('../flow-app.element').then(async (module) => {
    const app = new module.CodeFlowWebAppCanvas();
    app.flowId = 'test-flow';
    app.appRootSelector = '#app-root';
    app.heightSpaceForHeaderFooterToolbars = 100;
    app.widthSpaceForSideToobars = 32;
    app.registerExternalNodes = (
      registerNodeFactory: RegisterNodeFactoryFunction
    ) => {
      registerNodeFactory('test-external-node', getExternalTestNode());
    };
    //app.clearPresetRegistry = true;
    app.render();
  });
}
