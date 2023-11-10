export interface JSXElement<P = any, T = string> {
  type: T;
  props: P;
}

type Tag = string | ((props: any, children: any[]) => HTMLElement);

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace JSX {
    // eslint-disable-next-line @typescript-eslint/no-empty-interface
    interface Element extends JSXElement<any, Tag> {}
    interface IntrinsicElements {
      [elemName: string]: any;
    }
  }
}

const url = new URL(window.location.href);
if (url.pathname === '/gl') {
  import('./app/gl-app.element').then((module) => {
    new module.GLAppElement('#app-root');
  });
} else {
  import('./app/flow-app.element').then((module) => {
    new module.FlowAppElement('#app-root');
  });
}
