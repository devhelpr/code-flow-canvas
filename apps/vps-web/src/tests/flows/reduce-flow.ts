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
    outputs: []
  },
  default_1: {
    id: "0f055b0b-edb2-4561-8c27-c24d8eb5e18e",
    type: "value",
    name: "default_1",
    group: "endpoints",
    outputs: []
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
          id: "645ce52d-1d2b-4ce7-ab91-a8a2171b25cf",
          x: 5994.58920797691,
          y: 1665.5046274882786,
          width: 150,
          height: 155,
          nodeType: "Shape",
          nodeInfo: {
            type: "range",
            formValues: {},
            nodeCannotBeReplaced: false,
            showFormOnlyInPopup: false,
            useInCompositionOnly: false,
            keepPopupOpenAfterUpdate: false
          }
        },
        {
          id: "a7051964-83de-411d-86eb-434d4ca996b4",
          x: 6367.584435534034,
          y: 1708.6025659639354,
          width: 110,
          height: 110,
          nodeType: "Shape",
          nodeInfo: {
            type: "reduce",
            formValues: {}
          }
        },
        {
          id: "46e0fd4f-7c44-4365-959c-2a186cea0679",
          x: 6574.739856906574,
          y: 1845.910920022651,
          width: 200,
          height: 100,
          nodeType: "Shape",
          nodeInfo: {
            type: "expression",
            formValues: {
              expression: "value + accumulator",
              inputType: "number"
            },
            showFormOnlyInPopup: true,
            isSettingsPopup: true
          }
        },
        {
          id: "ac2d0d5b-9127-4191-8b07-01b8f5d0b494",
          x: 6612.754858278263,
          y: 1665.5244208912698,
          width: 119.9999624347368,
          height: 56.0000850003137,
          nodeType: "Shape",
          nodeInfo: {
            type: "show-input",
            formValues: {
              name: "",
              ["data-type"]: "default"
            },
            initializeOnStartFlow: true,
            isSettingsPopup: true
          }
        },
        {
          id: "5b874b80-5c68-4c15-8a2a-3f94a4f469f2",
          x: 5670.198669023184,
          y: 1585.2209815139754,
          width: 200,
          height: 112,
          nodeType: "Shape",
          nodeInfo: {
            type: "value",
            formValues: {
              value: "9"
            }
          }
        },
        {
          id: "0f055b0b-edb2-4561-8c27-c24d8eb5e18e",
          x: 5670.198798830631,
          y: 1717.220911649806,
          width: 200,
          height: 112,
          nodeType: "Shape",
          nodeInfo: {
            type: "value",
            formValues: {
              value: "11"
            }
          }
        },
        {
          id: "bb0057d8-6b38-48ec-a233-543ccc0bd9ad",
          x: 6144.58920797691,
          y: 1743.0046274882786,
          endX: 6367.584435534034,
          endY: 1763.6025659639354,
          startNodeId: "645ce52d-1d2b-4ce7-ab91-a8a2171b25cf",
          endNodeId: "a7051964-83de-411d-86eb-434d4ca996b4",
          startThumbName: "output",
          endThumbName: "input",
          lineType: "BezierCubic",
          nodeType: "Connection",
          layer: 1,
          nodeInfo: {}
        },
        {
          id: "98d6a6e9-5fd1-4dfd-bf4b-f8e457d451b3",
          x: 6477.584435534034,
          y: 1788.6025659639354,
          endX: 6574.739856906574,
          endY: 1895.910920022651,
          startNodeId: "a7051964-83de-411d-86eb-434d4ca996b4",
          endNodeId: "46e0fd4f-7c44-4365-959c-2a186cea0679",
          startThumbName: "output2",
          endThumbName: "input",
          lineType: "BezierCubic",
          nodeType: "Connection",
          layer: 1,
          nodeInfo: {}
        },
        {
          id: "0724c3ee-fa07-4703-a8db-d08b839a4072",
          x: 6477.584435534034,
          y: 1738.6025659639354,
          endX: 6612.754858278263,
          endY: 1695.5244208912698,
          startNodeId: "a7051964-83de-411d-86eb-434d4ca996b4",
          endNodeId: "ac2d0d5b-9127-4191-8b07-01b8f5d0b494",
          startThumbName: "output1",
          endThumbName: "input",
          lineType: "BezierCubic",
          nodeType: "Connection",
          layer: 1,
          nodeInfo: {}
        },
        {
          id: "7aa60bd2-74f4-4e69-a9f9-c2f23d23d67a",
          x: 5870.198669023184,
          y: 1641.2209815139754,
          endX: 5994.58920797691,
          endY: 1695.5046274882786,
          startNodeId: "5b874b80-5c68-4c15-8a2a-3f94a4f469f2",
          endNodeId: "645ce52d-1d2b-4ce7-ab91-a8a2171b25cf",
          startThumbName: "output",
          endThumbName: "min",
          lineType: "BezierCubic",
          nodeType: "Connection",
          layer: 1,
          nodeInfo: {}
        },
        {
          id: "abffbd30-3699-438b-98c1-c23c9be9fa22",
          x: 5870.198798830631,
          y: 1773.220911649806,
          endX: 5994.58920797691,
          endY: 1745.5046274882786,
          startNodeId: "0f055b0b-edb2-4561-8c27-c24d8eb5e18e",
          endNodeId: "645ce52d-1d2b-4ce7-ab91-a8a2171b25cf",
          startThumbName: "output",
          endThumbName: "max",
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