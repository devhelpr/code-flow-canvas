import { INodeComponent } from '../interfaces/element';

export const GridCellNeighbourType = {
  topLeft: 'topLeft',
  topCenter: 'topCenter',
  topRight: 'topRight',
  left: 'left',
  right: 'right',
  bottomLeft: 'bottomLeft',
  bottomCenter: 'bottomCenter',
  bottomRight: 'bottomRight',
} as const;

export type GridCellNeighbourType =
  (typeof GridCellNeighbourType)[keyof typeof GridCellNeighbourType];

export type GridCellNeighbour<T> = {
  cell: BaseCell<T>;
  type: GridCellNeighbourType;
};

export abstract class BaseGrid<T> {
  constructor() {
    //
  }

  abstract cells: BaseCell<T>[];
  abstract findCellForNode(node: INodeComponent<T>): BaseCell<T> | undefined;
  abstract findCellContainingNode(
    node: INodeComponent<T>
  ): BaseCell<T> | undefined;
  abstract addCell(cell: BaseCell<T>): void;
  abstract searchNeighbours(cell: BaseCell<T>): GridCellNeighbour<T>[];
}

export abstract class BaseCell<T> {
  abstract neighbours: { cell: BaseCell<T>; type: GridCellNeighbourType }[];
  abstract grid: BaseGrid<T>;
  abstract nodes: INodeComponent<T>[];
  abstract cellTopLeft(): BaseCell<T> | undefined;
  abstract cellTop(): BaseCell<T> | undefined;
  abstract cellTopRight(): BaseCell<T> | undefined;
  abstract cellLeft(): BaseCell<T> | undefined;
  abstract cellRight(): BaseCell<T> | undefined;
  abstract cellBottomLeft(): BaseCell<T> | undefined;
  abstract cellBottom(): BaseCell<T> | undefined;
  abstract cellBottomRight(): BaseCell<T> | undefined;
  abstract deleteNode(node: INodeComponent<T>): void;
  abstract addNode(node: INodeComponent<T>): void;
}

export class Grid<T> extends BaseGrid<T> {
  findCellForNode(node: INodeComponent<T>): Cell<T> | undefined {
    return this.cells.find((baseCell) => {
      const cell = baseCell as Cell<T>;
      if (
        node.x >= cell.x &&
        node.x <= cell.x + this.cellWidth &&
        node.y >= cell.y &&
        node.y <= cell.y + this.cellHeight
      ) {
        return true;
      }
      return false;
    });
  }
  findCellContainingNode(node: INodeComponent<T>): Cell<T> | undefined {
    return this.cells.find((cell) => cell.nodes.includes(node)) as
      | Cell<T>
      | undefined;
  }
  addCell(cell: Cell<T>): void {
    this.cells.push(cell);
    cell.neighbours = this.searchNeighbours(cell);
  }
  searchNeighbours(cell: Cell<T>): GridCellNeighbour<T>[] {
    const neighbours: { cell: Cell<T>; type: GridCellNeighbourType }[] = [];
    this.cells.forEach((baseCell) => {
      const neighbour = baseCell as Cell<T>;
      if (neighbour.x >= cell.x - this.cellWidth && neighbour.x < cell.x) {
        if (neighbour.y >= cell.y - this.cellHeight && neighbour.y < cell.y) {
          neighbours.push({
            cell: neighbour,
            type: GridCellNeighbourType.topLeft,
          });
        } else if (
          neighbour.y > cell.y &&
          neighbour.y < cell.y + this.cellHeight
        ) {
          neighbours.push({
            cell: neighbour,
            type: GridCellNeighbourType.left,
          });
        } else if (
          neighbour.y >= cell.y + this.cellHeight &&
          neighbour.y < cell.y + this.cellHeight * 2
        ) {
          neighbours.push({
            cell: neighbour,
            type: GridCellNeighbourType.bottomLeft,
          });
        }
      }

      if (neighbour.x >= cell.x && neighbour.x < cell.x + this.cellWidth) {
        if (neighbour.y > cell.y - this.cellHeight && neighbour.y < cell.y) {
          neighbours.push({
            cell: neighbour,
            type: GridCellNeighbourType.topCenter,
          });
        } else if (
          neighbour.y >= cell.y + this.cellHeight &&
          neighbour.y < cell.y + this.cellHeight * 2
        ) {
          neighbours.push({
            cell: neighbour,
            type: GridCellNeighbourType.bottomCenter,
          });
        }
      }

      if (
        neighbour.x >= cell.x + this.cellWidth &&
        neighbour.x < cell.x + this.cellWidth * 2
      ) {
        if (neighbour.y > cell.y - this.cellHeight && neighbour.y < cell.y) {
          neighbours.push({
            cell: neighbour,
            type: GridCellNeighbourType.topRight,
          });
        } else if (
          neighbour.y >= cell.y &&
          neighbour.y < cell.y + this.cellHeight
        ) {
          neighbours.push({
            cell: neighbour,
            type: GridCellNeighbourType.right,
          });
        } else if (
          neighbour.y >= cell.y + this.cellHeight &&
          neighbour.y < cell.y + this.cellHeight * 2
        ) {
          neighbours.push({
            cell: neighbour,
            type: GridCellNeighbourType.bottomRight,
          });
        }
      }
    });

    return neighbours;
  }
  constructor(cellWidth: number, cellHeight: number) {
    super();
    this.cellWidth = cellWidth;
    this.cellHeight = cellHeight;
  }
  cells: Cell<T>[] = [] as Cell<T>[];

