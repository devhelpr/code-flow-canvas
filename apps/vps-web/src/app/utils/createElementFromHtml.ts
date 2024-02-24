import {
  createElementFromTemplate,
  createTemplate,
} from '@devhelpr/dom-components';

export const createElementFromHtml = (html: string) => {
  const template = createTemplate(`${html}`);
  return createElementFromTemplate(template);
};
