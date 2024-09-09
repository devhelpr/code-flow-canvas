export class BaseComponent {
  element: HTMLElement | undefined = undefined;
  rootElement: HTMLElement | undefined = undefined;
  childContainerElement: HTMLElement | undefined = undefined;
  template: HTMLTemplateElement | undefined = undefined;
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