  cellWidth: number;
  cellHeight: number;
}

export class Cell<T> extends BaseCell<T> {
  neighbours: { cell: BaseCell<T>; type: GridCellNeighbourType }[] = [];
  constructor(x: number, y: number, grid: Grid<T>) {
    super();
    this.x = x;
    this.y = y;
    this.grid = grid;
    this.nodes = [];
  }
  cellTopLeft(): Cell<T> | undefined {
    return this.neighbours.find(
      (neighbour) => neighbour.type === GridCellNeighbourType.topLeft
    )?.cell as Cell<T>;
  }
  cellTop(): Cell<T> | undefined {
    return this.neighbours.find(
      (neighbour) => neighbour.type === GridCellNeighbourType.topCenter
    )?.cell as Cell<T>;
  }
  cellTopRight(): Cell<T> | undefined {
    return this.neighbours.find(
      (neighbour) => neighbour.type === GridCellNeighbourType.topRight
    )?.cell as Cell<T>;
  }
  cellLeft(): Cell<T> | undefined {
    return this.neighbours.find(
      (neighbour) => neighbour.type === GridCellNeighbourType.left
    )?.cell as Cell<T>;
  }
  cellRight(): Cell<T> | undefined {
    return this.neighbours.find(
      (neighbour) => neighbour.type === GridCellNeighbourType.right
    )?.cell as Cell<T>;
  }
  cellBottomLeft(): Cell<T> | undefined {
    return this.neighbours.find(
      (neighbour) => neighbour.type === GridCellNeighbourType.bottomLeft
    )?.cell as Cell<T>;
  }
  cellBottom(): Cell<T> | undefined {
    return this.neighbours.find(
      (neighbour) => neighbour.type === GridCellNeighbourType.bottomCenter
    )?.cell as Cell<T>;
  }
  cellBottomRight(): Cell<T> | undefined {
    return this.neighbours.find(
      (neighbour) => neighbour.type === GridCellNeighbourType.bottomRight
    )?.cell as Cell<T>;
  }
  deleteNode(node: INodeComponent<T>) {
    this.nodes = this.nodes.filter((n) => n !== node);
  }
  addNode(node: INodeComponent<T>) {
    this.nodes.push(node);
  }
  x: number;
  y: number;
  grid: Grid<T>;
  nodes: INodeComponent<T>[];
}

export const createGrid = <T>(cellWidth: number, cellHeight: number) => {
  const grid = new Grid<T>(cellWidth, cellHeight);
  return grid;
};
