import {
  ElementNodeMap,
  Flow,
  IConnectionNodeComponent,
  INodeComponent,
  NodeType,
  Composition,
  cleanupNodeInfoForSerializing,
  IRectNodeComponent,
  BaseNodeInfo,
} from '@devhelpr/visual-programming-system';
import { NodeInfo, getStartNodes } from '@devhelpr/web-flow-executor';

export type SerializedFlow = ReturnType<typeof serializeElementsMap>;

export const serializeElementsMap = (elements: ElementNodeMap<NodeInfo>) => {
  const filteredElements = Array.from(elements).filter((entry) => {
    const obj = entry[1] as INodeComponent<NodeInfo>;
    if (obj.nodeType === NodeType.Connection) {
      const connection = obj as unknown as IConnectionNodeComponent<NodeInfo>;
      if (!connection.isAnnotationConnection) {
        return true;
      } else {
        return false;
      }
    }
    return true;
  });
  const nodesList = Array.from(filteredElements, function (entry) {
    const obj = entry[1] as INodeComponent<NodeInfo>;
    if (obj.nodeType === NodeType.Connection) {
      const connection = obj as unknown as IConnectionNodeComponent<NodeInfo>;
      return {
        id: connection.id,
        x: connection.x,
        y: connection.y,
        endX: connection.endX,
        endY: connection.endY,
        startNodeId: connection.startNode?.id,
        endNodeId: connection.endNode?.id,
        startThumbName: connection.startNodeThumb?.thumbName,
        endThumbName: connection.endNodeThumb?.thumbName,
        startThumbIdentifierWithinNode:
          connection.startNodeThumb?.thumbIdentifierWithinNode,
        endThumbIdentifierWithinNode:
          connection.endNodeThumb?.thumbIdentifierWithinNode,
        lineType: connection.lineType,
        nodeType: obj.nodeType,
        layer: connection.layer ?? 1,
        nodeInfo: cleanupNodeInfoForSerializing(connection.nodeInfo),
      };
    }

    let elements: any = undefined;
    if (obj.nodeInfo && obj.nodeInfo.canvasAppInstance) {
      elements = serializeElementsMap(obj.nodeInfo.canvasAppInstance.elements);

      console.log('SUB ELEMENTS FOUND ', elements);
    }
    return {
      id: obj.id,
      x: obj.x,
      y: obj.y,
      width: obj.width,
      height: obj.height,
      nodeType: obj.nodeType,
      elements,
      nodeInfo: cleanupNodeInfoForSerializing(obj.nodeInfo),
    };
  });
  return nodesList;
};

export const exportFlowToJson = <T>(
  id: string,
  nodesList: ReturnType<typeof serializeElementsMap>,
  compositions: Record<string, Composition<T>>
) => {
  const flow: Flow<T> = {
    schemaType: 'flow',
    schemaVersion: '0.0.1',
    id: id,
    flows: {
      flow: {
        flowType: 'flow',
        nodes: nodesList,
      },
    },
    compositions: compositions,
  };
  return JSON.stringify(flow, null, 2);
};

function replaceHyphenatedProps(jsonString: string) {
  // Regular expression to match property names with hyphens
  // It looks for "property-name": and captures 'property-name'
  const regex = /"([^"]+-[^"]+)":/g;

  // Replace matched property names with ["property-name"]:
  const modifiedString = jsonString.replace(regex, (_match, p1) => {
    return `["${p1}"]:`;
  });

  return modifiedString;
}

const getJSONASTypescript = (json: any) => {
  let flowString = replaceHyphenatedProps(JSON.stringify(json, null, 2));
  flowString.replace(/\\"/g, '\uFFFF'); // U+ FFFF
  flowString = flowString
    .replace(/"([^"]+)":/g, '$1:')
    .replace(/\uFFFF/g, '\\"');
  return flowString;
};

