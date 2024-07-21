import { CanvasAppInstance } from '../canvas-app/CanvasAppInstance';

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
    onChanged?: () => void;
  };
  canvasAppInstance?: CanvasAppInstance<BaseNodeInfo>;

  initializeCompute?: () => void;
  showFormOnlyInPopup?: boolean;
  isSettingsPopup?: boolean;
  formElements?: any[];
  delete?: () => void;
  formValues?: any;
  decorators?: INodeDecorator[];
  update?: () => void;
}
