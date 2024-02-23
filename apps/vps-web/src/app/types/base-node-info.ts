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

  initializeCompute?: () => void;
  showFormOnlyInPopup?: boolean;
  formElements?: any[];
  delete?: () => void;
  formValues?: any;
  decorators?: INodeDecorator[];
}
