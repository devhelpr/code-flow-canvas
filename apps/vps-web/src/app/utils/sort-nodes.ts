export const getSortedNodes = (nodes: { x: number; y: number }[]) => {
  return nodes.toSorted((a, b) => {
    const aHelper = `${Math.floor(a.y / 100)
      .toFixed(2)
      .padStart(8, '0')}_${a.x.toFixed(2).padStart(8, '0')}`;
    const bHelper = `${Math.floor(b.y / 100)
      .toFixed(2)
      .padStart(8, '0')}_${b.x.toFixed(2).padStart(8, '0')}`;
    if (aHelper < bHelper) {
      return -1;
    }
    if (aHelper > bHelper) {
      return 1;
    }
    return 0;
  });
};
