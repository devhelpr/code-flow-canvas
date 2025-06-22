import { NodeVisual } from '@devhelpr/visual-programming-system';
import { NodeInfo } from '@devhelpr/web-flow-executor';
import { initFormGenerator } from './form/VanillaFormRenderer';

export class FormVisual extends NodeVisual<NodeInfo> {
  additionalContainerCssClasses = 'overflow-y-auto p-8';

  private wheelEventHandler(e: WheelEvent) {
    e.stopPropagation();
  }

  updateVisual = (
    incomingData: unknown,
    parentNode: HTMLElement,
    // Using underscore prefix to indicate intentionally unused parameter
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    nodeInfo: NodeInfo,
    scopeId?: string | undefined
  ) => {
    parentNode.removeEventListener('wheel', this.wheelEventHandler);
    parentNode.addEventListener('wheel', this.wheelEventHandler);
    if (!this.canvasAppInstance) {
      return;
    }
    console.log('updateVisual FormVisual scopeId', scopeId);

    try {
      const schema = JSON.parse(nodeInfo.formValues?.formJson) ?? {};

      initFormGenerator(
        schema as any,
        parentNode,
        (data: any) => {
          console.log(
            'form visual thumbconnector',
            this.node.thumbConnectors?.[0],
            data
          );
          const port = this.node.thumbConnectors?.[0];
          if (!port) {
            console.error('No thumb connector found for form visual');
            return;
          }
          this.triggerOutputs(port, data);
        },
        incomingData as any,
        this.canvasAppInstance,
        scopeId
      );
    } catch (error) {
      console.error('Error initializing form visual:', error);
      parentNode.innerHTML = `<div class="text-red-500">Error initializing form visual: ${error}</div>`;
    }
  };

  isResizing = false;
  resizeObserver: ResizeObserver | undefined = undefined;

  destroy() {
    //
  }
}
