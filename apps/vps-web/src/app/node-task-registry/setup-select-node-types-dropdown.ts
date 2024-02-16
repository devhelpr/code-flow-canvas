import { createElement } from '@devhelpr/visual-programming-system';
import {
  canvasNodeTaskRegistryLabels,
  getNodeFactoryNames,
  getNodeTaskFactory,
} from './canvas-node-task-registry';
import {
  getGLNodeFactoryNames,
  getGLNodeTaskFactory,
  glNodeTaskRegistryLabels,
} from './gl-node-task-registry';

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
    category = optgroup.domElement as HTMLElement;
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

export const setupTasksInDropdown = (
  selectNodeTypeHTMLElement: HTMLSelectElement
) => {
  if (selectNodeTypeHTMLElement) {
    const nodeType = selectNodeTypeHTMLElement.value;
    let isPreviouslySelectedNodeTypeInDropdown = false;
    selectNodeTypeHTMLElement.innerHTML = '';

    const createOptgroup = (categoryName: string) =>
      createElement(
        'optgroup',
        {
          label: categoryName,
          'data-category': categoryName,
        },
        selectNodeTypeHTMLElement
      );
    createOptgroup('expression');
    createOptgroup('flow-control');
    createOptgroup('iterators');
    createOptgroup('variables');
    createOptgroup('connectivity');
    createOptgroup('functions');
    createOptgroup('string');
    createOptgroup('variables-array');
    createOptgroup('variables-dictionary');
    createOptgroup('variables-grid');
    createOptgroup('variables-set');

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

export const setupGLTasksInDropdown = (
  selectNodeTypeHTMLElement: HTMLSelectElement
) => {
  if (selectNodeTypeHTMLElement) {
    const nodeType = selectNodeTypeHTMLElement.value;
    let isPreviouslySelectedNodeTypeInDropdown = false;
    selectNodeTypeHTMLElement.innerHTML = '';

    const createOptgroup = (categoryName: string) =>
      createElement(
        'optgroup',
        {
          label: categoryName,
          'data-category': categoryName,
        },
        selectNodeTypeHTMLElement
      );
    createOptgroup('input');
    createOptgroup('output');
    createOptgroup('UI');
    createOptgroup('Math');
    createOptgroup('Compositions');
    createOptgroup('uncategorized');

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
