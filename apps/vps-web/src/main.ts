import { Flow } from '@devhelpr/visual-programming-system';
import flowData from './example-data/counter.json';

const url = new URL(window.location.href);
import './userWorker';
import { NodeInfo } from '@devhelpr/web-flow-executor';
if (url.pathname === '/example') {
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

    new module.FlowAppElement('#app-root', storageProvider, true);
    //result.destroy();
  });
} else if (url.pathname === '/gl') {
  import('./app/gl-app.element').then((module) => {
    new module.GLAppElement('#app-root');
  });
} else {
  import('./app/flow-app.element').then((module) => {
    new module.FlowAppElement('#app-root');
  });
}
