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
          id: "6be80048-6e33-41b3-9e7e-0a3235e2839a",
          x: 4612.06856913936,
          y: -812.6486298792398,
          width: 200,
          height: 100,
          nodeType: "Shape",
          nodeInfo: {
            type: "expression",
            formValues: {
              expression: "input * 2",
              inputType: "number"
            },
            showFormOnlyInPopup: true,
            isSettingsPopup: true,
            supportsPreview: true
          }
        },
        {
          id: "583d4e15-035f-4434-a082-622009b4867c",
          x: 3775.2050254366177,
          y: -813.7059690511884,
          width: 200,
          height: 100,
          nodeType: "Shape",
          nodeInfo: {
            type: "expression",
            formValues: {
              expression: "5",
              inputType: "number"
            },
            showFormOnlyInPopup: true,
            isSettingsPopup: true,
            supportsPreview: true
          }
        },
        {
          id: "4eaff148-c558-4164-b9f5-8480145357cd",
          x: 5797.423308802282,
          y: -804.0636455698171,
          width: 120.00005937127604,
          height: 55.99998363947418,
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
          id: "9f7b6666-60ee-4bb4-82a9-97980a933b6d",
          x: 4524.61276449378,
          y: -1060.9154295620374,
          width: 174.4220728419782,
          height: 84.00001218181235,
          nodeType: "Shape",
          nodeInfo: {
            type: "scope-variable",
            formValues: {
              variableName: "test",
              initialValue: "",
              fieldType: "value",
              fieldValueType: "number",
              enumValues: [],
              initialEnumValue: ""
            },
            isVariable: true,
            nodeCannotBeReplaced: true
          }
        },
        {
          id: "d1982fff-8b06-49ec-9cb6-4b5099eafe79",
          x: 5423.218823011143,
          y: -829.2004895544958,
          width: 200,
          height: 100,
          nodeType: "Shape",
          nodeInfo: {
            type: "expression",
            formValues: {
              expression: "test",
              inputType: "number"
            },
            showFormOnlyInPopup: true,
            isSettingsPopup: true,
            supportsPreview: true
          }
        },
        {
          id: "83bf243d-d7bd-4438-bf5e-f77d90e8defb",
          x: 4227.680998224009,
          y: -829.743349708836,
          width: 200,
          height: 128,
          nodeType: "Shape",
          nodeInfo: {
            type: "reset-variable",
            formValues: {
              variableName: "test"
            },
            nodeCannotBeReplaced: false,
            showFormOnlyInPopup: false,
            useInCompositionOnly: false,
            keepPopupOpenAfterUpdate: false
          }
        },
        {
          id: "5dee0968-b892-48e8-9410-e23c8e0e6454",
          x: 3975.2050254366177,
          y: -763.7059690511884,
          endX: 4227.680998224009,
          endY: -765.743349708836,
          startNodeId: "583d4e15-035f-4434-a082-622009b4867c",
          endNodeId: "83bf243d-d7bd-4438-bf5e-f77d90e8defb",
          startThumbName: "output",
          endThumbName: "input",
          lineType: "BezierCubic",
          nodeType: "Connection",
          layer: 1,
          nodeInfo: {}
        },
        {
          id: "a28c34e5-e787-4f31-99bd-0a31f8b23ed0",
          x: 5623.218823011143,
          y: -779.2004895544958,
          endX: 5797.423308802282,
          endY: -774.0636455698171,
          startNodeId: "d1982fff-8b06-49ec-9cb6-4b5099eafe79",
          endNodeId: "4eaff148-c558-4164-b9f5-8480145357cd",
          startThumbName: "output",
          endThumbName: "input",
          lineType: "BezierCubic",
          nodeType: "Connection",
          layer: 1,
          nodeInfo: {}
        },
        {
          id: "53259034-9cc8-4b32-9baf-220fcb012f76",
          x: 4427.680998224009,
          y: -765.743349708836,
          endX: 4612.06856913936,
          endY: -762.6486298792398,
          startNodeId: "83bf243d-d7bd-4438-bf5e-f77d90e8defb",
          endNodeId: "6be80048-6e33-41b3-9e7e-0a3235e2839a",
          startThumbName: "output",
          endThumbName: "input",
          lineType: "BezierCubic",
          nodeType: "Connection",
          layer: 1,
          nodeInfo: {}
        },
        {
          id: "21e1c107-2bc2-4cb3-9f8c-07a62a5c2d0d",
          x: 4812.06856913936,
          y: -762.6486298792398,
          endX: 5001.952649539493,
          endY: -756.973810710283,
          startNodeId: "6be80048-6e33-41b3-9e7e-0a3235e2839a",
          endNodeId: "448c042d-20a3-4bff-a8e0-09ffe081020c",
          startThumbName: "output",
          endThumbName: "input_0",
          endThumbIdentifierWithinNode: "159dde58-dca4-475a-a796-d474156a6f77",
          lineType: "BezierCubic",
          nodeType: "Connection",
          layer: 1,
          nodeInfo: {}
        },
        {
          id: "aa77a84d-f295-4b6a-8c47-d017a84bd022",
          x: 5201.95274849162,
          y: -756.973810710283,
          endX: 5423.218823011143,
          endY: -779.2004895544958,
          startNodeId: "448c042d-20a3-4bff-a8e0-09ffe081020c",
          endNodeId: "d1982fff-8b06-49ec-9cb6-4b5099eafe79",
          startThumbName: "output_0",
          endThumbName: "input",
          startThumbIdentifierWithinNode: "9b9a1952-4b6c-4ac6-8ed8-701cfbd5af87",
          lineType: "BezierCubic",
          nodeType: "Connection",
          layer: 1,
          nodeInfo: {}
        },
        {
          id: "448c042d-20a3-4bff-a8e0-09ffe081020c",
          x: 5001.952649539493,
          y: -816.2550908045984,
          width: 200.00009895212673,
          height: 113.28123138714477,
          nodeType: "Shape",
          nodeInfo: {
            type: "composition-12b2a34f-0388-4931-b282-31d61905cff4",
            formValues: {},
            nodeCannotBeReplaced: false,
            showFormOnlyInPopup: false,
            useInCompositionOnly: false,
            keepPopupOpenAfterUpdate: false,
            isComposition: true,
            compositionId: "12b2a34f-0388-4931-b282-31d61905cff4",
            taskType: "composition-12b2a34f-0388-4931-b282-31d61905cff4"
          }
        }
      ]
    }
  },
  compositions: {
    ["1bc6fa90-be0d-43cd-9a9f-7fba9c5fd0fa"]: {
      id: "1bc6fa90-be0d-43cd-9a9f-7fba9c5fd0fa",
      name: "setvariable",
      nodes: [
        {
          id: "22e361ba-b432-4e11-9eea-2134da92f38f",
          x: 4821.229486596595,
          y: -878.4813826909128,
          width: 200,
          height: 113.28125,
          nodeType: "Shape",
          nodeInfo: {
            type: "composition-33008ac0-62fc-4adc-9991-2b8d3dc4cf0f",
            formValues: {},
            nodeCannotBeReplaced: false,
            showFormOnlyInPopup: false,
            useInCompositionOnly: false,
            keepPopupOpenAfterUpdate: false,
            isComposition: true,
            compositionId: "33008ac0-62fc-4adc-9991-2b8d3dc4cf0f"
          }
        },
        {
          id: "260af1f6-a54a-4b30-9908-10f953fbb54b",
          x: 4421.229486596595,
          y: -978.4813826909128,
          endX: 4421.229486596595,
          endY: -978.4813826909128,
          lineType: "BezierCubic",
          nodeType: "Connection",
          layer: 1,
          nodeInfo: {}
        },
        {
          id: "f399bc1c-5f61-4e20-bd50-e3d2b35ee8b8",
          x: 5221.229486596595,
          y: -978.4813826909128,
          endX: 5221.229486596595,
          endY: -978.4813826909128,
          lineType: "BezierCubic",
          nodeType: "Connection",
          layer: 1,
          nodeInfo: {}
        }
      ],
      thumbs: [
        {
          thumbIndex: 0,
          thumbType: "EndConnectorLeft",
          connectionType: "end",
          prefixLabel: "Set variable",
          name: "input",
          thumbConstraint: "",
          color: "white",
          thumbIdentifierWithinNode: "5ba72fc6-0f62-4be8-adaf-45f015bace33"
        },
        {
          thumbIndex: 0,
          thumbType: "StartConnectorRight",
          connectionType: "start",
          prefixLabel: "output",
          name: "output",
          thumbConstraint: "",
          color: "white",
          thumbIdentifierWithinNode: "963bb1cf-3c3a-4a48-a421-76487e308cd7"
        }
      ],
      inputNodes: [],
      outputNodes: []
    },
    ["33008ac0-62fc-4adc-9991-2b8d3dc4cf0f"]: {
      id: "33008ac0-62fc-4adc-9991-2b8d3dc4cf0f",
      name: "nested",
      nodes: [
        {
          id: "93706678-32d2-4ec7-bb09-aade911bbe10",
          x: 4830.90438131351,
          y: -827.2354757218088,
          width: 200,
          height: 128,
          nodeType: "Shape",
          nodeInfo: {
            type: "set-variable",
            formValues: {
              variableName: "test"
            },
            nodeCannotBeReplaced: false,
            showFormOnlyInPopup: false,
            useInCompositionOnly: false,
            keepPopupOpenAfterUpdate: false
          }
        },
        {
          id: "9937c5d5-041b-4dd9-b4be-5c9b21b8cec2",
          x: 4430.90438131351,
          y: -927.2354757218088,
          endX: 4430.90438131351,
          endY: -927.2354757218088,
          lineType: "BezierCubic",
          nodeType: "Connection",
          layer: 1,
          nodeInfo: {}
        },
        {
          id: "e8db61d0-afb0-4b3f-8a67-f2b3b43692f0",
          x: 5230.90438131351,
          y: -927.2354757218088,
          endX: 5230.90438131351,
          endY: -927.2354757218088,
          lineType: "BezierCubic",
          nodeType: "Connection",
          layer: 1,
          nodeInfo: {}
        }
      ],
      thumbs: [
        {
          thumbIndex: 0,
          thumbType: "EndConnectorLeft",
          connectionType: "end",
          prefixLabel: "Set variable",
          name: "input",
          thumbConstraint: "",
          color: "white",
          thumbIdentifierWithinNode: "a8c83332-3dae-40fb-9aab-7c31e3bfd554"
        },
        {
          thumbIndex: 0,
          thumbType: "StartConnectorRight",
          connectionType: "start",
          prefixLabel: "output",
          name: "output",
          thumbConstraint: "",
          color: "white",
          thumbIdentifierWithinNode: "22536ea6-2af6-4307-9b17-f5157cee9273"
        }
      ],
      inputNodes: [],
      outputNodes: []
    },
    ["12b2a34f-0388-4931-b282-31d61905cff4"]: {
      id: "12b2a34f-0388-4931-b282-31d61905cff4",
      name: "test1",
      nodes: [
        {
          id: "8a2f58b2-4b16-4a01-94be-326af5916263",
          x: 5008.938895855947,
          y: -832.4042767905336,
          width: 200,
          height: 128,
          nodeType: "Shape",
          nodeInfo: {
            type: "set-variable",
            formValues: {
              variableName: "test"
            },
            nodeCannotBeReplaced: false,
            showFormOnlyInPopup: false,
            useInCompositionOnly: false,
            keepPopupOpenAfterUpdate: false
          }
        }
      ],
      thumbs: [
        {
          thumbIndex: 0,
          thumbType: "EndConnectorLeft",
          connectionType: "end",
          prefixLabel: "Set variable",
          name: "input_0",
          internalName: "input",
          thumbConstraint: "",
          color: "white",
          thumbIdentifierWithinNode: "159dde58-dca4-475a-a796-d474156a6f77",
          nodeId: "8a2f58b2-4b16-4a01-94be-326af5916263"
        },
        {
          thumbIndex: 0,
          thumbType: "StartConnectorRight",
          connectionType: "start",
          name: "output_0",
          internalName: "output",
          thumbConstraint: "",
          color: "white",
          thumbIdentifierWithinNode: "9b9a1952-4b6c-4ac6-8ed8-701cfbd5af87",
          nodeId: "8a2f58b2-4b16-4a01-94be-326af5916263"
        }
      ],
      inputNodes: [
        {
          id: "8a2f58b2-4b16-4a01-94be-326af5916263",
          x: 5008.938895855947,
          y: -832.4042767905336,
          width: 200,
          height: 128,
          nodeType: "Shape",
          nodeInfo: {
            type: "set-variable",
            formValues: {
              variableName: "test"
            },
            nodeCannotBeReplaced: false,
            showFormOnlyInPopup: false,
            useInCompositionOnly: false,
            keepPopupOpenAfterUpdate: false
          }
        }
      ],
      outputNodes: [
        {
          id: "8a2f58b2-4b16-4a01-94be-326af5916263",
          x: 5008.938895855947,
          y: -832.4042767905336,
          width: 200,
          height: 128,
          nodeType: "Shape",
          nodeInfo: {
            type: "set-variable",
            formValues: {
              variableName: "test"
            },
            nodeCannotBeReplaced: false,
            showFormOnlyInPopup: false,
            useInCompositionOnly: false,
            keepPopupOpenAfterUpdate: false
          }
        }
      ]
    }
  }
};