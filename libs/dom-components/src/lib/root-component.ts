import { BaseComponent } from './base-component';
import { createElementFromTemplate, createTemplate } from './elements';

export class RootComponent extends BaseComponent {
  constructor(rootElement: HTMLElement) {
    super();
    this.rootElement = rootElement;
    this.template = createTemplate(`<div class="root"></div>`);
    this.mount();
  }
  override mount() {
    super.mount();
    if (this.isMounted) return;
    if (!this.template) return;
    if (!this.rootElement) return;
    if (!this.element) {
      this.element = createElementFromTemplate(this.template);

      if (this.element) {
        this.element.remove();
        this.childRoot = this.element;
        this.rootElement.append(this.element);
      }
    }
    this.isMounted = true;
  }
  override unmount() {
    super.unmount();
    if (this.element && this.element.remove) {
      this.element.remove();
    }
    this.isMounted = false;
  }

  override render() {
    super.render();
    if (!this.element) return;

    // Make this smarter .. do only when needed!!
    const childElements: HTMLElement[] = [];
    this.components.forEach((component, index) => {
      if (component.doRender) {
        component.render();
        childElements.push(component.element!);
      }
    });
    this.childRoot?.replaceChildren?.(...childElements);
  }
}
