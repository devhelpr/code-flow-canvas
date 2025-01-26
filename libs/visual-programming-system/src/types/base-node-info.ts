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

// These also contain properties from NodeInfo (which is a superset of BaseNodeInfo)..
// TODO : move that and have some sort of registration construction so that it can be
//   used dynamically by the serialization proces
export interface BaseSettingsNodeInfo {
  useInCompositionOnly?: boolean;
  nodeCannotBeReplaced?: boolean;
  isAnnotation?: boolean;
  canBeStartedByTrigger?: boolean;
  readPropertyFromNodeInfoForInitialTrigger?: string;
  keepPopupOpenAfterUpdate?: boolean;
  supportsPreview?: boolean;
  showFormOnlyInPopup?: boolean;
  isSettingsPopup?: boolean;
  hasNoFormPopup?: boolean;
  meta?: AllMetaFieldTypes[];
  metaInputs?: AllMetaFieldTypes[];
  canvasAppInstance?: IFlowCanvasBase<BaseNodeInfo>;
  initializeOnStartFlow?: boolean;
  isVariable?: boolean;
  isUINode?: boolean;
  supportsDecorators?: boolean;
}
const baseSettingsNodeInfoSchema: Record<keyof BaseSettingsNodeInfo, boolean> =
  {
    useInCompositionOnly: true,
    nodeCannotBeReplaced: true,
    isAnnotation: true,
    canBeStartedByTrigger: true,
    readPropertyFromNodeInfoForInitialTrigger: true,
    keepPopupOpenAfterUpdate: true,
    supportsPreview: true,
    showFormOnlyInPopup: true,
    isSettingsPopup: true,
    hasNoFormPopup: true,
    meta: true,
    metaInputs: true,
    canvasAppInstance: true,
    initializeOnStartFlow: true,
    isVariable: true,
    isUINode: true,
    supportsDecorators: true,
  };

export const baseSettingsNodeInfoProperties = Object.keys(
  baseSettingsNodeInfoSchema
) as (keyof BaseSettingsNodeInfo)[];

export interface BaseNodeInfo extends BaseSettingsNodeInfo {
  taskType?: string;
  type?: string;
  compositionId?: string;
  isComposition?: boolean;
  cancelPreview?: () => void;
  outputConnectionInfo?: {
    text: string;
    fieldName: string;
    form?: any[];
    onChanged?: (connection: IConnectionNodeComponent<BaseNodeInfo>) => void;
  };

  initializeCompute?: () => void;
  formElements?: any[];
  delete?: () => void;
  formValues?: any;
  decorators?: INodeDecorator[];
  update?: () => void;
}
