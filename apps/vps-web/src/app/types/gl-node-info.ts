import { CanvasAppInstance } from '@devhelpr/visual-programming-system';

export interface GLNodeInfo {
  taskType?: string;
  compute?: (
    input: any,
    loopIndex?: number,
    payload?: any,
    thumbName?: string
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
}
