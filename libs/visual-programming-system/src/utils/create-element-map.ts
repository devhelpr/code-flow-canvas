import { ElementNodeMap } from '../interfaces/element';
import { BaseNodeInfo } from '../types/base-node-info';

export const createElementMap = <T extends BaseNodeInfo>() => {
  return new Map() as ElementNodeMap<T>;
};
