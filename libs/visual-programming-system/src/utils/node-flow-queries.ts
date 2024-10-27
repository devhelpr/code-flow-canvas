import { IRectNodeComponent, ThumbConnectionType } from '../interfaces';
import { BaseNodeInfo } from '../types/base-node-info';

export const hasNodeInputs = <T extends BaseNodeInfo>(
  node: IRectNodeComponent<T>
) => {
  return (
    node.thumbConnectors?.some(
      (thumb) => thumb.thumbConnectionType === ThumbConnectionType.end
    ) ?? false
  );
};
