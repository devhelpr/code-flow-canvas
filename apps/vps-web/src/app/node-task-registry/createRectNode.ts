import {
  CanvasAppInstance,
  createElement,
  INodeComponent,
  IRectNodeComponent,
  IThumb,
} from '@devhelpr/visual-programming-system';
import { FormComponent, FormField } from '../components/form-component';
import { NodeInfo } from '../types/node-info';
import { RunNodeResult } from '../simple-flow-engine/simple-flow-engine';
import { InitialValues } from '../node-task-registry';

export interface ComputeResult<T> {
  result: T;
  followPath: any;
  output: T;
}

export abstract class BaseNodeCompute<T> {
  abstract compute: (
    input: T,
    pathExecution?: RunNodeResult<NodeInfo>[],
    loopIndex?: number,
    payload?: { [key: string]: any }
  ) => ComputeResult<T>;
  abstract initializeCompute: () => void;
}

export const createRectNode = (
  nodeTypeName: string,
  nodeTitle: string,
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
  id?: string,
  containerNode?: IRectNodeComponent<NodeInfo>,
  initialValues?: InitialValues
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
      formValues: initialValues ?? {},
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
    contextInstance: canvasApp,
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

  isContainer = false,
  width: number,
  height: number,
  thumbs: IThumb[],
  onGetFormElements: (values?: InitialValues) => FormField[],
  onCreatedNode: (nodeInfo: ReturnType<typeof createRectNode>) => void
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
      initialValues?: InitialValues, // this can be the values imported from storage..
      containerNode?: IRectNodeComponent<NodeInfo>
    ) => {
      const formElements = onGetFormElements(initialValues);
      const nodeInstance = createRectNode(
        nodeTypeName,
        nodeTitle,

        formElements,
        x,
        y,
        width,
        height,
        compute,
        initializeCompute,
        thumbs,
        canvasApp,
        id,
        containerNode,
        initialValues
      );
      onCreatedNode(nodeInstance);
      return nodeInstance.node;
    },
  };
};
