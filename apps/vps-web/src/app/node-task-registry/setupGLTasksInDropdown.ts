import { createElement } from '@devhelpr/visual-programming-system';
import {
  getGLNodeFactoryNames,
  getGLNodeTaskFactory,
  glNodeTaskRegistryLabels,
} from './gl-node-task-registry';
import { createOption } from './createOption';

const createOptgroup = (
  categoryName: string,
  selectNodeTypeHTMLElement: HTMLSelectElement
) =>
  createElement(
    'optgroup',
    {
      label: categoryName,
      'data-category': categoryName,
    },
    selectNodeTypeHTMLElement
  );

export const createOptionGLGroups = (
  selectNodeTypeHTMLElement: HTMLSelectElement
) => {
  createOptgroup('input', selectNodeTypeHTMLElement);
  createOptgroup('output', selectNodeTypeHTMLElement);
  createOptgroup('UI', selectNodeTypeHTMLElement);
  createOptgroup('Math', selectNodeTypeHTMLElement);
  createOptgroup('Compositions', selectNodeTypeHTMLElement);
  createOptgroup('uncategorized', selectNodeTypeHTMLElement);
};

export const setupGLTasksInDropdown = (
  selectNodeTypeHTMLElement: HTMLSelectElement,
  isInComposition?: boolean,
  compositionId?: string
) => {
  if (selectNodeTypeHTMLElement) {
    const nodeType = selectNodeTypeHTMLElement.value;
    let isPreviouslySelectedNodeTypeInDropdown = false;
    selectNodeTypeHTMLElement.innerHTML = '';

    createOptionGLGroups(selectNodeTypeHTMLElement);

    const nodeTasks = getGLNodeFactoryNames();
    nodeTasks.forEach((nodeTask) => {
      const factory = getGLNodeTaskFactory(nodeTask);
      let categoryName = 'Default';
      if (factory) {
        const node = factory(() => {
          // dummy canvasUpdated function
        });
        if (node.isContained) {
          return;
        }
        if (node.hideFromNodeTypeSelector) {
          if (
            !isInComposition ||
            (isInComposition && !node.useInCompositionOnly)
          ) {
            return;
          }
        }

        if (
          isInComposition &&
          nodeTask === `composition-${compositionId}` &&
          compositionId
        ) {
          return;
        }

        categoryName = node.category || 'uncategorized';
      }
      if (nodeTask === nodeType) {
        isPreviouslySelectedNodeTypeInDropdown = true;
      }
      const label = glNodeTaskRegistryLabels[nodeTask] || nodeTask;
      createOption(selectNodeTypeHTMLElement, nodeTask, label, categoryName);
    });
    if (isPreviouslySelectedNodeTypeInDropdown) {
      selectNodeTypeHTMLElement.value = nodeType;
    } else {
      const firstNodeOfFirstOptgroupElement =
        selectNodeTypeHTMLElement.querySelector('optgroup')?.firstChild;
      if (firstNodeOfFirstOptgroupElement) {
        const defaultSelectedNodeType = (
          firstNodeOfFirstOptgroupElement as HTMLElement
        ).getAttribute('value');
        if (defaultSelectedNodeType) {
          selectNodeTypeHTMLElement.value = defaultSelectedNodeType;
        }
      }
    }
  }
};
