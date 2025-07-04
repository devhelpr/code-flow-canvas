import {
  NodeDefinition,
  createJSXElement,
  NodeVisual,
  renderElement,
} from '@devhelpr/visual-programming-system';
import { NodeInfo } from '@devhelpr/web-flow-executor';

export const renderTestNodeDefinition: NodeDefinition = {
  nodeTypeName: 'redner-tet-node',
  description: 'A render test component',

  nodeTheme: {
    backgroundColorClass: 'bg-teal-400',
    //textColorClass: 'text-white',
  },
};

const TestComponent = ({
  setUpdater,
}: {
  setUpdater?: (updated: (payload: any) => void) => void;
}) => {
  let elementInstance: HTMLElement | null = null;
  setUpdater?.((payload: any) => {
    console.log('TestComponent updated with payload:', payload);
    if (elementInstance) {
      elementInstance.innerHTML = `Updated with payload: ${JSON.stringify(
        payload
      )}`;
    }
  });
  // This component can be used to test rendering and updates
  return (
    <div
      getElement={(element: HTMLElement) => {
        elementInstance = element;
      }}
    >
      Hello from TestComponent
    </div>
  );
};

export class RenderTestNodeVisual extends NodeVisual<NodeInfo> {
  additionalContainerCssClasses = 'overflow-y-auto p-8';
  componentUpdater: ((payload: any) => void) | undefined = undefined;

  render = () => {
    return (
      <div
        getElement={(element: HTMLElement) => {
          element.innerHTML = '';
          renderElement(
            <TestComponent
              setUpdater={(updater) => {
                this.componentUpdater = updater;
              }}
            />,
            element
          );
        }}
      ></div>
    );
  };
  updateVisual = (
    incomingData: unknown,
    _parentNode: HTMLElement,
    // Using underscore prefix to indicate intentionally unused parameter
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _nodeInfo: NodeInfo,
    _scopeId?: string | undefined
  ) => {
    if (!this.canvasAppInstance) {
      return;
    }
    this.componentUpdater?.(incomingData);
  };

  isResizing = false;
  resizeObserver: ResizeObserver | undefined = undefined;

  destroy() {
    //
  }
}
