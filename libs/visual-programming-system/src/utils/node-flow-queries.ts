import { IRectNodeComponent, ThumbConnectionType } from '../interfaces';

export const hasNodeInputs = <T>(node: IRectNodeComponent<T>) => {
  return (
    node.thumbConnectors?.some(
      (thumb) => thumb.thumbConnectionType === ThumbConnectionType.end
    ) ?? false
  );
};
