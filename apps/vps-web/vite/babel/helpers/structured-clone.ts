// TODO : upgrade to NodesJS v17+ on windows...
export const structuredCloneHelper = (input: any) => {
  if (typeof structuredClone !== 'undefined') {
    return structuredClone(input);
  }
  return { ...input };
};
