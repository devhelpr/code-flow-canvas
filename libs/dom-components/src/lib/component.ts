import { BaseComponent } from './base-component';

export class Component<T> extends BaseComponent {
  renderList: (HTMLElement | Text)[] = [];
  props: T;
  constructor(parent: BaseComponent | null, props: T) {
    super();
    this.props = new Proxy(props, this.propsHandler);

    // create proxy for array properties within props
    Object.keys(this.props as any).forEach((key) => {
      if (Array.isArray((this.props as any)[key])) {
        (this.props as any)[key] = new Proxy(
          (this.props as any)[key],
          this.propsHandler
        );
      }
    });
    this.parent = parent;
    if (parent) {
      parent.components.push(this);
      this.rootElement = parent.element;
    }
  }
  override mount() {
    super.mount();
  }
  override unmount() {
    super.unmount();
  }
  override render() {
    super.render();
  }

  renderElements(elements: (HTMLElement | Text | null)[]) {
    this.renderList = [
      ...(elements.filter((element) => element !== null) as (
        | HTMLElement
        | Text
      )[]),
    ];
    const element = this.childContainerElement ?? this.element;
    element?.replaceChildren?.(...this.renderList);
  }

  propsHandler = {
    set: (obj: any, prop: string, value: any) => {
      const result = Reflect.set(obj, prop, value);

      // don't call render if the value is an array.. because array props themselves are proxies
      if (!Array.isArray(value)) {
        this.render();
      }
      return result;
    },
    get: (obj: any, prop: string, value: any) => {
      return Reflect.get(obj, prop, value);
    },
  };

  getRenderableChildren(): HTMLElement[] {
    const childElements: HTMLElement[] = [];
    this.components.forEach((component, index) => {
      if (component.doRender) {
        component.render();
        childElements.push(component.element!);
      }
    });
    return childElements;
  }
}
