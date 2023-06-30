import { INodeComponent } from '../interfaces/element';
import { Grid, Cell } from './grid';

interface Test {
  test: string;
}

describe('Grid', () => {
  it('should be defined', () => {
    const grid = new Grid<Test>(100, 100);
    expect(grid).toBeDefined();
    for (let i = 0; i < 100; i++) {
      for (let j = 0; j < 100; j++) {
        grid.cells.push(new Cell<Test>(i * 100, j * 100, grid));
      }
    }
    grid.cells.forEach((cell) => {
      const neighbours = grid.searchNeighbours(cell);
      expect(neighbours.length).toBeLessThanOrEqual(8);
      cell.neighbours = neighbours;
    });

    const node = { x: 150, y: 150 } as INodeComponent<Test>;
    const cell = grid.findCellForNode(node);
    expect(cell).toBeDefined();
    expect(cell?.x).toBe(100);
    expect(cell?.y).toBe(100);

    const node2 = { x: 550, y: 1050 } as INodeComponent<Test>;
    const cell2 = grid.findCellForNode(node2);
    expect(cell2).toBeDefined();
    expect(cell2?.x).toBe(500);
    expect(cell2?.y).toBe(1000);
  });
});
