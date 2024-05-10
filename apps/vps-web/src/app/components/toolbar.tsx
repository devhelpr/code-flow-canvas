import {
  renderElement,
  createJSXElement,
} from '@devhelpr/visual-programming-system';
import { ITasklistItem } from '../interfaces/TaskListItem';

const ToolbarItem = (props: {
  label: string;
  nodeType: string;
  hideToolbar: () => void;
  addNodeType: (nodeType: string) => void;
}) => {
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
};

export const Toolbar = (props: {
  getTaskList: () => ITasklistItem[];
  addNodeType: (nodeType: string) => void;
}) => {
  let toggle = false;
  let ul: HTMLUListElement | null = null;
  let wrapper: HTMLDivElement | null = null;
  let icon: HTMLSpanElement | null = null;

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
          if (!ul) {
            if (!wrapper) {
              return;
            }
            toggle = true;
            showUpIcon();
            renderElement(<UL />, wrapper);
            if (!ul) {
              return;
            }
          }
          ul.innerHTML = '';
          const input = event.target as HTMLInputElement;
          console.log('input', input.value);
          const tasks = taskList.filter((task) =>
            task.label.includes(input.value)
          );
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
                    props.addNodeType(nodeType);
                  }}
                />,
                ul
              );
            }
          });

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
};
