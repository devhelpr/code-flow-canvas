import { Flow, FlowEndpoint,FlowMeta } from "@devhelpr/visual-programming-system";
import { NodeInfo } from "@devhelpr/web-flow-executor";
export const metaData : FlowMeta = {
  title: "Flow"
};  
export const endpoints : Record<string,FlowEndpoint> = {
  default: {
    id: "default",
    type: "default",
    name: "default",
    group: "endpoints",
    outputs: [
      {
        id: "6c97bdff-7b16-47c5-ab47-1e28dcd27a81",
        name: "test",
        type: "show-object"
      }
    ]
  }
};

export const flow: Flow<NodeInfo> = {
  schemaType: "flow",
  schemaVersion: "0.0.1",
  id: "1234",
  flows: {
    flow: {
      flowType: "flow",
      nodes: [
        {
          id: "ab9148dd-b8ba-4131-9620-f03ebe0dc4b4",
          x: 507.1974319841055,
          y: 334.703625115859,
          width: 199.99996948242188,
          height: 155,
          nodeType: "Shape",
          nodeInfo: {
            type: "fetch",
            formValues: {
              url: "https://rickandmortyapi.com/api/character/86",
              ["response-type"]: "json",
              ["http-method"]: "get"
            },
            isSettingsPopup: true
          }
        },
        {
          id: "6c97bdff-7b16-47c5-ab47-1e28dcd27a81",
          x: 890.8330792557663,
          y: 340.11906969558197,
          width: 239.99992363739122,
          height: 871.9999620835291,
          nodeType: "Shape",
          nodeInfo: {
            type: "show-object",
            formValues: {
              name: "test"
            },
            isSettingsPopup: true
          }
        },
        {
          id: "55d8ab3b-f4a9-4b26-ac00-4ed5773440e0",
          x: 707.1974014665274,
          y: 364.703625115859,
          endX: 890.8330792557663,
          endY: 370.11906969558197,
          startNodeId: "ab9148dd-b8ba-4131-9620-f03ebe0dc4b4",
          endNodeId: "6c97bdff-7b16-47c5-ab47-1e28dcd27a81",
          startThumbName: "output",
          endThumbName: "input",
          lineType: "BezierCubic",
          nodeType: "Connection",
          layer: 1,
          nodeInfo: {}
        }
      ]
    }
  },
  compositions: {}
};