const url = new URL(window.location.href);
import './userWorker';
import { RegisterNodeFactoryFunction } from '@devhelpr/web-flow-executor';
import { runFlow } from './app/run-flow';
import { ocwgPage } from './app/pages/ocwg';
import { pythonPage } from './app/pages/python';
import { examplePage } from './app/pages/example';

if (url.pathname === '/run-flow') {
  runFlow();
} else if (url.pathname === '/example') {
  examplePage();
} else if (url.pathname === '/gl') {
  import('./app/gl-app.element').then((module) => {
    new module.GLAppElement('#app-root');
  });
} else if (url.pathname === '/ocwg') {
  ocwgPage();
} else if (url.pathname === '/python') {
  pythonPage();
} else {
  import('./app/flow-app.element').then(async (module) => {
    new module.FlowAppElement(
      '#app-root',
      undefined,
      false,
      100,
      32,
      undefined,
      (_registerNodeFactory: RegisterNodeFactoryFunction) => {
        //registerNodeFactory('test-external-node', getExternalTestNode(pyodide));
      }
    ); //, 100, 32);
  });
}
