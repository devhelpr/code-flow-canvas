const url = new URL(window.location.href);
import './userWorker';
if (url.pathname === '/gl') {
  import('./app/gl-app.element').then((module) => {
    new module.GLAppElement('#app-root');
  });
} else {
  import('./app/flow-app.element').then((module) => {
    new module.FlowAppElement('#app-root');
  });
}
