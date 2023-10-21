import { navBarButton, navBarButtonNomargin } from '../consts/classes';

import {
  BaseComponent,
  Component,
  createElementFromTemplate,
  createTemplate,
} from '@devhelpr/dom-components';
import { AppNavComponentsProps } from '../component-interface/app-nav-component';

export class NodeSidebarMenuComponent extends Component<AppNavComponentsProps> {
  oldProps: AppNavComponentsProps | null = null;

  previousDoRenderChildren: boolean | null = null;
  doRenderChildren: boolean | null = true;

  testNodeButton: HTMLButtonElement | null = null;
  rootAppElement: HTMLElement | null = null;

  constructor(parent: BaseComponent | null, props: AppNavComponentsProps) {
    super(parent, props);
    this.template = createTemplate(
      `<div class="z-10 flex flex-col absolute right-0 top-1/2 bg-white -translate-y-1/2 p-[4px]">
		  <button class="${navBarButtonNomargin} flex  w-[32px] h-[32px]"><span class="icon icon-tune text-[16px]"></span></button>
		  <children></children>
		</div>`
    );
    this.rootElement = props.rootElement;
    this.rootAppElement = props.rootAppElement;
    this.mount();
  }
  mount() {
    super.mount();
    if (this.isMounted) return;
    if (!this.template) return;
    if (!this.rootElement) return;
    if (!this.element) {
      this.element = createElementFromTemplate(this.template);

      if (this.element) {
        this.element.remove();
        this.testNodeButton = this.element.firstChild as HTMLButtonElement;

        this.testNodeButton.addEventListener('click', this.onClickAddNode);

        this.renderList.push(this.testNodeButton);
        this.rootElement.append(this.element);
      }
    }
    this.isMounted = true;
  }
  unmount() {
    super.unmount();
    if (this.element && this.element.remove) {
      // remove only removes the connection between parent and node
      this.element.remove();
    }
    this.isMounted = false;
  }

  onClickAddNode = (event: Event) => {
    event.preventDefault();
    //

    return false;
  };

  render() {
    super.render();

    if (!this.element) return;

    if (
      this.previousDoRenderChildren === null ||
      this.previousDoRenderChildren !== this.doRenderChildren
    ) {
      this.previousDoRenderChildren = this.doRenderChildren;
      this.renderList = [];
      const childElements = this.doRenderChildren
        ? this.getRenderableChildren()
        : [];

      this.renderElements(childElements);
    }
  }
}

export const NodeSidebarMenuComponents = (props: AppNavComponentsProps) => {
  new NodeSidebarMenuComponent(null, {
    initializeNodes: props.initializeNodes,
    storageProvider: props.storageProvider,
    clearCanvas: props.clearCanvas,
    rootElement: props.rootElement,
    rootAppElement: props.rootAppElement,
    selectNodeType: props.selectNodeType,
    animatePath: props.animatePath,
    animatePathFromThumb: props.animatePathFromThumb,
    canvasUpdated: props.canvasUpdated,
    canvasApp: props.canvasApp,
    removeElement: props.removeElement,
    importToCanvas: props.importToCanvas,
    setIsStoring: props.setIsStoring,
  });
};
