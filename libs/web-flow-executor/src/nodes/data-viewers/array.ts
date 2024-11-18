import { IElementNode } from '@devhelpr/visual-programming-system';
import { NodeInfo } from '../../types/node-info';

function getStringForObject(object: Record<string, any>) {
  let data = '';
  for (const [key, value] of Object.entries(object)) {
    data += `<div class="flex flex-row gap-2">
      <div class="flex-grow text-left font-bold">${key}</div>
      <div class="flex-grow text-right">${value}</div>
    </div>`;
  }
  return data;
}

function createArrayView(
  array: any[],
  htmlNode: IElementNode<NodeInfo>,
  pageIndex: number,
  pageSize: number,
  isGlobal: boolean
) {
  let asHtml = (array ?? [])
    .map((data, index) => {
      if (index >= pageIndex * pageSize && index < (pageIndex + 1) * pageSize) {
        return `
		  <div class="flex flex-row justify-start text-left">
			<div class="flex-row flex flex-grow gap-4 overflow-hidden text-ellipsis">${
        typeof data === 'number'
          ? data.toFixed(2)
          : Array.isArray(data)
          ? data.map((item) => {
              return typeof item === 'number' ? item.toFixed(2) : item;
            })
          : typeof data === 'object'
          ? getStringForObject(data)
          : data
      }</div>
		  </div>`;
      }
      return '';
    })
    .join('');
  asHtml += `<div class="flex flex-row items-center"><div>Size: ${
    (array ?? []).length
  } page: ${pageIndex + 1}</div>
		<button class="previous-page icon icon-arrow_left text-3xl disabled:text-gray-800"></button>
		<button class="next-page icon icon-arrow_right text-3xl disabled:text-gray-800"></button>
	  </div><div>${isGlobal ? 'global' : 'scope dependent'}</div>`;

  (htmlNode.domElement as unknown as HTMLElement).innerHTML = asHtml;
}

export function showArrayData(
  array: any[],
  htmlNode: IElementNode<NodeInfo>,
  isGlobal: boolean
) {
  let pageIndex = 0;
  const pageSize = 5;
  createArrayView(array, htmlNode, 0, pageSize, isGlobal);

  const setEvents = () => {
    const uiElement = htmlNode.domElement as unknown as HTMLElement;
    const previousPageButton = uiElement.querySelector(
      '.previous-page'
    ) as HTMLElement;
    const nextPageButton = uiElement.querySelector('.next-page') as HTMLElement;

    function enableDisableButtons() {
      if (pageIndex <= 0) {
        previousPageButton.classList.add('disabled');
        previousPageButton.setAttribute('disabled', 'disabled');
      } else {
        previousPageButton.classList.remove('disabled');
        previousPageButton.removeAttribute('disabled');
      }

      if (pageIndex >= Math.ceil((array ?? []).length / pageSize) - 1) {
        nextPageButton.classList.add('disabled');
        nextPageButton.setAttribute('disabled', 'disabled');
      } else {
        nextPageButton.classList.remove('disabled');
        nextPageButton.removeAttribute('disabled');
      }
    }

    if (previousPageButton) {
      previousPageButton.addEventListener('click', () => {
        if (pageIndex > 0) {
          pageIndex--;
          createArrayView(array, htmlNode, pageIndex, pageSize, isGlobal);
          setEvents();
        } else {
          enableDisableButtons();
        }
      });
    }
    if (nextPageButton) {
      nextPageButton.addEventListener('click', () => {
        if (pageIndex < Math.ceil((array ?? []).length / pageSize) - 1) {
          pageIndex++;
          createArrayView(array, htmlNode, pageIndex, pageSize, isGlobal);
          setEvents();
        } else {
          enableDisableButtons();
        }
      });
    }
    enableDisableButtons();
  };

  setEvents();
}
