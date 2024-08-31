export const getConnectionCssClasses = () => {
  return {
    containerCssClasses: `connection absolute top-0 left-0 pointer-events-none`,
    pathTransparentCssClasses: `connection-background-path pointer-events-stroke cursor-pointer opacity-75`,
    pathCssClasses: `connection-path pointer-events-none`,
    textCssClasses: `connection-value-label absolute top-0 left-0 cursor-pointer pointer-events-none text-white bg-black px-1 z-[5] text-xs`,
    layer2: 'layer-2',
    layer1: 'layer-1',
    draggingPointerAuto: 'pointer-events-auto',
    draggingPointerNone: 'pointer-events-none',
    arrowMarker: 'arrow-marker',
  };
};
