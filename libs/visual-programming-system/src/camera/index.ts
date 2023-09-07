let x = 0;
let y = 0;
let scale = 1;

export interface Camera {
  x: number;
  y: number;
  scale: number;
}

export const setCamera = (newX: number, newY: number, newScale: number) => {
  x = newX;
  y = newY;
  scale = newScale;
};

export const getCamera = () => {
  return { x, y, scale };
};

export const getScale = () => scale;

export const transformCameraSpaceToWorldSpace = (tx: number, ty: number) => {
  return {
    x: (tx - x) / scale,
    y: (ty - y) / scale,
  };
};
