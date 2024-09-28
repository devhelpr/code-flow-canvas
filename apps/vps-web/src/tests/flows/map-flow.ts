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
        id: "50425834-0187-4be6-b400-54f5651d3c92",
        name: "test",
        type: "show-input"
      }
    ]
  },
  default_1: {
    id: "a438b304-8928-448e-bb12-dc0c7f274377",
    type: "value",
    name: "default_1",
    group: "endpoints",
    outputs: [
      {
        id: "50425834-0187-4be6-b400-54f5651d3c92",
        name: "test",
        type: "show-input"
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
          id: "22a3991e-0b36-4244-9826-75b63bc5403c",
          x: 604.8968443298912,
          y: 513.0083690188524,
          width: 150.00006044409335,
          height: 155.00002014803113,
          nodeType: "Shape",
          nodeInfo: {
            type: "range",
            formValues: {},
            showFormOnlyInPopup: false,
            useInCompositionOnly: false,
            taskType: "range"
          }
        },
        {
          id: "f9d33379-71bb-4380-9ba5-89e2b46116f3",
          x: 155.85915851139828,
          y: 626.618669397829,
          width: 200.00008059212445,
          height: 112.00000101076915,
          nodeType: "Shape",
          nodeInfo: {
            type: "value",
            formValues: {
              value: "10"
            },
            taskType: "value"
          }
        },
        {
          id: "a438b304-8928-448e-bb12-dc0c7f274377",
          x: 186.28487635364263,
          y: 480.2658966932551,
          width: 200.00008059212445,
          height: 112.00000101076915,
          nodeType: "Shape",
          nodeInfo: {
            type: "value",
            formValues: {
              value: "0"
            },
            taskType: "value"
          }
        },
        {
          id: "69c00cbb-ba39-4c2d-b382-03b5d29f4b68",
          x: 355.8592391035227,
          y: 682.6186699032136,
          endX: 604.8968443298912,
          endY: 593.0083690188524,
          startNodeId: "f9d33379-71bb-4380-9ba5-89e2b46116f3",
          endNodeId: "22a3991e-0b36-4244-9826-75b63bc5403c",
          startThumbName: "output",
          endThumbName: "max",
          lineType: "BezierCubic",
          nodeType: "Connection",
          layer: 1,
          nodeInfo: {}
        },
        {
          id: "6b6bb478-c79b-42cd-a951-ca77552fcbff",
          x: 386.2849569457671,
          y: 536.2658971986397,
          endX: 604.8968443298912,
          endY: 543.0083690188524,
          startNodeId: "a438b304-8928-448e-bb12-dc0c7f274377",
          endNodeId: "22a3991e-0b36-4244-9826-75b63bc5403c",
          startThumbName: "output",
          endThumbName: "min",
          lineType: "BezierCubic",
          nodeType: "Connection",
          layer: 1,
          nodeInfo: {}
        },
        {
          id: "de16cbba-3165-4e70-9df1-72e46ef61efa",
          x: 754.8969047739846,
          y: 590.5083790928679,
          endX: 883.7225234557494,
          endY: 590.167406995064,
          startNodeId: "22a3991e-0b36-4244-9826-75b63bc5403c",
          endNodeId: "29ea6ade-a1bc-430c-9dfe-512c83efca46",
          startThumbName: "output",
          endThumbName: "input",
          lineType: "BezierCubic",
          nodeType: "Connection",
          layer: 1,
          nodeInfo: {}
        },
        {
          id: "29ea6ade-a1bc-430c-9dfe-512c83efca46",
          x: 883.7225234557494,
          y: 535.167406995064,
          width: 110,
          height: 110,
          nodeType: "Shape",
          nodeInfo: {
            type: "map",
            formValues: {},
            taskType: "map"
          }
        },
        {
          id: "8f393fbb-09fd-4de2-8b29-aa49305486ab",
          x: 993.7225234557494,
          y: 615.167406995064,
          endX: 1187.253129677497,
          endY: 776.469701649987,
          startNodeId: "29ea6ade-a1bc-430c-9dfe-512c83efca46",
          endNodeId: "cb6d2ed4-510a-4e9b-9e21-573f549c20b7",
          startThumbName: "output2",
          endThumbName: "input",
          lineType: "BezierCubic",
          nodeType: "Connection",
          layer: 1,
          nodeInfo: {}
        },
        {
          id: "cb6d2ed4-510a-4e9b-9e21-573f549c20b7",
          x: 1187.253129677497,
          y: 726.469701649987,
          width: 200,
          height: 100,
          nodeType: "Shape",
          nodeInfo: {
            type: "expression",
            formValues: {
              expression: "input",
              inputType: "number"
            },
            showFormOnlyInPopup: true,
            isSettingsPopup: true,
            taskType: "expression"
          }
        },
        {
          id: "50425834-0187-4be6-b400-54f5651d3c92",
          x: 1141.6443675886683,
          y: 522.2948240568787,
          width: 119.99997961692488,
          height: 103.9999918453811,
          nodeType: "Shape",
          nodeInfo: {
            type: "show-input",
            formValues: {
              name: "test"
            },
            isSettingsPopup: true,
            taskType: "show-input"
          }
        },
        {
          id: "cdec1146-fbfc-43ee-847e-226da7917012",
          x: 993.7225234557494,
          y: 565.167406995064,
          endX: 1141.6443675886683,
          endY: 552.2948240568787,
          startNodeId: "29ea6ade-a1bc-430c-9dfe-512c83efca46",
          endNodeId: "50425834-0187-4be6-b400-54f5651d3c92",
          startThumbName: "output1",
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