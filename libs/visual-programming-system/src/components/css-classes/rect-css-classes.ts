export const getRectNodeCssClasses = () => {
  return {
    defaultRectClasses: 'rect-node',
    defaultRectThumbClasses: 'rect-thumb-node',
    rectClasses: `absolute top-0 left-0 select-none`,
    rectCompiledMarkupClasses: `overflow-hidden`,
    thumbClasses: `top-0 left-0 origin-center z-[1150]`,
    thumbInvisible: `'invisible pointer-events-none'`,
    rectThumbTooltipClasses: `rect-thumb-tooltip pointer-events-node z-0 absolute hidden -top-[20px] translate-x-[calc(-50%+25px)] p-0.5 left-0 whitespace-nowrap text-[8px]`,
    dropping: `dropping`,
    droppingCursorPointer: 'cursor-pointer',
    droppingNotAllowed: 'cursor-not-allowed',
    dragging: 'dragging',
    draggingNoPointer: 'pointer-events-none',
    draggingPointerAuto: 'pointer-events-auto',
  };
};
