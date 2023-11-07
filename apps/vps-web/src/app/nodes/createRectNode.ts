import {
  CanvasAppInstance,
  createElement,
  INodeComponent,
  IRectNodeComponent,
  IThumb,
  ThumbConnectionType,
  ThumbType,
} from '@devhelpr/visual-programming-system';
import { FormComponent, FormField } from '../components/form-component';
import { NodeInfo } from '../types/node-info';
import { RunNodeResult } from '../simple-flow-engine/simple-flow-engine';
import { InitialValues } from '../node-task-registry';

export const createRectNode = (
  nodeTypeName: string,
  nodeTitle: string,
  id: string,
  initialValue: string,
  formElements: FormField[],
  x: number,
  y: number,
  width: number,
  height: number,
  compute: (
    input: string,
    pathExecution?: RunNodeResult<NodeInfo>[],
    loopIndex?: number,
    payload?: any
  ) => { result: any; followPath: any; output: any },
  initializeCompute: () => void,
  thumbs: IThumb[],
  canvasApp: CanvasAppInstance<NodeInfo>,
  containerNode?: IRectNodeComponent<NodeInfo>
) => {
  const componentWrapper = createElement(
    'div',
    {
      class: `relative`,
    },
    undefined
  ) as unknown as INodeComponent<NodeInfo>;

  createElement(
    'div',
    {
      class: `flex items-center bg-slate-600 text-white p-1 px-3 rounded-t pointer-events-none`,
    },
    componentWrapper.domElement,
    nodeTitle
  ) as unknown as INodeComponent<NodeInfo>;

  const formWrapper = createElement(
    'div',
    {
      class: `inner-node bg-slate-500 p-4 pt-4 rounded-b`,
    },
    componentWrapper.domElement
  ) as unknown as INodeComponent<NodeInfo>;

  FormComponent({
    rootElement: formWrapper.domElement as HTMLElement,
    id: id ?? '',
    formElements,
    hasSubmitButton: false,
    onSave: (formValues) => {
      console.log('onSave', formValues);
    },
  }) as unknown as HTMLElement;

  const rect = canvasApp.createRect(
    x,
    y,
    width,
    height,
    undefined,
    thumbs,
    componentWrapper,
    {
      classNames: ``,
    },
    undefined,
    undefined,
    undefined,
    id,
    {
      type: nodeTypeName,
      formValues: {
        variableName: initialValue ?? '',
      },
    },
    containerNode
  );

  if (!rect.nodeComponent) {
    throw new Error('rect.nodeComponent is undefined');
  }

  const node = rect.nodeComponent;
  if (node.nodeInfo) {
    node.nodeInfo.formElements = formElements;
    node.nodeInfo.compute = compute;
    node.nodeInfo.initializeCompute = initializeCompute;
  }
  return {
    node,
    rect,
    componentWrapper,
  };
};

export interface IComputeResult {
  result: any;
  followPath: any;
  output: any;
}

export const visualNodeFactory = (
  nodeTypeName: string,
  nodeTitle: string,
  nodeFamily: string,
  defaultValueFieldName: string,
  compute: (
    input: string,
    pathExecution?: RunNodeResult<NodeInfo>[],
    loopIndex?: number,
    payload?: any
  ) => IComputeResult,
  initializeCompute: () => void,
  formElements: FormField[],
  isContainer = false,
  width: number,
  height: number,
  thumbs: IThumb[]
) => {
  return {
    name: nodeTypeName,
    family: nodeFamily,
    isContainer: isContainer,
    createVisualNode: (
      canvasApp: CanvasAppInstance<NodeInfo>,
      x: number,
      y: number,
      id?: string,
      initalValues?: InitialValues,
      containerNode?: IRectNodeComponent<NodeInfo>
    ) => {
      const initialValue = initalValues?.[defaultValueFieldName] ?? '';
      return createRectNode(
        nodeTypeName,
        nodeTitle,
        id ?? '',
        initialValue,
        formElements,
        x,
        y,
        width,
        height,
        compute,
        initializeCompute,
        thumbs,
        canvasApp,
        containerNode
      );
    },
  };
};
