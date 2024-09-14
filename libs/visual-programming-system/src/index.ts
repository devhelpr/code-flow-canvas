export interface JSXElement<P = any, T = string> {
  type: T;
  props: P;
}

type Tag = string | ((props: any, children: any[]) => HTMLElement);

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace JSX {
    // eslint-disable-next-line @typescript-eslint/no-empty-interface
    interface Element extends JSXElement<unknown, Tag> {}
    interface IntrinsicElements {
      [elemName: string]: unknown;
    }
  }
}

export * from './camera';
export * from './components';
export * from './constants';
export * from './interaction-state-machine';
export * from './interfaces';
export * from './reactivity';
export * from './types';
export * from './utils';
export * from './canvas-app';
export * from './utils/bezier';
export * from './components/utils/bezier-math';
export * from './spatial-partitioning';
export * from './constants/measures';
export * from './components/utils/calculate-cubic-control-points';
export * from './utils/thumbs';
export { getLinePoints } from './components/line-connection';
export { Rect } from './components/rect';
export { RectThumb } from './components/rect-thumb';
export * from './canvas-app/flow-canvas-instance';
export * from './components/utils/calculate-connector-thumbs';
export * from './interfaces/composition';
export * from './canvas-app/context-app-instance';
export * from './themes/standard';
export * from './interfaces/theme';
export * from './enums/canvas-action';
export type { BaseNodeInfo } from './types/base-node-info';
export * from './utils/create-rect-node';
export type { InitialValues } from './types/values';
export * from './forms/FormField';
export * from './forms/IFormsComponent';
export * from './forms/form-component';
export * from './forms/form-fields/field';
export * from './interfaces/node-task-registry';
export * from './constants/thumbConstraints';
export * from './utils/getFormattedValue';
export * from './utils/replace-values';
export * from './utils/create-form-dialog';
export * from './import/import-to-canvas';
export * from './utils/get-node-connection-pairs';
export * from './utils/node-flow-queries';
