import { IElementNode } from '@devhelpr/visual-programming-system';
import { NodeInfo } from '../../types/node-info';

export interface StructureInfo {
  rowCount: number;
  columnCount: number;
}

function createGridView(
  grid: any[][],
  htmlNode: IElementNode<NodeInfo>,
  structureInfo: StructureInfo
) {
  const asHtml = grid
    .map((data, index) => {
      const rowHtml = data
        .map((data, index) => {
          return `<div class="border-1 border-white border-solid">${data}</div>`;
        })
        .join('');

      return `<div class="gap-2 grid" style="grid-column:1 / -1; grid-template-columns:subgrid; grid-row:${
        index + 1
      }">${rowHtml}</div>`;
    })
    .join('');

  (
    htmlNode.domElement as unknown as HTMLElement
  ).innerHTML = `<div class="grid" style="grid-template-columns:${'1fr '.repeat(
    structureInfo.columnCount
  )};">${asHtml}</div>`;
}

export function showGridData(
  grid: any[][],
  structureInfo: StructureInfo,
  htmlNode: IElementNode<NodeInfo>
) {
  createGridView(grid, htmlNode, structureInfo);
}
