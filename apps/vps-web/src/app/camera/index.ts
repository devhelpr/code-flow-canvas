let x = 0;
let y = 0;
let scale = 1;

export const setCamera = (newX: number, newY: number, newScale: number) => {
  x = newX;
  y = newY;
  scale = newScale;
};

export const getCamera = () => {
  return { x, y, scale };
};
