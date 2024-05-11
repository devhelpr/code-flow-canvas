import {
  renderElement,
  createJSXElement,
  createEffect,
  getSelectedNode,
  INodeComponent,
  IRectNodeComponent,
  NodeType,
} from '@devhelpr/visual-programming-system';
import { ITasklistItem } from '../interfaces/TaskListItem';

/*
	TODO:

	- create custom canvasClick event
	- listen to canvasClick event on body .. and close UL
	- submit canvasClick event on body from canvas component
	- when node is selected and item is clicked and it is a replacement node-type, then replace the node
		if it is different then the selected node


	const event = new Event("build");

	// Listen for the event.
	elem.addEventListener(
	"build",
	(e) => {
	//},
	false,
	);

	// Dispatch the event.
	elem.dispatchEvent(event);


*/

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

  createEffect(() => {
    selectedNode = undefined;
    const selectedNodeInfo = getSelectedNode();
    if (selectedNodeInfo) {
      const info = props.getNode(
        selectedNodeInfo.id,
        selectedNodeInfo.containerNode as IRectNodeComponent<T>
      );
      selectedNode = info.node;
      console.log(
        'Toolbar selectedNodeInfo',
        selectedNodeInfo,
        //info,
        getTasksWhichAreInterchangeableWithSelectedNode()
      );

      if (!showUL()) {
        return;
      }
      fillTaskList(getTasksWhichAreInterchangeableWithSelectedNode());
    } else {
      hideUL();
    }
  });

  function getTasksWhichAreInterchangeableWithSelectedNode() {
    if (!selectedNode || selectedNode.nodeType !== NodeType.Shape) {
      return [];
    }
    const rectNode = selectedNode as IRectNodeComponent<T>;

    return taskList.filter((task) => {
      if (task.thumbs.length === rectNode.thumbs.length) {
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
        class="absolute bg-white bottom-[50px] w-full toolbar-task-list"
        getElement={(element: HTMLElement) => {
          ul = element as HTMLUListElement;
        }}
      ></ul>
    );
  };

  function fillTaskList(tasks: ITasklistItem[]) {
    if (!ul) {
      return;
    }
    ul.innerHTML = '';

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
              if (selectedNode !== undefined) {
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
    if (ul) {
      toggle = false;
      ul.remove();
      ul = null;
    }
  }

  const ToolbarComponent = () => (
    <div
      class="absolute bottom-[80px] left-[50%] -translate-x-[50%] z-[10000] bg-white rounded-sm"
      getElement={(element: HTMLElement) => {
        wrapper = element as HTMLDivElement;
      }}
    >
      <input
        type="text"
        class="p-2 m-2 relative max-w-[220px] mr-0"
        name="search-node-types"
        autocomplete="off"
        input={(event: InputEvent) => {
          event.preventDefault();
          if (!showUL()) {
            return;
          }
          const input = event.target as HTMLInputElement;
          console.log('input', input.value);
          const tasks = taskList.filter((task) =>
            task.label.includes(input.value)
          );
          fillTaskList(tasks);

          return false;
        }}
      />
      <button
        class="text-black bg-white h-[40px] px-2 z-[10000]"
        click={() => {
          if (!wrapper) {
            return;
          }
          if (toggle) {
            showDropIcon();
            if (ul) {
              ul.remove();
              ul = null;
            }
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
