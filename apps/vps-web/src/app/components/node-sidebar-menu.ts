import {
  navBarButtonNomargin,
  invertedNavBarButtonNomargin,
} from '../consts/classes';

import {
  BaseComponent,
  Component,
  createElementFromTemplate,
  createTemplate,
} from '@devhelpr/dom-components';
import { AppNavComponentsProps } from '../component-interface/app-nav-component';
import {
  NodeType,
  IConnectionNodeComponent,
  IRectNodeComponent,
  INodeComponent,
  getSelectedNode,
} from '@devhelpr/visual-programming-system';
import { NodeInfo } from '../types/node-info';
import {
  getFollowNodeExecution,
  setFollowNodeExecution,
} from '../follow-path/followNodeExecution';

export class NodeSidebarMenuComponent extends Component<
  AppNavComponentsProps<NodeInfo>
> {
  oldProps: AppNavComponentsProps<NodeInfo> | null = null;

  previousDoRenderChildren: boolean | null = null;
  doRenderChildren: boolean | null = true;

  settingsNodeButton: HTMLButtonElement | null = null;
  rootAppElement: HTMLElement | null = null;

  placeOnLayer1Button: HTMLButtonElement | null = null;
  placeOnLayer2Button: HTMLButtonElement | null = null;
  switchLayerButton: HTMLButtonElement | null = null;
  toggleDependencyConnections: HTMLButtonElement | null = null;
  followNodeExecution: HTMLButtonElement | null = null;
  showDependencyConnections = false;

  constructor(
    parent: BaseComponent | null,
    props: AppNavComponentsProps<NodeInfo>
  ) {
    super(parent, props);
    this.template = createTemplate(
      `<div class="z-20 flex flex-col absolute right-0 top-1/2 bg-slate-700 -translate-y-1/2 p-[4px] rounded-l-lg">
      <button class="${navBarButtonNomargin} flex  w-[32px] h-[32px] mb-1"><span class="icon icon-tune text-[16px]"></span></button>
      <button class="${navBarButtonNomargin} flex items-center w-[32px] h-[32px] mb-1">L1</button>
      <button class="${navBarButtonNomargin} flex items-center w-[32px] h-[32px] mb-1">L2</button>
      <button class="${navBarButtonNomargin} flex items-center justify-center w-[32px] h-[32px] mb-1"><span class="icon icon-layers text-[22px]"></span></button>
      <button class="${navBarButtonNomargin} flex items-center justify-center w-[32px] h-[32px] mb-1"><span class="icon icon-arrow_forward text-[22px]"></span></button>
      <button class="${navBarButtonNomargin} flex items-center justify-center w-[32px] h-[32px]">F</button>

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
        this.settingsNodeButton = this.element.firstChild as HTMLButtonElement;

        this.placeOnLayer1Button = this.settingsNodeButton
          ?.nextSibling as HTMLButtonElement;
        this.placeOnLayer2Button = this.placeOnLayer1Button
          ?.nextSibling as HTMLButtonElement;
        this.switchLayerButton = this.placeOnLayer2Button
          ?.nextSibling as HTMLButtonElement;
        this.toggleDependencyConnections = this.switchLayerButton
          ?.nextSibling as HTMLButtonElement;
        this.followNodeExecution = this.toggleDependencyConnections
          ?.nextSibling as HTMLButtonElement;

        this.settingsNodeButton.addEventListener(
          'click',
          this.onClickSettingsNode
        );

        this.placeOnLayer1Button.addEventListener(
          'click',
          this.onClickPlaceOnLayer1
        );
        this.placeOnLayer2Button.addEventListener(
          'click',
          this.onClickPlaceOnLayer2
        );
        this.switchLayerButton.addEventListener(
          'click',
          this.onClickSwitchLayer
        );

        this.toggleDependencyConnections.addEventListener(
          'click',
          this.onClickToggleDependencyConnections
        );

        this.followNodeExecution.addEventListener(
          'click',
          this.onClickFollowNodeExecution
        );

        this.renderList.push(
          this.settingsNodeButton,
          this.placeOnLayer1Button,
          this.placeOnLayer2Button,
          this.switchLayerButton,
          this.toggleDependencyConnections,
          this.followNodeExecution
        );
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

  onClickSettingsNode = (event: Event) => {
    event.preventDefault();
    const nodeInfo = this.getSelectedNodeInfo();
    if (
      nodeInfo &&
      nodeInfo.node &&
      nodeInfo.node.nodeType === NodeType.Shape
    ) {
      this.props.showPopup(nodeInfo.node as IRectNodeComponent<NodeInfo>);
    }

    return false;
  };

  getSelectedNodeInfo = () => {
    const nodeElementId = getSelectedNode();
    if (nodeElementId) {
      const node = nodeElementId.containerNode
        ? ((
            nodeElementId?.containerNode as unknown as IRectNodeComponent<NodeInfo>
          )?.nodeInfo?.canvasAppInstance?.elements?.get(
            nodeElementId.id
          ) as INodeComponent<NodeInfo>)
        : (this.props.canvasApp?.elements?.get(
            nodeElementId.id
          ) as INodeComponent<NodeInfo>);

      if (node) {
        return { selectedNodeInfo: nodeElementId, node };
      }
    }
    return false;
  };

  onClickPlaceOnLayer1 = (event: Event) => {
    event.preventDefault();
    const nodeInfo = this.getSelectedNodeInfo();

    if (nodeInfo) {
      const node = nodeInfo.node;
      if (node.nodeType === NodeType.Connection) {
        const connection = node as IConnectionNodeComponent<NodeInfo>;
        connection.layer = 1;
        connection.update?.();
        this.props.canvasUpdated();
      }
    }
    return false;
  };

  onClickPlaceOnLayer2 = (event: Event) => {
    event.preventDefault();
    const nodeInfo = this.getSelectedNodeInfo();

    if (nodeInfo) {
      const node = nodeInfo.node;
      if (node.nodeType === NodeType.Connection) {
        const connection = node as IConnectionNodeComponent<NodeInfo>;
        connection.layer = 2;
        connection.update?.();
        this.props.canvasUpdated();
      }
    }
    return false;
  };

  onClickSwitchLayer = (event: Event) => {
    event.preventDefault();
    if (this.rootAppElement?.classList.contains('active-layer2')) {
      this.rootAppElement?.classList.remove('active-layer2');
    } else {
      this.rootAppElement?.classList.add('active-layer2');
    }

    return false;
  };

  onClickToggleDependencyConnections = (event: Event) => {
    event.preventDefault();
    /*
      indien uitzetten ...
      - loop door alle connections (ook recursief in containers)..
      - indien het een isAnnotationConnection is ... dan verwijderen

      indien aanzetten:
      - loop door alle nodes
      - vraag aan de node of deze dependencies heeft (en geef die ook terug)
          ... nodeInfo.getDependencies() ... 
        
      - ... zo ja, dan benodigde annotation connections toevoegen   

    */
    this.props.setIsStoring(true);
    this.showDependencyConnections = !this.showDependencyConnections;
    if (this.showDependencyConnections) {
      this.props.canvasApp?.elements.forEach((element) => {
        if (element.nodeInfo?.getDependencies) {
          const dependencies = element.nodeInfo.getDependencies();
          console.log('getDependencies', dependencies);
          if (dependencies.length > 0) {
            dependencies.forEach((dependency) => {
              const startNode = this.props.canvasApp?.elements?.get(
                dependency.startNodeId
              ) as IRectNodeComponent<NodeInfo>;
              const endNode = this.props.canvasApp?.elements?.get(
                dependency.endNodeId
              ) as IRectNodeComponent<NodeInfo>;

              if (startNode && endNode) {
                const connection = this.props.canvasApp?.createLine(
                  startNode.x,
                  startNode.y,
                  endNode.x,
                  endNode.y,
                  true,
                  true
                );
                if (
                  connection &&
                  connection.nodeComponent &&
                  connection.nodeComponent.update
                ) {
                  connection.nodeComponent.startNode = startNode;
                  connection.nodeComponent.endNode = endNode;

                  if (startNode) {
                    startNode.connections?.push(connection.nodeComponent);
                  }
                  if (endNode) {
                    endNode.connections?.push(connection.nodeComponent);
                  }

                  connection.nodeComponent.isAnnotationConnection = true;
                  connection.nodeComponent.layer = 2;
                  connection.nodeComponent.update();
                }
              }
            });
          }
        }
      });
    } else {
      this.props.canvasApp?.elements.forEach((element) => {
        const node = element as INodeComponent<NodeInfo>;
        if (node.nodeType === NodeType.Connection) {
          const connection = node as IConnectionNodeComponent<NodeInfo>;
          if (connection.isAnnotationConnection) {
            this.props.removeElement(node);
            this.props.canvasApp?.elements?.delete(element.id);
          }
        }
      });
    }
    this.props.setIsStoring(false);

    return false;
  };

  removeClassListFromElement = (
    element: HTMLElement | null,
    classList: string
  ) => {
    if (element) {
      const index = element.className.indexOf(classList);
      if (index > -1) {
        const newClassName =
          element.className.substring(0, index) +
          element.className.substring(index + classList.length);
        element.className = newClassName;
      }
    }
  };
  addClassListToElement = (element: HTMLElement | null, classList: string) => {
    if (element) {
      const index = element.className.indexOf(classList);
      if (index === -1) {
        element.className += ' ' + classList;
      }
    }
  };

  onClickFollowNodeExecution = (event: Event) => {
    event.preventDefault();
    setFollowNodeExecution(!getFollowNodeExecution());
    if (getFollowNodeExecution()) {
      this.removeClassListFromElement(
        this.followNodeExecution,
        navBarButtonNomargin
      );
      this.addClassListToElement(
        this.followNodeExecution,
        invertedNavBarButtonNomargin
      );
    } else {
      this.removeClassListFromElement(
        this.followNodeExecution,
        invertedNavBarButtonNomargin
      );
      this.addClassListToElement(
        this.followNodeExecution,
        navBarButtonNomargin
      );
    }
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

export const NodeSidebarMenuComponents = (
  props: AppNavComponentsProps<NodeInfo>
) => {
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
    showPopup: props.showPopup,
  });
};
