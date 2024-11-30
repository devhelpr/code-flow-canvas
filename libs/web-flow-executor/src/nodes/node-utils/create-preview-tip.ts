import {
  BaseNodeInfo,
  createElement,
  IRectNodeComponent,
} from '@devhelpr/visual-programming-system';

export const createPreviewTip = <T extends BaseNodeInfo>(
  node: IRectNodeComponent<T>
) => {
  return createElement(
    'div',
    {
      class: `bg-white text-black p-4 rounded absolute bottom-[calc(100%+15px)] h-[min-content] w-full hidden
            text-center
            after:content-['']
            after:w-0 after:h-0 
            after:border-l-[10px] after:border-l-transparent
            after:border-t-[10px] after:border-t-white
            after:border-r-[10px] after:border-r-transparent
            after:absolute after:bottom-[-10px] after:left-[50%] after:transform after:translate-x-[-50%]
          `,
    },
    node?.domElement,
    'preview'
  );
};
