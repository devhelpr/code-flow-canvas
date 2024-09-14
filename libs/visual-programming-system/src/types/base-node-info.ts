import { FlowCanvas } from '../canvas-app/flow-canvas';
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

export interface IOtherMetaField extends IMetaField {
  type: 'string' | 'info' | 'custom';
  description?: string;
  getDescription?: () => string;
  renderCustom?: () => JSX.Element;
}

export type AllMetaFieldTypes =
  | IMetaField
  | IMatrixMetaField
  | IArrayMetaField
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

  outputConnectionInfo?: {
    text: string;
    fieldName: string;
    form?: any[];
    onChanged?: (connection: IConnectionNodeComponent<BaseNodeInfo>) => void;
  };
  canvasAppInstance?: FlowCanvas<BaseNodeInfo>;

  initializeCompute?: () => void;
  showFormOnlyInPopup?: boolean;
  isSettingsPopup?: boolean;
  formElements?: any[];
  delete?: () => void;
  formValues?: any;
  decorators?: INodeDecorator[];
  update?: () => void;

  meta?: AllMetaFieldTypes[];
  metaInputs?: AllMetaFieldTypes[];
}
