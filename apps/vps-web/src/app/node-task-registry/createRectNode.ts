import {
  CanvasAppInstance,
  createElement,
  INodeComponent,
  IRectNodeComponent,
  IThumb,
} from '@devhelpr/visual-programming-system';
import { FormComponent, FormValues } from '../components/form-component';
import { NodeInfo } from '../types/node-info';
import { RunNodeResult } from '../simple-flow-engine/simple-flow-engine';
import { InitialValues } from '../node-task-registry';
import { FormField } from '../components/FormField';

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

export interface IComputeResult {
  result: any;
  followPath: any;
  output: any;
  stop?: boolean;
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
  ) => IComputeResult | Promise<IComputeResult>,
  initializeCompute: () => void,
  thumbs: IThumb[],
  canvasApp: CanvasAppInstance<NodeInfo>,
  id?: string,
  containerNode?: IRectNodeComponent<NodeInfo>,
  initialValues?: InitialValues,
  settings?: {
    hasTitlebar?: boolean;
    childNodeWrapperClass?: string;
    additionalClassNames?: string;
    hasFormInPopup?: boolean;
    hasStaticWidthHeight?: boolean;
  },
  childNode?: HTMLElement,
  isAsyncCompute = false
) => {
  const componentWrapper = createElement(
    'div',
    {
      class: `relative flex flex-col`,
    },
    undefined
  ) as unknown as INodeComponent<NodeInfo>;

  const showTitlebar = settings ? settings?.hasTitlebar : true;
  if (showTitlebar) {
    createElement(
      'div',
      {
        class: `flex items-center bg-slate-600 text-white p-1 px-3 rounded-t pointer-events-none`,
      },
      componentWrapper.domElement,
      nodeTitle
    ) as unknown as INodeComponent<NodeInfo>;
  } else {
    createElement(
      'div',
      {
        class: `flex items-center rounded-t pointer-events-none`,
      },
      componentWrapper.domElement,
      undefined
    ) as unknown as INodeComponent<NodeInfo>;
  }

  const hasCenteredLabel =
    (formElements.length === 0 && settings?.hasTitlebar === false) ||
    (settings?.hasFormInPopup && settings?.hasTitlebar === false);
  const formWrapper = createElement(
    'div',
    {
      class: `inner-node bg-slate-500  ${
        showTitlebar ? 'rounded-b' : 'rounded'
      } min-h-auto flex-auto ${
        hasCenteredLabel ? 'flex items-center justify-center' : 'p-4 pt-4'
      }
      ${settings?.additionalClassNames ?? ''} 
      `,
    },
    componentWrapper.domElement,
    hasCenteredLabel ? nodeTitle : undefined
  ) as unknown as INodeComponent<NodeInfo>;

  if (formElements.length > 0 && !settings?.hasFormInPopup) {
    FormComponent({
      rootElement: formWrapper.domElement as HTMLElement,
      id: id ?? '',
      formElements,
      hasSubmitButton: false,
      onSave: (formValues) => {
        console.log('onSave', formValues, rect);
      },
      setDataOnNode: (formValues: FormValues) => {
        const node = rect.nodeComponent;
        if (node && node.nodeInfo) {
          node.nodeInfo = {
            ...node.nodeInfo,
            formValues,
          };
        }
      },
      getDataFromNode: () => {
        return initialValues ?? {};
      },
      canvasUpdated: canvasApp.getOnCanvasUpdated(),
    }) as unknown as HTMLElement;
  }
  if (childNode) {
    createElement(
      'div',
      { class: `${settings?.childNodeWrapperClass ?? ''}` },
      formWrapper.domElement,
      childNode
    );
  }
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
    settings?.hasStaticWidthHeight ?? false,
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
    if (isAsyncCompute) {
      node.nodeInfo.computeAsync = compute as (
        input: any,
        pathExecution?: RunNodeResult<NodeInfo>[],
        loopIndex?: number,
        payload?: any,
        thumbName?: string,
        scopeId?: string
      ) => Promise<any>;
    } else {
      node.nodeInfo.compute = compute;
    }
    node.nodeInfo.initializeCompute = initializeCompute;
    node.nodeInfo.showFormOnlyInPopup = settings?.hasFormInPopup ?? false;
  }
  return {
    node,
    rect,
    componentWrapper,
    contextInstance: canvasApp,
  };
};

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
  ) => IComputeResult | Promise<IComputeResult>,
  initializeCompute: () => void,

  isContainer = false,
  width: number,
  height: number,
  thumbs: IThumb[],
  onGetFormElements: (values?: InitialValues) => FormField[],
  onCreatedNode: (nodeInfo: ReturnType<typeof createRectNode>) => void,
  settings?: {
    hasTitlebar?: boolean;
    childNodeWrapperClass?: string;
    additionalClassNames?: string;
    hasFormInPopup?: boolean;
    hasStaticWidthHeight?: boolean;
  },
  childNode?: HTMLElement,
  isAsyncCompute = false
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
        initialValues,
        settings,
        childNode,
        isAsyncCompute
      );
      onCreatedNode(nodeInstance);
      return nodeInstance.node;
    },
  };
};
