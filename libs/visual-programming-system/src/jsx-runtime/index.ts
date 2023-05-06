import { EventHandler } from '../utils';

export interface JSXElement<P = any, T = string> {
  type: T;
  props: P;
}

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

type Tag = string | ((props: any, children: any[]) => HTMLElement);

type Props = Record<string, string> | null;

type Children = (Node | string)[];

export const jsx = (tag: Tag, props: Props, ...children: Children) => {
  if (typeof tag === 'function') {
    return tag({ ...props }, children);
  }

  const element = document.createElement(tag);
  if (props) {
    Object.entries(props).forEach(([key, val]) => {
      if (key === 'class') {
        element.classList.add(...((val as string) || '').trim().split(' '));
        return;
      } else if (typeof val === 'function') {
        (element as unknown as HTMLElement).addEventListener(
          key,
          val as EventHandler
        );
      } else {
        element.setAttribute(key, val);
      }
    });
  }
  children.forEach((child) => {
    element.append(child);
  });

  return element;
};

export const jsxs = jsx;
