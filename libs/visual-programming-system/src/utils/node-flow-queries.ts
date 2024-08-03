import { IRectNodeComponent } from '../interfaces';
import { ConnectionControllerType } from '../types';

export const hasNodeInputs = <T>(node: IRectNodeComponent<T>) => {
  return (
    node.thumbConnectors?.some(
      (thumb) => thumb.connectionControllerType === ConnectionControllerType.end
    ) ?? false
  );
};
