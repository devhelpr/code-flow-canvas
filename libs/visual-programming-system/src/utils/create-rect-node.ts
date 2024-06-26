import { CanvasAppInstance } from '../canvas-app/CanvasAppInstance';
import { Rect } from '../components/rect';
import { INodeComponent, IThumb, IRectNodeComponent } from '../interfaces';
import { BaseNodeInfo } from '../types/base-node-info';
import { createNodeElement, createElement } from './create-element';
import { InitialValues } from '../types/values';
import { FormField } from '../forms/FormField';
import { FormComponent, FormValues } from '../forms/form-component';

export interface ComputeResult<T> {
  result: T;
  followPath: any;
  output: T;
}

export interface CreateNodeInfo<T extends BaseNodeInfo> {
  node: INodeComponent<T>;
  rect?: Rect<T>;
  componentWrapper?: INodeComponent<T>;
  contextInstance: CanvasAppInstance<T>;
  isDecoratorNode: boolean;
}

export abstract class BaseNodeCompute<T> {
  abstract compute: (
    input: T,
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

export const createRectNode = <T extends BaseNodeInfo>(
  nodeTypeName: string,
  nodeTitle: string,
  formElements: FormField[],
  x: number,
  y: number,
  width: number,
  height: number,
  compute: (
    input: string,
    loopIndex?: number,
    payload?: any
  ) => IComputeResult | Promise<IComputeResult>,
  initializeCompute: () => void,
  thumbs: IThumb[],
  canvasApp: CanvasAppInstance<T>,
  id?: string,
  containerNode?: IRectNodeComponent<T>,
  initialValues?: InitialValues,
  settings?: {
    hasTitlebar?: boolean;
    childNodeWrapperClass?: string;
    additionalClassNames?: string;
    hasFormInPopup?: boolean;
    hasStaticWidthHeight?: boolean;
    hideFromNodeTypeSelector?: boolean;
    hideTitle?: boolean;
    backgroundColorClassName?: string;
    textColorClassName?: string;
    backgroundThemeProperty?: string;
    textColorThenmeProperty?: string;
    adjustToFormContent?: boolean;
  },
  childNode?: HTMLElement | JSX.Element,
  isAsyncCompute = false,
  nodeInfo?: T,
  getNodeTaskFactory?: (name: string) => any,
  useInCompositionOnly = false
): CreateNodeInfo<T> => {
  const showTitlebar = settings ? settings?.hasTitlebar : true;
  let hasBeforeDecorator = false;
  let hasAfterDecorator = false;

  if (nodeInfo && nodeInfo.decorators && getNodeTaskFactory) {
    nodeInfo.decorators.forEach((decorator) => {
      if (decorator.executeOrder === 'before') {
        hasBeforeDecorator = true;
      } else if (decorator.executeOrder === 'after') {
        hasAfterDecorator = true;
      }
    });
  }

  const componentWrapper = createNodeElement<T>(
    'div',
    {
      class: `inner-node relative flex flex-col ${
        (settings?.backgroundThemeProperty &&
          (canvasApp.theme as any)[settings.backgroundThemeProperty]) ??
        settings?.backgroundColorClassName ??
        canvasApp.theme.nodeBackground
      } ${
        (settings?.textColorThenmeProperty &&
          (canvasApp.theme as any)[settings.textColorThenmeProperty]) ??
        settings?.textColorClassName ??
        canvasApp.theme.nodeText
      } rounded ${showTitlebar ? '' : 'py-2'}      
      ${settings?.adjustToFormContent ? 'w-min' : ''}`,
    },
    undefined
  ) as unknown as INodeComponent<T>;

  // decorators before
  if (nodeInfo && nodeInfo.decorators && getNodeTaskFactory) {
    let firstBeforeDecorator = true;
    nodeInfo.decorators.forEach((decorator) => {
      if (decorator.executeOrder === 'before') {
        hasBeforeDecorator = true;
        const factory = getNodeTaskFactory(decorator.taskType);
        if (factory) {
          const nodeTask = factory();
          if (nodeTask) {
            const decoratorWrapper = createNodeElement(
              'div',
              {
                class: `relative text-center px-2 py-2 ${
                  firstBeforeDecorator ? 'rounded-t' : ''
                }`,
              },
              componentWrapper.domElement as HTMLElement
            ) as unknown as INodeComponent<T>;
            firstBeforeDecorator = false;
            decorator.decoratorNode = nodeTask.createDecoratorNode(
              canvasApp,
              decorator.formValues,
              decoratorWrapper.domElement as HTMLElement
            );
          }
        }
      } else {
        hasAfterDecorator = true;
      }
    });
  }

  if (showTitlebar) {
    createElement(
      'div',
      {
        class: `flex items-center 
          ${canvasApp.theme.nodeTitleBarBackground} border-slate-500 
          ${canvasApp.theme.nodeTitleBarText} p-1 px-3 rounded-t pointer-events-none`,
      },
      componentWrapper.domElement,
      settings?.hideTitle ? '' : nodeTitle
    ) as unknown as INodeComponent<T>;
  } else {
    createElement(
      'div',
      {
        class: `flex items-center ${
          !hasBeforeDecorator ? 'rounded-t' : ''
        } pointer-events-none`,
      },
      componentWrapper.domElement,
      undefined
    ) as unknown as INodeComponent<T>;
  }

  const hasCenteredLabel =
    (formElements.length === 0 && settings?.hasTitlebar === false) ||
    (settings?.hasFormInPopup && settings?.hasTitlebar === false);
  const formWrapper = createElement(
    'div',
    {
      class: `node-content border-slate-500  ${
        showTitlebar
          ? 'rounded-b'
          : !hasBeforeDecorator && !hasAfterDecorator
          ? 'rounded'
          : hasBeforeDecorator && !hasAfterDecorator
          ? 'rounded-b'
          : ''
      } min-h-auto flex-auto ${
        hasCenteredLabel
          ? 'flex items-center border-slate-500 justify-center text-center'
          : 'p-4 pt-4'
      }
      ${settings?.additionalClassNames ?? ''} 
      `,
    },
    componentWrapper.domElement,
    hasCenteredLabel && !settings?.hideTitle ? nodeTitle : undefined
  );

  if (formElements.length > 0 && !settings?.hasFormInPopup) {
    FormComponent({
      rootElement: formWrapper.domElement as HTMLElement,
      id: id ?? '',
      formElements,
      hasSubmitButton: false,
      settings: {
        minWidthContent: settings?.adjustToFormContent ?? false,
        textLabelColor:
          settings?.textColorClassName ?? canvasApp.theme.nodeText,
      },
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

  // decorators after
  if (nodeInfo && nodeInfo.decorators && getNodeTaskFactory) {
    let firstAfterDecorator = true;
    nodeInfo.decorators.forEach((decorator) => {
      if (decorator.executeOrder === 'after') {
        const factory = getNodeTaskFactory(decorator.taskType);
        if (factory) {
          const nodeTask = factory();
          if (nodeTask) {
            const decoratorWrapper = createNodeElement(
              'div',
              {
                class: `relative border-slate-500 text-center py-2 ${
                  firstAfterDecorator ? 'rounded-b' : ''
                }`,
              },
              componentWrapper.domElement as HTMLElement
            ) as unknown as INodeComponent<T>;
            firstAfterDecorator = false;
            decorator.decoratorNode = nodeTask.createDecoratorNode(
              canvasApp,
              decorator.formValues,
              decoratorWrapper.domElement as HTMLElement
            );
          }
        }
      }
    });
  }
  if (nodeInfo?.isComposition) {
    const topLabel = createElement(
      'div',
      {
        class: `node-top-label text-center text-white`,
      },
      undefined,
      nodeTitle.replace('^2', '²')
    ) as unknown as INodeComponent<T>;
    (componentWrapper.domElement as HTMLElement).prepend(
      topLabel.domElement as HTMLElement
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
    settings?.adjustToFormContent
      ? false
      : settings?.hasStaticWidthHeight ?? false,
    undefined,
    undefined,
    id,
    {
      type: nodeTypeName,
      formValues: initialValues ?? {},
      decorators: nodeInfo?.decorators,
    } as T,
    containerNode,
    undefined,
    `rect-node${nodeInfo?.isComposition ? ' composition-node' : ''}`
  );

  if (!rect.nodeComponent) {
    throw new Error('rect.nodeComponent is undefined');
  }

  const node = rect.nodeComponent;
  if (node.nodeInfo) {
    const domElement = node.domElement as HTMLElement;
    if (domElement) {
      domElement.setAttribute('data-node-type', nodeTypeName);
    }
    node.nodeInfo.formElements = formElements;
    if (isAsyncCompute) {
      (node.nodeInfo as any).computeAsync = compute as (
        input: any,
        loopIndex?: number,
        payload?: any,
        thumbName?: string,
        scopeId?: string
      ) => Promise<any>;
    } else {
      (node.nodeInfo as any).compute = compute;
    }
    node.nodeInfo.initializeCompute = initializeCompute;
    node.nodeInfo.showFormOnlyInPopup = settings?.hasFormInPopup ?? false;
    node.nodeInfo.useInCompositionOnly = useInCompositionOnly;
  }
  return {
    node,
    rect,
    componentWrapper,
    contextInstance: canvasApp,
    isDecoratorNode: false,
  };
};

export const visualNodeFactory = <T extends BaseNodeInfo>(
  nodeTypeName: string,
  nodeTitle: string,
  nodeFamily: string,
  defaultValueFieldName: string,
  compute: (
    input: string,
    loopIndex?: number,
    payload?: any
  ) => IComputeResult | Promise<IComputeResult>,
  initializeCompute: () => void,

  isContainer = false,
  width: number,
  height: number,
  thumbs: IThumb[],
  onGetFormElements: (values?: InitialValues) => FormField[],
  onCreatedNode: (
    nodeInfo: CreateNodeInfo<T>,
    containerNode?: IRectNodeComponent<T>
  ) => void,
  settings?: {
    hasTitlebar?: boolean;
    childNodeWrapperClass?: string;
    additionalClassNames?: string;
    hasFormInPopup?: boolean;
    hasStaticWidthHeight?: boolean;
    decoratorTitle?: string;
    category?: string;
    hideFromNodeTypeSelector?: boolean;
    hideTitle?: boolean;
    backgroundColorClassName?: string;
    textColorClassName?: string;
    backgroundThemeProperty?: string;
    textColorThenmeProperty?: string;
    adjustToFormContent?: boolean;
  },
  childNode?: HTMLElement | JSX.Element,
  isAsyncCompute = false,
  canBeUsedAsDecorator = false,
  useInCompositionOnly = false,
  onSetCanvasApp?: (canvasApp: CanvasAppInstance<T>) => void
) => {
  let createDecoratorNode:
    | undefined
    | ((
        canvasApp: CanvasAppInstance<T>,
        initalValues?: InitialValues,
        rootElement?: HTMLElement
      ) => INodeComponent<T>) = undefined;
  if (canBeUsedAsDecorator) {
    createDecoratorNode = (
      canvasApp: CanvasAppInstance<T>,
      initalValues?: InitialValues,
      rootElement?: HTMLElement
    ) => {
      const initialValue = initalValues?.[defaultValueFieldName] ?? '';
      const caption = initalValues?.['caption'];
      const decoratorNode = createNodeElement(
        'div',
        {
          class: `decorator-node p-2 inline-block ${canvasApp.theme.nodeText} rounded text-center border-2 border-slate-200 border-solid`,
        },
        rootElement,
        caption ?? settings?.decoratorTitle ?? initialValue
      ) as unknown as INodeComponent<T>;

      decoratorNode.nodeInfo = {
        compute,
        initializeCompute,
        formValues: initalValues,
        canvasAppInstance: canvasApp,
      } as unknown as T;

      if (onCreatedNode) {
        onCreatedNode({
          contextInstance: canvasApp,
          node: decoratorNode,
          isDecoratorNode: true,
        });
      }
      return decoratorNode;
    };
  }
  let title = nodeTitle;
  return {
    name: nodeTypeName,
    family: nodeFamily,
    isContainer: isContainer,
    canBeUsedAsDecorator,
    category: settings?.category,
    hideFromNodeTypeSelector: settings?.hideFromNodeTypeSelector ?? false,
    useInCompositionOnly: useInCompositionOnly,
    thumbs,
    setCanvasApp: (canvasApp: CanvasAppInstance<T>) => {
      if (onSetCanvasApp) {
        onSetCanvasApp(canvasApp);
      }
    },
    getCompute: () =>
      compute as unknown as (
        input: any,
        loopIndex?: number,
        payload?: any,
        thumbName?: string,
        thumbIdentifierWithinNode?: string
      ) => { result: string | undefined },
    createVisualNode: (
      canvasApp: CanvasAppInstance<T>,
      x: number,
      y: number,
      id?: string,
      initialValues?: InitialValues, // this can be the values imported from storage..
      containerNode?: IRectNodeComponent<T>,
      _width?: number,
      _height?: number,
      _nestedLevel?: number,
      nodeInfo?: T,
      getNodeTaskFactory?: (name: string) => any
    ) => {
      const formElements = onGetFormElements(initialValues);
      const nodeInstance = createRectNode<T>(
        nodeTypeName,
        title,

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
        isAsyncCompute,
        nodeInfo as unknown as T,
        getNodeTaskFactory
      );
      onCreatedNode(nodeInstance, containerNode);
      nodeInstance.node.label = nodeTitle;
      if (nodeInstance?.rect?.resize) {
        if (settings?.adjustToFormContent) {
          nodeInstance?.rect?.resize();
        } else {
          nodeInstance?.rect?.resize(width);
        }
      }
      return nodeInstance.node as IRectNodeComponent<T>;
    },
    createDecoratorNode,
    setTitle: (newTitle: string) => {
      title = newTitle;
    },
  };
};
