import {
  renderElement,
  createJSXElement,
  createEffect,
  getSelectedNode,
  INodeComponent,
  IRectNodeComponent,
  NodeType,
  IConnectionNodeComponent,
  ThumbConnectionType,
  getActionNode,
  setActionNode,
  setSelectNode,
  BaseNodeInfo,
} from '@devhelpr/visual-programming-system';
import { ITasklistItem } from '../interfaces/TaskListItem';

function ToolbarItem(props: {
  label: string;
  nodeType: string;
  hideToolbar: () => void;
  addNodeType: (nodeType: string) => void;
}) {
  return (
    <li class="px-2" data-node-type={props.nodeType}>
      <button
        click={(event: MouseEvent) => {
          event.preventDefault();
          props.hideToolbar();
          props.addNodeType(props.nodeType);
          return false;
        }}
      >
        {props.label}
      </button>
    </li>
  );
}

export function Toolbar<T>(props: {
  getTaskList: () => ITasklistItem[];
  addNodeType: (nodeType: string) => void;
  replaceNode: (nodeType: string, node: IRectNodeComponent<T>) => void;
  getNode: (
    nodeId: string,
    containerNode?: IRectNodeComponent<T> | undefined
  ) => { node: INodeComponent<T> | undefined };
}) {
  let toggle = false;
  let ul: HTMLUListElement | null = null;
  let wrapper: HTMLDivElement | null = null;
  let icon: HTMLSpanElement | null = null;
  let selectedNode: INodeComponent<T> | undefined;
  let isInReplaceeMode = false;
  let popupTriggeredFromEffect = false;
  function showUpIcon() {
    if (icon) {
      icon.classList.remove('icon-arrow_drop_down');
      icon.classList.add('icon-arrow_drop_up');
    }
  }
  function showDropIcon() {
    if (icon) {
      icon.classList.remove('icon-arrow_drop_up');
      icon.classList.add('icon-arrow_drop_down');
    }
  }

  const taskList = props.getTaskList();
  let skipHide = false;
  createEffect(() => {
    const selectedNodeInfo = getSelectedNode();
    const actionSelectedNodeInfo = getActionNode();
    if (selectedNodeInfo || actionSelectedNodeInfo) {
      selectedNode = undefined;
      const info = props.getNode(
        (selectedNodeInfo || actionSelectedNodeInfo)!.id,
        (selectedNodeInfo || actionSelectedNodeInfo)!
          .containerNode as IRectNodeComponent<T>
      );
      selectedNode = info.node;
      console.log(
        'Toolbar selectedNodeInfo',
        selectedNodeInfo,
        actionSelectedNodeInfo,
        //info,
        getTasksWhichAreInterchangeableWithSelectedNode()
      );

      if (!showUL()) {
        return;
      }
      popupTriggeredFromEffect = true;
      isInReplaceeMode = true;
      if (actionSelectedNodeInfo && info.node?.nodeType === NodeType.Shape) {
        skipHide = true;
        console.log(
          'skipHide : actionSelectedNodeInfo2',
          actionSelectedNodeInfo
        );
        setActionNode(undefined);
        return;
      }
      const taskList = getTasksWhichAreInterchangeableWithSelectedNode();
      if (taskList.length > 1) {
        fillTaskList(
          taskList,
          info.node?.nodeType === NodeType.Shape
            ? 'Replace node with:'
            : (info?.node as IConnectionNodeComponent<T>)?.endNode
            ? 'Insert node in connection:'
            : 'Create node'
        );

        if (actionSelectedNodeInfo) {
          console.log(
            'skipHide : actionSelectedNodeInfo',
            actionSelectedNodeInfo
          );
          skipHide = true;
          setActionNode(undefined);
        }
      } else {
        popupTriggeredFromEffect = false;
        hideUL();
      }
    } else {
      console.log('hide toolbar', skipHide);
      if (!skipHide) {
        selectedNode = undefined;
        hideUL();
      }
    }
  });

  function getTasksWhichAreInterchangeableWithSelectedNode() {
    if (!selectedNode) {
      return [];
    }

    if (selectedNode.nodeType === NodeType.Connection) {
      const connection = selectedNode as IConnectionNodeComponent<T>;

      if (
        connection.startNode &&
        !connection.endNode &&
        connection.startNodeThumb &&
        !connection.endNodeThumb
      ) {
        return taskList.filter((task) => {
          if (!task.nodeCannotBeReplaced && task.thumbs.length >= 2) {
            let insertableStartThumbFound = false;
            let insertableEndThumbFound = false;

            task.thumbs.forEach((thumb) => {
              if (
                thumb.connectionType === ThumbConnectionType.end &&
                thumb.thumbConstraint ===
                  connection.startNodeThumb?.thumbConstraint
              ) {
                insertableStartThumbFound = true;
                insertableEndThumbFound = true;
              }
            });

            return insertableStartThumbFound && insertableEndThumbFound;
          }
          return false;
        });
      } else if (
        connection.startNode &&
        connection.endNode &&
        connection.startNodeThumb &&
        connection.endNodeThumb
      ) {
        return taskList.filter((task) => {
          if (!task.nodeCannotBeReplaced && task.thumbs.length >= 2) {
            let insertableStartThumbFound = false;
            let insertableEndThumbFound = false;

            task.thumbs.forEach((thumb) => {
              if (
                thumb.connectionType === ThumbConnectionType.start &&
                //thumb.thumbType === connection.startNodeThumb?.thumbType &&
                //thumb.thumbIndex === connection.startNodeThumb?.thumbIndex &&
                thumb.thumbConstraint ===
                  connection.startNodeThumb?.thumbConstraint
                // thumb.maxConnections ===
                //   connection.startNodeThumb?.maxConnections
              ) {
                insertableStartThumbFound = true;
              }
              if (
                thumb.connectionType === ThumbConnectionType.end &&
                //thumb.thumbType === connection.endNodeThumb?.thumbType &&
                //thumb.thumbIndex === connection.endNodeThumb?.thumbIndex &&
                thumb.thumbConstraint ===
                  connection.endNodeThumb?.thumbConstraint
                //thumb.maxConnections === connection.endNodeThumb?.maxConnections
              ) {
                insertableEndThumbFound = true;
              }
            });

            return insertableStartThumbFound && insertableEndThumbFound;
          }
          return false;
        });
      }
      return [];
    }

    if (selectedNode.nodeType !== NodeType.Shape) {
      return [];
    }
    const rectNode = selectedNode as IRectNodeComponent<T>;
    if ((rectNode.nodeInfo as BaseNodeInfo)?.nodeCannotBeReplaced) {
      return [];
    }
    return taskList.filter((task) => {
      if (
        !task.nodeCannotBeReplaced &&
        task.thumbs.length === rectNode.thumbs.length
      ) {
        /*
			compare thumbs:
			- foreach task.thumb see if there's a thumb in rectNode.thumbs that has the same 
				thumbType/connectionType/index/constraint/maxConnections

			- TODO look to other properties as well ... like form-fields
			
		*/
        const thumbsIndexesMatched: number[] = [];
        task.thumbs.forEach((thumb, _eventindex) => {
          rectNode.thumbs.forEach((rectThumb, rectIndex) => {
            if (
              rectThumb.thumbType === thumb.thumbType &&
              rectThumb.connectionType === thumb.connectionType &&
              rectThumb.thumbIndex === thumb.thumbIndex &&
              rectThumb.thumbConstraint === thumb.thumbConstraint &&
              rectThumb.maxConnections === thumb.maxConnections &&
              !thumbsIndexesMatched.includes(rectIndex)
            ) {
              thumbsIndexesMatched.push(rectIndex);
            }
          });
        });
        return thumbsIndexesMatched.length === task.thumbs.length;
      }
      return false;
    });
  }

  const UL = () => {
    return (
      <ul
        name="node-types-result"
        class="absolute bg-white bottom-[40px] w-full toolbar-task-list"
        getElement={(element: HTMLElement) => {
          ul = element as HTMLUListElement;
        }}
      ></ul>
    );
  };

  function fillTaskList(tasks: ITasklistItem[], label?: string) {
    if (!ul) {
      return;
    }
    ul.innerHTML = '';
    if (label) {
      renderElement(<li class="font-bold px-2">{label}</li>, ul);
    }
    tasks.forEach((task) => {
      if (ul) {
        renderElement(
          <ToolbarItem
            label={task.label}
            nodeType={task.nodeType}
            hideToolbar={() => {
              toggle = false;
              if (ul) {
                ul.remove();
                ul = null;
              }
            }}
            addNodeType={(nodeType: string) => {
              if (selectedNode !== undefined && isInReplaceeMode) {
                props.replaceNode(
                  nodeType,
                  selectedNode as unknown as IRectNodeComponent<T>
                );
              } else {
                props.addNodeType(nodeType);
              }
            }}
          />,
          ul
        );
      }
    });
  }

  function showUL() {
    if (!ul) {
      if (!wrapper) {
        return false;
      }
      toggle = true;
      showUpIcon();
      renderElement(<UL />, wrapper);
      if (!ul) {
        return false;
      }
    }
    return true;
  }

  function hideUL() {
    if (popupTriggeredFromEffect) {
      popupTriggeredFromEffect = false;
      return;
    }

    isInReplaceeMode = false;
    showDropIcon();
    if (ul) {
      toggle = false;
      ul.remove();
      ul = null;
    }
  }

  document.body.addEventListener(
    'canvas-click' as unknown as keyof HTMLElementEventMap,
    (_) => {
      setActionNode(undefined);
      setSelectNode(undefined);
      popupTriggeredFromEffect = false;
      hideUL();
    }
  );
  const ToolbarComponent = () => (
    <div
      class="flex whitespace-nowrap absolute bottom-[80px] left-[50%] -translate-x-[50%] z-[10000] bg-white rounded-sm max-w-full w-max"
      getElement={(element: HTMLElement) => {
        wrapper = element as HTMLDivElement;
      }}
    >
      <input
        type="text"
        placeholder="Search node types"
        class="p-1 m-1 relative max-w-[220px] mr-0 w-[calc(100%-50px)]"
        name="search-node-types"
        autocomplete="off"
        keyup={(event: KeyboardEvent) => {
          if (event.key === 'Escape') {
            (event.target as HTMLInputElement).value = '';
            hideUL();
          }
        }}
        input={(event: InputEvent) => {
          event.preventDefault();
          if (!showUL()) {
            return;
          }
          isInReplaceeMode = false;
          const input = event.target as HTMLInputElement;
          console.log('input', input.value);
          const tasks = taskList.filter((task) =>
            task.label
              .toLocaleLowerCase()
              .includes((input.value ?? '').toLocaleLowerCase())
          );
          fillTaskList(tasks);

          return false;
        }}
      />
      <button
        tabindex={-1}
        class="text-black bg-white h-[40px] ml-auto px-1 z-[10000]"
        click={() => {
          if (!wrapper) {
            return;
          }
          if (toggle) {
            hideUL();
          }
        }}
      >
        <span
          getElement={(element: HTMLSpanElement) => (icon = element)}
          class="icon icon-arrow_drop_down"
        ></span>
      </button>
    </div>
  );
  return <ToolbarComponent />;
}
