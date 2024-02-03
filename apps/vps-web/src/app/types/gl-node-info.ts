import { CanvasAppInstance, IThumb } from '@devhelpr/visual-programming-system';

export interface GLNodeInfo {
  taskType?: string;
  compute?: (
    input: any,
    loopIndex?: number,
    payload?: any,
    thumbName?: string,
    thumbIdentifierWithinNode?: string
  ) => {
    result: string | undefined;
  };

  initializeCompute?: () => void;
  showFormOnlyInPopup?: boolean;
  formElements?: any[];
  canvasAppInstance?: CanvasAppInstance<GLNodeInfo>;
  delete?: () => void;
  formValues?: any;
  type?: string;

  compositionId?: string;
  thumbs?: IThumb[];
  isComposite?: boolean;
}
