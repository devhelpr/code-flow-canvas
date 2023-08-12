export class BaseComponent {
  element: HTMLElement | null = null;
  rootElement: HTMLElement | null = null;
  template: HTMLTemplateElement | null = null;
  isMounted = false;
  doRender = true;
  parent: BaseComponent | null = null;
  components: BaseComponent[] = [];
  childRoot: HTMLElement | null = null;

  // eslint-disable-next-line @typescript-eslint/no-empty-function
  protected mount() {}
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  protected unmount() {}

  // eslint-disable-next-line @typescript-eslint/no-empty-function
  render() {}
}
