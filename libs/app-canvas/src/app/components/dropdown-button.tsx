import { createJSXElement } from '@devhelpr/visual-programming-system';
import {
  navBarDropdownButton,
  navBarDropdownIconButton,
} from '../consts/classes';

export interface DropdownButtonProps {
  class: string;
  caption: string;
  onClick: () => void;
  mainBgColorClass: string;
  bgColorClasses: string;
  textColorClasses: string;
  dropdownItems: {
    caption: string;
    onClick: () => void;
  }[];
}

export const DropdownButton = (props: DropdownButtonProps) => {
  let wrapperElement: HTMLDivElement | null = null;
  let ulElement: HTMLUListElement | null = null;
  let toggle: boolean = false;
  window.addEventListener('resize', () => {
    if (wrapperElement) {
      toggle = false;
      wrapperElement.classList.remove('open');
    }
  });
  document.body.addEventListener('click', () => {
    if (wrapperElement && toggle) {
      toggle = false;
      wrapperElement.classList.remove('open');
    }
  });
  return (
    <div
      class="flex flex-row gap-0 relative group"
      getElement={(element: HTMLDivElement) => {
        wrapperElement = element;
      }}
    >
      <button
        class={`${navBarDropdownButton} ${props.bgColorClasses} ${props.textColorClasses} ${props.class}`}
        click={props.onClick}
      >
        {props.caption}
      </button>
      <button
        class={`${navBarDropdownIconButton} ${props.bgColorClasses} ${props.textColorClasses}`}
        click={(event: MouseEvent) => {
          event.stopPropagation();
          event.preventDefault();
          toggle = !toggle;
          if (toggle) {
            const bounds = wrapperElement!.getBoundingClientRect();
            ulElement!.style.top = `${bounds.top + 48}px`;
            ulElement!.style.right = `${
              window.innerWidth - bounds.right + 8
            }px`;

            wrapperElement?.classList.add('open');
          } else {
            wrapperElement?.classList.remove('open');
          }
          return false;
        }}
      >
        <span class={`icon icon-arrow_drop_down`}></span>
      </button>
      <ul
        id="popover"
        getElement={(element: HTMLUListElement) => {
          ulElement = element;
        }}
        class={`fixed hidden group-[.open]:flex ${props.mainBgColorClass} p-4 rounded-md flex-col gap-2`}
      >
        {props.dropdownItems.map((item) => (
          <li class={`text-white ${props.textColorClasses}`}>
            <button
              class="appearance-none"
              click={(event: MouseEvent) => {
                event.preventDefault();
                item.onClick();
                toggle = false;
                wrapperElement?.classList.remove('open');
                return false;
              }}
            >
              {item.caption}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
};
