import { IFlowCanvasBase } from '../canvas-app/flow-canvas';
import { IConnectionNodeComponent } from '../interfaces';

export interface IMetaField {
  propertyName?: string;
  displayName?: string;
  getVisibility?: () => boolean;
}

export interface IMatrixMetaField extends IMetaField {
  type: 'matrix';
  getRowCount: () => number;
  getColumnCount: () => number;
  getData?: () => any[][];
}

export interface IArrayMetaField extends IMetaField {
  type: 'array';
  getCount: () => number;
  getData?: () => any[];
}

export interface IJSonMetaField extends IMetaField {
  type: 'json';
  getData?: () => any;
}

export interface IAnyMetaField extends IMetaField {
  type: 'any';
  getData?: () => any;
}

export interface IStringMetaField extends IMetaField {
  type: 'string';
  getText?: () => string;
}

export interface IOtherMetaField extends IMetaField {
  type: 'info' | 'custom';
  description?: string;
  getDescription?: () => string;
  renderCustom?: () => JSX.Element;
}

export type AllMetaFieldTypes =
  | IMetaField
  | IMatrixMetaField
  | IArrayMetaField
  | IJSonMetaField
  | IStringMetaField
  | IAnyMetaField
  | IOtherMetaField;

export interface INodeDecorator {
  taskType: string;
  formValues?: any;
  executeOrder?: 'before' | 'after';
  decoratorNode?: {
    nodeInfo: {
      compute?: (
        input: any,
        loopIndex?: number,
        payload?: any,
        thumbName?: string,
        scopeId?: string
      ) => any;
      initializeCompute?: () => void;
    };
  };
}

export interface BaseNodeInfo {
  taskType?: string;
  type?: string;
  compositionId?: string;
  isComposition?: boolean;
  useInCompositionOnly?: boolean;
  nodeCannotBeReplaced?: boolean;
  isAnnotation?: boolean;
  canBeStartedByTrigger?: boolean;
  readPropertyFromNodeInfoForInitialTrigger?: string;
  keepPopupOpenAfterUpdate?: boolean;
  supportsPreview?: boolean;
  cancelPreview?: () => void;
  outputConnectionInfo?: {
    text: string;
    fieldName: string;
    form?: any[];
    onChanged?: (connection: IConnectionNodeComponent<BaseNodeInfo>) => void;
  };
  canvasAppInstance?: IFlowCanvasBase<BaseNodeInfo>;

  initializeCompute?: () => void;
  showFormOnlyInPopup?: boolean;
  isSettingsPopup?: boolean;
  hasNoFormPopup?: boolean;
  formElements?: any[];
  delete?: () => void;
  formValues?: any;
  decorators?: INodeDecorator[];
  update?: () => void;

  meta?: AllMetaFieldTypes[];
  metaInputs?: AllMetaFieldTypes[];
}
