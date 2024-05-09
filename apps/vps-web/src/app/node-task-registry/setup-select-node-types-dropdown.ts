import { createElement } from '@devhelpr/visual-programming-system';
import {
  canvasNodeTaskRegistryLabels,
  getNodeFactoryNames,
  getNodeTaskFactory,
} from './canvas-node-task-registry';
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

export const createOptionGroups = (
  selectNodeTypeHTMLElement: HTMLSelectElement
) => {
  createOptgroup('expression', selectNodeTypeHTMLElement);
  createOptgroup('flow-control', selectNodeTypeHTMLElement);
  createOptgroup('iterators', selectNodeTypeHTMLElement);
  createOptgroup('variables', selectNodeTypeHTMLElement);
  createOptgroup('connectivity', selectNodeTypeHTMLElement);
  createOptgroup('functions', selectNodeTypeHTMLElement);
  createOptgroup('string', selectNodeTypeHTMLElement);
  createOptgroup('variables-array', selectNodeTypeHTMLElement);
  createOptgroup('variables-dictionary', selectNodeTypeHTMLElement);
  createOptgroup('variables-grid', selectNodeTypeHTMLElement);
  createOptgroup('variables-set', selectNodeTypeHTMLElement);
  createOptgroup('Compositions', selectNodeTypeHTMLElement);
};

export const getTaskList = () => {
  const nodeTasks = getNodeFactoryNames();
  const taskList: { label: string; nodeType: string; category: string }[] = [];
  nodeTasks.forEach((nodeTask) => {
    const factory = getNodeTaskFactory(nodeTask);
    let categoryName = 'Default';
    if (factory) {
      const node = factory(() => {
        // dummy canvasUpdated function
      });
      if (node.isContained) {
        return;
      }

      categoryName = node.category || 'uncategorized';
    }

    const label = canvasNodeTaskRegistryLabels[nodeTask] || nodeTask;
    taskList.push({ label, nodeType: nodeTask, category: categoryName });
  });
  return taskList;
};

export const setupTasksInDropdown = (
  selectNodeTypeHTMLElement: HTMLSelectElement,
  isInComposition?: boolean,
  compositionId?: string
) => {
  if (selectNodeTypeHTMLElement) {
    const nodeType = selectNodeTypeHTMLElement.value;
    let isPreviouslySelectedNodeTypeInDropdown = false;
    selectNodeTypeHTMLElement.innerHTML = '';
    createOptionGroups(selectNodeTypeHTMLElement);
    const nodeTasks = getNodeFactoryNames();
    nodeTasks.forEach((nodeTask) => {
      const factory = getNodeTaskFactory(nodeTask);
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
      const label = canvasNodeTaskRegistryLabels[nodeTask] || nodeTask;
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
