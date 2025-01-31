import { IFlowCanvasBase } from '../canvas-app/flow-canvas';
import { Rect } from '../components/rect';
import {
  INodeComponent,
  IThumb,
  IRectNodeComponent,
  IDOMElement,
} from '../interfaces';
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
  contextInstance: IFlowCanvasBase<T>;
  isDecoratorNode: boolean;
  setError: (error: string) => void;
  clearError: () => void;
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
  dummyEndpoint?: boolean;
}

export interface NodeSettings {
  category?: string;
  hasTitlebar?: boolean;
  childNodeWrapperClass?: string;
  additionalClassNames?: string;
  additionalInnerNodeClassNames?: string;
  hasFormInPopup?: boolean;
  hasSettingsPopup?: boolean;
  hasStaticWidthHeight?: boolean;
  hideFromNodeTypeSelector?: boolean;
  hideTitle?: boolean;
  backgroundColorClassName?: string;
  textColorClassName?: string;
  backgroundThemeProperty?: string;
  textColorThemeProperty?: string;
  adjustToFormContent?: boolean;
  isRectThumb?: boolean;
  isCircleRectThumb?: boolean;
  rectThumbWithStraightConnections?: boolean;
  nodeCannotBeReplaced?: boolean;
  decoratorTitle?: string;
  keepPopupOpenAfterUpdate?: boolean;
  hasCustomStyling?: boolean;
  customClassName?: string;
  noFlexAutoInNodeContentWrapper?: boolean;
  centerToYPositionThumb?: boolean;
  skipDetermineSizeOnInit?: boolean;
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
  canvasApp: IFlowCanvasBase<T>,
  id?: string,
  containerNode?: IRectNodeComponent<T>,
  initialValues?: InitialValues,
  settings?: NodeSettings,
  childNode?: HTMLElement | JSX.Element,
  isAsyncCompute = false,
  nodeInfo?: T,
  getNodeTaskFactory?: (name: string) => any,
  useInCompositionOnly = false
): CreateNodeInfo<T> | undefined => {
  const showTitlebar = settings ? settings?.hasTitlebar : true;
  let hasBeforeDecorator = false;
  let hasAfterDecorator = false;
  let errorNode: IDOMElement | undefined = undefined;

  if (nodeInfo && nodeInfo.decorators && getNodeTaskFactory) {
    nodeInfo.decorators.forEach((decorator) => {
      if (decorator.executeOrder === 'before') {
        hasBeforeDecorator = true;
      } else if (decorator.executeOrder === 'after') {
        hasAfterDecorator = true;
      }
    });
  }
  let colorClasses = `${
    (settings?.backgroundThemeProperty &&
      (canvasApp.theme as any)[settings.backgroundThemeProperty]) ??
    settings?.backgroundColorClassName ??
    canvasApp.theme.nodeBackground
  } ${
    (settings?.textColorThemeProperty &&
      (canvasApp.theme as any)[settings.textColorThemeProperty]) ??
    settings?.textColorClassName ??
    canvasApp.theme.nodeText
  }`;

  if (settings?.hasCustomStyling) {
    colorClasses = '';
  }
  let paddingY = showTitlebar ? 'py-2' : '';
  if (settings?.hasCustomStyling) {
    paddingY = '';
  }
  const componentWrapper =
    settings?.isRectThumb && settings.isCircleRectThumb
      ? (createNodeElement<T>(
          'div',
          {
            class: `inner-node
      flex items-center justify-center 
      rounded-full
      ${settings?.adjustToFormContent ? 'w-min' : 'w-[50px] '}
      h-[50px] 
      overflow-hidden text-center
      ${colorClasses}
      `,
            style: {
              'clip-path': 'circle(50%)',
            },
          },
          undefined
        ) as unknown as INodeComponent<T>)
      : (createNodeElement<T>(
          'div',
          {
            class: `inner-node relative flex flex-col ${
              settings?.additionalInnerNodeClassNames ?? ''
            } ${colorClasses} rounded ${paddingY}      
      ${settings?.adjustToFormContent ? 'w-min' : ''}`,
          },
          undefined
        ) as unknown as INodeComponent<T>);

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
              componentWrapper?.domElement as HTMLElement
            ) as unknown as INodeComponent<T>;
            firstBeforeDecorator = false;
            decorator.decoratorNode = nodeTask.createDecoratorNode(
              canvasApp,
              decorator.formValues,
              decoratorWrapper?.domElement as HTMLElement
            );
          }
        }
      } else {
        hasAfterDecorator = true;
      }
    });
  }

  if (showTitlebar) {
    if (componentWrapper?.domElement) {
      let colorClassesTitlebar = `${canvasApp.theme.nodeTitleBarBackground} border-slate-500 
          ${canvasApp.theme.nodeTitleBarText}`;

      if (settings?.hasCustomStyling) {
        colorClassesTitlebar = '';
      }
      createElement(
        'div',
        {
          class: `flex items-center ${colorClassesTitlebar}
           p-1 px-3 rounded-t pointer-events-none w-full min-w-[max-content]`,
        },
        componentWrapper?.domElement,
        settings?.hideTitle ? '' : nodeTitle
      ) as unknown as INodeComponent<T>;
    }
  } else {
    if (componentWrapper?.domElement) {
      createElement(
        'div',
        {
          class: `flex items-center ${
            !hasBeforeDecorator ? 'rounded-t' : ''
          } pointer-events-none`,
        },
        componentWrapper?.domElement,
        undefined
      ) as unknown as INodeComponent<T>;
    }
  }

  const hasCenteredLabel =
    (formElements.length === 0 && settings?.hasTitlebar === false) ||
    (settings?.hasFormInPopup && settings?.hasTitlebar === false);

  // warning: dont add colors here! it affects a lot of nodes (especially the thumb-output node-type)
  let cssClasses = `${
    hasCenteredLabel
      ? ' flex items-center  justify-center text-center'
      : 'p-4 pt-4'
  }`;
  if (settings?.hasCustomStyling) {
    cssClasses = '';
  }
  const formWrapper = createElement(
    'div',
    {
      class: `node-content   ${
        showTitlebar
          ? 'rounded-b'
          : !hasBeforeDecorator && !hasAfterDecorator
          ? 'rounded'
          : hasBeforeDecorator && !hasAfterDecorator
          ? 'rounded-b'
          : ''
      } min-h-auto ${
        settings?.noFlexAutoInNodeContentWrapper ? '' : 'flex-auto'
      } ${cssClasses}
      ${settings?.additionalClassNames ?? ''} 
      `,
    },
    componentWrapper?.domElement,
    hasCenteredLabel && !settings?.hideTitle ? nodeTitle : undefined
  );

  if (
    formWrapper?.domElement &&
    formElements.length > 0 &&
    !settings?.hasFormInPopup
  ) {
    FormComponent({
      rootElement: formWrapper.domElement as HTMLElement,
      id: id ?? '',
      formElements,
      hasSubmitButton: false,
      settings: {
        minWidthContent: settings?.adjustToFormContent ?? false,
        textLabelColor: settings?.hasCustomStyling
          ? ''
          : settings?.textColorClassName ?? canvasApp.theme.nodeText,
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

  if (formWrapper?.domElement && childNode) {
    createElement(
      'div',
      { class: `${settings?.childNodeWrapperClass ?? ''}` },
      formWrapper?.domElement,
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
              componentWrapper?.domElement as HTMLElement
            ) as unknown as INodeComponent<T>;
            firstAfterDecorator = false;
            decorator.decoratorNode = nodeTask.createDecoratorNode(
              canvasApp,
              decorator.formValues,
              decoratorWrapper?.domElement as HTMLElement
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
        class: `node-top-label text-center ${
          settings?.hasCustomStyling ? '' : 'text-white'
        }`,
      },
      undefined,
      nodeTitle.replace('^2', '²')
    ) as unknown as INodeComponent<T>;

    if (componentWrapper?.domElement as HTMLElement) {
      (componentWrapper?.domElement as HTMLElement).prepend(
        topLabel?.domElement as HTMLElement
      );
    }
  }
  const rect = settings?.isRectThumb
    ? canvasApp.createRectThumb(
        x,
        y,
        width,
        height,
        undefined,
        thumbs,
        componentWrapper,
        {
          classNames: '',
          hasCustomStyling: settings?.hasCustomStyling ?? false,
          customClassName: settings?.customClassName,
          centerToYPositionThumb: settings?.centerToYPositionThumb,
          skipDetermineSizeOnInit: settings?.skipDetermineSizeOnInit,
        },
        settings?.adjustToFormContent
          ? false
          : settings?.hasStaticWidthHeight ?? false,
        undefined,
        undefined,
        id,
        {
          ...nodeInfo,
          type: nodeTypeName,
          formValues: initialValues ?? {},
          decorators: nodeInfo?.decorators,
        } as T,
        containerNode,
        undefined,
        settings.isCircleRectThumb,
        settings.rectThumbWithStraightConnections
      )
    : canvasApp.createRect(
        x,
        y,
        width,
        height,
        undefined,
        thumbs,
        componentWrapper,
        {
          classNames: '',
          hasCustomStyling: settings?.hasCustomStyling ?? false,
          customClassName: settings?.customClassName,
          centerToYPositionThumb: settings?.centerToYPositionThumb,
          skipDetermineSizeOnInit: settings?.skipDetermineSizeOnInit,
        },
        settings?.adjustToFormContent
          ? false
          : settings?.hasStaticWidthHeight ?? false,
        undefined,
        undefined,
        id,
        {
          ...nodeInfo,
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
    node.nodeInfo.nodeCannotBeReplaced =
      settings?.nodeCannotBeReplaced ?? false;
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
    node.nodeInfo.keepPopupOpenAfterUpdate =
      settings?.keepPopupOpenAfterUpdate ?? false;
  }
  return {
    node,
    rect,
    componentWrapper,
    contextInstance: canvasApp,
    isDecoratorNode: false,
    setError: (error: string) => {
      if (errorNode) {
        if (errorNode.domElement) {
          (errorNode.domElement as HTMLElement).innerHTML = error;
        }
      } else {
        errorNode = createElement(
          'div',
          {
            class: `bg-red-500 p-4 rounded absolute bottom-[calc(100%+8px)] h-[min-content] w-full
            after:content-['']
            after:w-0 after:h-0 
            after:border-l-[10px] after:border-l-transparent
            after:border-t-[10px] after:border-t-red-500
            after:border-r-[10px] after:border-r-transparent
            after:absolute after:bottom-[-8px] after:left-[50%] after:transform after:translate-x-[-50%]
          `,
          },
          rect.nodeComponent?.domElement,
          error
        );
      }
    },
    clearError: () => {
      if (errorNode) {
        errorNode.domElement?.remove();
        errorNode = undefined;
      }
    },
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
  settings?: NodeSettings,
  childNode?: HTMLElement | JSX.Element,
  isAsyncCompute = false,
  canBeUsedAsDecorator = false,
  useInCompositionOnly = false,
  onSetCanvasApp?: (canvasApp: IFlowCanvasBase<T>) => void
) => {
  let createDecoratorNode:
    | undefined
    | ((
        canvasApp: IFlowCanvasBase<T>,
        initalValues?: InitialValues,
        rootElement?: HTMLElement
      ) => INodeComponent<T>) = undefined;
  if (canBeUsedAsDecorator) {
    createDecoratorNode = (
      canvasApp: IFlowCanvasBase<T>,
      initalValues?: InitialValues,
      rootElement?: HTMLElement
    ) => {
      const initialValue = initalValues?.[defaultValueFieldName] ?? '';
      const caption = initalValues?.['caption'];
      const decoratorNode = (createNodeElement(
        'div',
        {
          class: `decorator-node p-2 inline-block ${canvasApp.theme.nodeText} rounded text-center border-2 border-slate-200 border-solid`,
        },
        rootElement,
        caption ?? settings?.decoratorTitle ?? initialValue
      ) as unknown as INodeComponent<T>) ?? {
        domElement: undefined,
        id: crypto.randomUUID(),
      };

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
          setError: () => {
            //
          },
          clearError: () => {
            //
          },
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
    setCanvasApp: (canvasApp: IFlowCanvasBase<T>) => {
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
      canvasApp: IFlowCanvasBase<T>,
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
        settings?.hasSettingsPopup ? [] : formElements,
        x,
        y,
        settings?.hasStaticWidthHeight && settings?.centerToYPositionThumb
          ? _width ?? width
          : width,
        settings?.hasStaticWidthHeight && settings?.centerToYPositionThumb
          ? _height ?? height
          : height,
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
        getNodeTaskFactory,
        undefined
      ) as CreateNodeInfo<T>;
      // if (!nodeInstance) {
      //   return;
      // }
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
