export const getNodeTransformerCssClasses = () => {
  return {
    nodeTransformerClasses: `hidden absolute top-0 left-0 z-[2000] border-white border-2 pointer-events-none rounded`,
    leftTopClasses: `absolute cursor-nwse-resize top-0 left-0 origin-top-left bg-white`,
    rightTopClasses: `absolute cursor-nesw-resize top-0 right-0 origin-top-right bg-white`,
    leftBottomClasses: `absolute cursor-nesw-resize bottom-0 left-0 origin-bottom-left bg-white`,
    rightBottomClasses: `absolute  cursor-nwse-resize bottom-0 right-0 origin-bottom-right bg-white`,
    moveNodesPanelClasses: `absolute -bottom-[48px] left-[50%] flex justify-center items-center origin-bottom-center w-[96px] h-[32px] -translate-x-[50%] gap-[8px] flex-grow flex-shrink-0`,
    downstreamNodesMoverClasses: `w-0 h-0 border-t-[12px] border-t-transparent border-r-[18px] border-r-white border-b-[12px] border-b-transparent cursor-pointer`,
    metaInfoInspectorClasses: `w-[32px] h-[32px] text-white hidden text-[32px] icon icon-info_outline cursor-pointer`,
    upstreamNodesMoverClasses: `w-0 h-0 border-t-[12px] border-t-transparent border-l-[18px] border-l-white border-b-[12px] border-b-transparent cursor-pointer`,
    hidden: 'hidden',
    pointerEventsAuto: 'pointer-events-auto',
    noPointerEvents: 'pointer-events-none',
    resizeThumbSize: 'w-[8px] h-[8px]',
    transformPosTL: '-translate-x-[50%] -translate-y-[50%]',
    transformPosTR: 'translate-x-[50%] -translate-y-[50%]',
    transformPosBL: '-translate-x-[50%] translate-y-[50%]',
    transformPosBR: 'translate-x-[50%] translate-y-[50%]',
  };
};
