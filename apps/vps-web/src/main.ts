import { Flow } from '@devhelpr/visual-programming-system';
import flowData from './example-data/counter.json';

const url = new URL(window.location.href);
import './userWorker';
import { NodeInfo } from '@devhelpr/web-flow-executor';
import { runFlow } from './app/run-flow';

const appElement = document.getElementById('app-root')!;
const pageElement = document.getElementById('page-root')!;
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
    new module.FlowAppElement('#page-app-root', storageProvider, true, 20, 32);
    //result.destroy();
  });
} else if (url.pathname === '/gl') {
  import('./app/gl-app.element').then((module) => {
    new module.GLAppElement('#app-root');
  });
} else {
  import('./app/flow-app.element').then((module) => {
    new module.FlowAppElement('#app-root', undefined, false, 100, 32); //, 100, 32);
  });
}
