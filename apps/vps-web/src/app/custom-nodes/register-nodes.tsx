import { RegisterNodeFactoryFunction } from '@devhelpr/web-flow-executor';
import { mermaidNodeName, getMermaidNode } from './mermaid';

export const registerNodes = (
  registerNodeFactory: RegisterNodeFactoryFunction
) => {
  //registerNodeFactory('test-external-node', getExternalTestNode());
  registerNodeFactory(mermaidNodeName, getMermaidNode());
};
