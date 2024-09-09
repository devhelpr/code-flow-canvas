import { createElement } from '@devhelpr/visual-programming-system';

export const createOption = (
  selectElement: HTMLSelectElement,
  value: string,
  text: string,
  categoryName: string
) => {
  let category = selectElement.querySelector(
    "[data-category='" + categoryName + "']"
  );
  if (!category) {
    const optgroup = createElement(
      'optgroup',
      {
        label: categoryName,
        'data-category': categoryName,
      },
      selectElement
    );
    if (optgroup) {
      category = optgroup.domElement as HTMLElement;
    }
  }
  const option = createElement(
    'option',
    {
      value: value,
    },
    category as HTMLElement,
    text
  );
  return option;
};
