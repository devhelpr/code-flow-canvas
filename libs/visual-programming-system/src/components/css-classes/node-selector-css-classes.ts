export const getNodeSelectorCssClasses = () => {
  return {
    nodeSelectorClasses: `hidden absolute top-0 left-0 z-[1000] border-white border-2 pointer-events-auto`,
    leftTopClasses:
      'hidden absolute cursor-nwse-resize top-0 left-0 origin-top-left bg-white',
    rightTopClasses:
      'hidden absolute cursor-nesw-resize top-0 right-0  origin-top-right bg-white',
    leftBottomClasses:
      'hidden absolute cursor-nesw-resize bottom-0 left-0 origin-bottom-left bg-white',
    rightBottomClasses:
      'absolute  cursor-nwse-resize bottom-0 right-0 origin-bottom-right bg-white',
    toolsPanelClasses: `absolute -bottom-[48px] left-[50%] flex justify-center items-center  origin-bottom-center w-[96px] h-[32px] -translate-x-[50%] gap-[8px] flex-grow flex-shrink-0`,
    createCompositionButtonClasses: `rounded-md bg-transparant border border-white border-solid text-white p-2 m-2 hover:bg-white hover:text-slate-600 select-none whitespace-nowrap disabled:border-slate-700 disabled:hover:border-slate-700 disabled:text-border-slate-700`,
  };
};
