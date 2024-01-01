import { IElementNode } from '@devhelpr/visual-programming-system';
import { NodeInfo } from '../../types/node-info';

function createDictionaryView(
  dictionary: Record<string, any>,
  keys: string[],
  htmlNode: IElementNode<NodeInfo>,
  pageIndex = 0,
  pageSize = 5
) {
  let asHtml = keys
    .map((key, index) => {
      if (index >= pageIndex * pageSize && index < (pageIndex + 1) * pageSize) {
        return `
		  <div class="flex flex-row">
			<div class="flex-grow text-left">${key}</div>
			<div class="flex-grow text-right">${dictionary[key]}</div>
		  </div>`;
      }
      return '';
    })
    .join('');
  asHtml += `<div class="flex flex-row items-center"><div>Size: ${
    keys.length
  } page: ${pageIndex + 1}</div>
		<button class="previous-page icon icon-arrow_left text-3xl disabled:text-gray-800"></button>
		<button class="next-page icon icon-arrow_right text-3xl disabled:text-gray-800"></button>
	  </div>`;

  (htmlNode.domElement as unknown as HTMLElement).innerHTML = asHtml;
}

export function showDictionaryData(
  dictionary: Record<string, any>,
  htmlNode: IElementNode<NodeInfo>,
  _isGlobal: boolean
) {
  const keys = Object.keys(dictionary);
  let pageIndex = 0;
  const pageSize = 5;
  createDictionaryView(dictionary, keys, htmlNode, 0, pageSize);

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

      if (pageIndex >= Math.ceil(keys.length / pageSize) - 1) {
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
          createDictionaryView(dictionary, keys, htmlNode, pageIndex, pageSize);
          setEvents();
        } else {
          enableDisableButtons();
        }
      });
    }
    if (nextPageButton) {
      nextPageButton.addEventListener('click', () => {
        if (pageIndex < Math.ceil(keys.length / pageSize) - 1) {
          pageIndex++;
          createDictionaryView(dictionary, keys, htmlNode, pageIndex, pageSize);
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
