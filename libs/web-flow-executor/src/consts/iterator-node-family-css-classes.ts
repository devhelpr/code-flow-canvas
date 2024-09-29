export const getIteratorNodeFamilyCssClasses = () => {
  return {
    mainCssClasses: `inner-node p-4 rounded flex flex-row items-center justify-center text-center
            transition-colors duration-200`,
    backgroundColorCssClass: 'bg-stone-100',
    nodeActiveColorCssClass: 'bg-blue-700',
    textCssClass: 'text-black',
    nodeActiveTextCssClass: 'text-white',
    clipPath: 'polygon(20% 0%, 100% 0, 100% 100%, 20% 100%, 0% 80%, 0% 20%)',
  };
};
