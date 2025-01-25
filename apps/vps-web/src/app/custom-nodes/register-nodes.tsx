import { RegisterNodeFactoryFunction } from '@devhelpr/web-flow-executor';
import { mermaidNodeName, getMermaidNode } from './mermaid';
import { rectNodeName, getRectNode } from './rect-node';

export const registerNodes = (
  registerNodeFactory: RegisterNodeFactoryFunction
) => {
  //registerNodeFactory('test-external-node', getExternalTestNode());
  registerNodeFactory(mermaidNodeName, getMermaidNode());
  registerNodeFactory(rectNodeName, getRectNode());
};