export const exportFlowToTypescript = <T extends BaseNodeInfo>(
  id: string,
  nodesList: ReturnType<typeof serializeElementsMap>,
  compositions: Record<string, Composition<T>>,
  nodes: ElementNodeMap<T>
) => {
  const flow: Flow<T> = {
    schemaType: 'flow',
    schemaVersion: '0.0.1',
    id: id,
    flows: {
      flow: {
        flowType: 'flow',
        nodes: nodesList,
      },
    },
    compositions: compositions,
  };

  let upstreamNodes: IRectNodeComponent<T>[] = [];
  const getUpstreamNodes = (node: IRectNodeComponent<T>) => {
    if (node.connections.length > 0) {
      node.connections.forEach((connection) => {
        if (connection.startNode?.id === node.id) {
          if (
            connection.endNode &&
            connection.startNode.x < connection.endNode.x &&
            !upstreamNodes.find((node) => node.id === connection.endNode?.id)
          ) {
            upstreamNodes.push(connection.endNode);
            getUpstreamNodes(connection.endNode);
          }
        }
      });
    }
  };

  const endpoints: Record<string, any> = {};
  let title: string | undefined = undefined;
  nodesList.forEach((node) => {
    if (
      node.nodeType !== NodeType.Connection &&
      node.nodeInfo.type === 'annotation' &&
      node.nodeInfo.formValues['annotation'] &&
      !title
    ) {
      title = node.nodeInfo.formValues['annotation'];
    } else if (
      node.nodeType !== NodeType.Connection &&
      (node.nodeInfo.type === 'user-input' ||
        node.nodeInfo.type === 'start-node') &&
      node.nodeInfo.formValues['name']
    ) {
      upstreamNodes = [];
      const orgNode = nodes.get(node.id);
      getUpstreamNodes(orgNode as IRectNodeComponent<T>);
      endpoints[node.nodeInfo.formValues['name']] = {
        id: node.id,
        type: node.nodeInfo.type,
        name: node.nodeInfo.formValues['name'],
        group: node.nodeInfo.formValues['group'] || 'endpoints',
        outputs: upstreamNodes
          .filter(
            (node) =>
              (node.nodeInfo as BaseNodeInfo)?.type === 'show-value' ||
              (node.nodeInfo as BaseNodeInfo)?.type === 'show-input' ||
              (node.nodeInfo as BaseNodeInfo)?.type === 'show-object'
          )
          .map((node) => {
            const helperNode =
              node as unknown as IRectNodeComponent<BaseNodeInfo>;
            return {
              id: node.id,
              name: helperNode.nodeInfo!.formValues['name'],
              type: helperNode.nodeInfo!.type,
            };
          }),
      };
    }
  });
  if (Object.entries(endpoints).length === 0) {
    // get start nodes
    endpoints['default'] = {
      id: 'default',
      type: 'default',
      name: 'default',
      group: 'endpoints',
      outputs: [],
    };
    let endpointerCounter = 0;
    getStartNodes(nodes as ElementNodeMap<NodeInfo>).forEach((node) => {
      upstreamNodes = [];
      const orgNode = nodes.get(
        node.id
      ) as unknown as INodeComponent<BaseNodeInfo>;
      if (orgNode?.nodeInfo?.type === 'annotation') {
        return;
      }
      let endpointPostFix = '';
      if (endpointerCounter > 0) {
        endpointPostFix = `_${endpointerCounter.toString()}`;
        endpoints[`default${endpointPostFix}`] = {
          id: node.id,
          type: orgNode?.nodeInfo?.type,
          name: `default${endpointPostFix}`,
          group: 'endpoints',
          outputs: [],
        };
      }
      endpointerCounter++;

      getUpstreamNodes(orgNode as IRectNodeComponent<T>);
      endpoints[`default${endpointPostFix}`].outputs = upstreamNodes
        .filter(
          (node) =>
            ((node.nodeInfo as BaseNodeInfo)?.type === 'show-value' ||
              (node.nodeInfo as BaseNodeInfo)?.type === 'show-input' ||
              (node.nodeInfo as BaseNodeInfo)?.type === 'show-object') &&
            (node.nodeInfo as BaseNodeInfo)?.formValues['name']
        )
        .map((node) => {
          const helperNode =
            node as unknown as IRectNodeComponent<BaseNodeInfo>;
          return {
            id: node.id,
            name: helperNode.nodeInfo!.formValues['name'],
            type: helperNode.nodeInfo!.type,
          };
        });
    });
  }
  const flowString = getJSONASTypescript(flow);
  const endpointsAsString = getJSONASTypescript(endpoints);
  return `import { Flow, FlowEndpoint,FlowMeta } from "@devhelpr/visual-programming-system";
import { NodeInfo } from "@devhelpr/web-flow-executor";
export const metaData : FlowMeta = {
  title: "${title || 'Flow'}"
};  
export const endpoints : Record<string,FlowEndpoint> = ${endpointsAsString};

export const flow: Flow<NodeInfo> = ${flowString};`;
};

export const serializeCompositions = <T>(
  compositions: Record<string, Composition<T>>
) => {
  const compositionsMap: Record<string, Composition<T>> = {};
  Object.entries(compositions).forEach(([_id, composition]) => {
    compositionsMap[composition.id] = {
      id: composition.id,
      name: composition.name,
      nodes: composition.nodes.map((node) => {
        return node;
        // if (node.nodeType === NodeType.Connection) {
        //   const connection =
        //     node as unknown as IConnectionNodeComponent<NodeInfo>;
        //   return {
        //     id: connection.id,
        //     x: connection.x,
        //     y: connection.y,
        //     endX: connection.endX,
        //     endY: connection.endY,
        //     startNodeId: connection.startNode?.id,
        //     endNodeId: connection.endNode?.id,
        //     startThumbName: connection.startNodeThumb?.thumbName,
        //     endThumbName: connection.endNodeThumb?.thumbName,
        //     startThumbIdentifierWithinNode:
        //       connection.startNodeThumb?.thumbIdentifierWithinNode,
        //     endThumbIdentifierWithinNode:
        //       connection.endNodeThumb?.thumbIdentifierWithinNode,
        //     lineType: connection.lineType,
        //     nodeType: node.nodeType,
        //     layer: connection.layer ?? 1,
        //     nodeInfo: cleanupNodeInfoForSerializing(connection.nodeInfo),
        //   };
        // }
        // return {
        //   id: node.id,
        //   x: node.x,
        //   y: node.y,
        //   width: node.width,
        //   height: node.height,
        //   nodeType: node.nodeType,
        //   nodeInfo: cleanupNodeInfoForSerializing(node.nodeInfo as NodeInfo),
        // };
      }),
      thumbs: composition.thumbs,
      inputNodes:
        composition.inputNodes?.map((node) => {
          return node;
          // return {
          //   id: node.id,
          //   x: node.x,
          //   y: node.y,
          //   width: node.width,
          //   height: node.height,
          //   nodeType: node.nodeType,
          //   nodeInfo: cleanupNodeInfoForSerializing(node.nodeInfo as NodeInfo),
          // };
        }) ?? [],
      outputNodes:
        composition.outputNodes?.map((node) => {
          return node;
          // return {
          //   id: node.id,
          //   x: node.x,
          //   y: node.y,
          //   width: node.width,
          //   height: node.height,
          //   nodeType: node.nodeType,
          //   nodeInfo: cleanupNodeInfoForSerializing(node.nodeInfo as NodeInfo),
          // };
        }) ?? [],
    };
  });
  return compositionsMap;
};
