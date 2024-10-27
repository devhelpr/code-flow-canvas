import { INodeComponent } from '@devhelpr/visual-programming-system';
import { NodeInfo } from '../../types/node-info';
import { toDecimalWithoutFloatErrors } from '../../utils/decimal-without-float-errors';

export const setIteratorLabel = (
  iteratorComponent: INodeComponent<NodeInfo> | undefined,
  title: string,
  startIndex: number,
  loop: number,
  iteratorLength: number
) => {
  if (iteratorComponent && iteratorComponent.domElement) {
    (
      iteratorComponent.domElement as HTMLElement
    ).innerHTML = `<div class="flex flex-col"><span class="block text-nowrap">${title}</span><span class="block text-nowrap">${startIndex} <= ${toDecimalWithoutFloatErrors(
      loop
    )} < ${iteratorLength}</span></div>`;
  }
};
