import {
  IConnectionNodeComponent,
  INodeComponent,
  NodeType,
} from '@devhelpr/visual-programming-system';
import { getStartNodes } from '../simple-flow-engine/simple-flow-engine';
import { Exporter } from './Exporter';
import { NodeInfo } from '@devhelpr/web-flow-executor';

export const exportCode = (exportInfo: Exporter) => {
  let canExport = true;
  const supportedNodeTypes = ['value', 'expression', 'show-value'];
  exportInfo.canvasApp?.elements.forEach((element) => {
    const node = element as INodeComponent<NodeInfo>;
    if (node.nodeType === NodeType.Connection) {
      return;
    }
    if (supportedNodeTypes.indexOf(node.nodeInfo?.type ?? '') < 0) {
      canExport = false;
    }
  });
  if (!canExport) {
    alert(
      'Only value/expression and show-value nodes can currently be exported (this feature is under development).'
    );
    return;
  }
  if (!exportInfo.canvasApp?.elements) {
    return;
  }
  let code = '';
  const globalsSet: Record<string, boolean> = {};
  exportInfo.canvasApp?.elements.forEach((element) => {
    const node = element as INodeComponent<NodeInfo>;

    if (
      node.nodeInfo?.type &&
      supportedNodeTypes.indexOf(node.nodeInfo?.type) >= 0
    ) {
      if (
        !node.nodeInfo.compileInfo ||
        !node.nodeInfo.compileInfo.getGlobalCode
      ) {
        return;
      }
      if (!globalsSet[node.nodeInfo?.type]) {
        code += node.nodeInfo?.compileInfo?.getGlobalCode();
      }
      globalsSet[node.nodeInfo?.type] = true;
    }
  });
  const getConnections = (node: INodeComponent<NodeInfo>) => {
    const connections: IConnectionNodeComponent<NodeInfo>[] = [];
    if (exportInfo.canvasApp?.elements) {
      exportInfo.canvasApp?.elements.forEach((element) => {
        const connection = element as IConnectionNodeComponent<NodeInfo>;
        if (connection.nodeType === NodeType.Connection) {
          if (connection.startNode?.id === node.id) {
            connections.push(connection);
          }
        }
      });
    }
    return connections;
  };

  let lineIndex = 0;

  const getCodeForNode = (
    node: INodeComponent<NodeInfo>,
    outputVar: string
  ) => {
    const connections = getConnections(node);
    connections.forEach((connection) => {
      if (connection.endNode) {
        code += `const output${lineIndex} = ${connection?.endNode?.nodeInfo?.compileInfo?.getCode?.(
          outputVar
        )}`;
        code += `\

`;
        const outputVarName = `output${lineIndex}`;
        lineIndex++;
        getCodeForNode(connection.endNode, outputVarName);
      }
    });
  };
  const startNodes = getStartNodes(exportInfo.canvasApp?.elements);
  startNodes.forEach((element) => {
    const node = element as INodeComponent<NodeInfo>;
    if (
      node.nodeInfo?.type &&
      supportedNodeTypes.indexOf(node.nodeInfo?.type) >= 0
    ) {
      if (!node.nodeInfo.compileInfo || !node.nodeInfo.compileInfo.getCode) {
        return;
      }
      code += `const output${lineIndex} = ${node.nodeInfo?.compileInfo?.getCode(
        ''
      )}`;
      code += `\

`;
      const outputVarName = `output${lineIndex}`;
      lineIndex++;
      getCodeForNode(node, outputVarName);
    }
  });

  exportInfo.downloadFile(code, 'flow.ts', 'text/javascript');
};
