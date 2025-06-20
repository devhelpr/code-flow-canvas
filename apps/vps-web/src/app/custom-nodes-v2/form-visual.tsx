import { NodeVisual } from '@devhelpr/visual-programming-system';
import { NodeInfo } from '@devhelpr/web-flow-executor';
import { initFormGenerator } from './form/VanillaFormRenderer';

export class FormVisual extends NodeVisual<NodeInfo> {
  additionalContainerCssClasses = 'overflow-y-auto p-8';
  updateVisual = (
    incomingData: unknown,
    parentNode: HTMLElement,
    // Using underscore prefix to indicate intentionally unused parameter
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    nodeInfo: NodeInfo
  ) => {
    //parentNode.setAttribute('data-disable-interaction', 'true');
    parentNode.addEventListener('wheel', (e) => {
      e.stopPropagation();
    });

    //     const schema = {
    //       app: {
    //         title: 'Multi-step Form Example',
    //         pages: [
    //           {
    //             id: 'personal-info',
    //             title: 'Personal Information',
    //             route: '/personal',
    //             isEndPage: true,
    //             components: [
    //               {
    //                 type: 'text',
    //                 id: 'intro',
    //                 props: {
    //                   text: 'Please provide your personal information',
    //                 },
    //               },
    //               {
    //                 type: 'input',
    //                 id: 'name',
    //                 label: 'Full Name',
    //                 validation: {
    //                   required: true,
    //                   minLength: 2,
    //                 },
    //               },
    //               {
    //                 type: 'radio',
    //                 id: 'question',
    //                 label: 'Question',
    //                 props: {
    //                   optionsExpression: 'o',
    //                 },
    //                 validation: {
    //                   required: true,
    //                 },
    //               },
    //               {
    //                 type: 'text',
    //                 id: 'intro-add',
    //                 props: {
    //                   text: `lorem ipsum dolor sit amet, consectetur adipiscing elit. lorem ipsum dolor sit amet, consectetur adipiscing elit.
    // lorem ipsum dolor sit amet, consectetur adipiscing elit. lorem ipsum dolor sit amet, consectetur adipiscing elit.`,
    //                 },
    //               },
    //             ],
    //           },
    //         ],
    //       },
    //     };
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
        incomingData as any
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
