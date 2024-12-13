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
          id: "bfd88ff9-9a9d-4ca1-aa73-ee4ce82510a5",
          x: 2966.230665874529,
          y: -566.7351669271175,
          width: 110,
          height: 110,
          nodeType: "Shape",
          nodeInfo: {
            type: "foreach",
            formValues: {}
          }
        },
        {
          id: "6aa19f9d-cf2b-4717-89c7-0133fa428768",
          x: 1487.4409178385413,
          y: -980.4575533566382,
          width: 201.08596813816183,
          height: 248.0000275796161,
          nodeType: "Shape",
          nodeInfo: {
            type: "scope-variable",
            formValues: {
              variableName: "location1",
              initialValue: "",
              fieldType: "array",
              fieldValueType: "number",
              enumValues: [],
              initialEnumValue: ""
            },
            isVariable: true,
            nodeCannotBeReplaced: true
          }
        },
        {
          id: "53638b84-bf2c-4932-8102-2035e2c484c6",
          x: 2642.619922538427,
          y: -577.831193990902,
          width: 200,
          height: 128,
          nodeType: "Shape",
          nodeInfo: {
            type: "split-string",
            formValues: {
              splitBy: "NEWLINE"
            },
            nodeCannotBeReplaced: false,
            showFormOnlyInPopup: false,
            useInCompositionOnly: false,
            keepPopupOpenAfterUpdate: false
          }
        },
        {
          id: "cbc88c2b-ab9b-41e6-ad01-b060bcaf2385",
          x: 3506.3427301526226,
          y: -542.5741783960048,
          width: 114.59375,
          height: 105,
          nodeType: "Shape",
          nodeInfo: {
            type: "sequential",
            formValues: {
              ["output-thumbs"]: []
            },
            isSettingsPopup: true
          }
        },
        {
          id: "114f35ca-1bdf-4d40-9145-d4af6343ce55",
          x: 3775.164001372038,
          y: -569.3732538493451,
          width: 200,
          height: 100,
          nodeType: "Shape",
          nodeInfo: {
            type: "expression",
            formValues: {
              expression: "parseInt(input[0])",
              inputType: "number"
            },
            showFormOnlyInPopup: true,
            isSettingsPopup: true,
            supportsPreview: true
          }
        },
        {
          id: "1fadec40-eb60-4fcc-b8d3-88893c8a9808",
          x: 3782.331562657435,
          y: -352.0519033243151,
          width: 200,
          height: 100,
          nodeType: "Shape",
          nodeInfo: {
            type: "expression",
            formValues: {
              expression: "parseInt(input[1])",
              inputType: "number"
            },
            showFormOnlyInPopup: true,
            isSettingsPopup: true,
            supportsPreview: true
          }
        },
        {
          id: "f0fe8799-0dc6-4e4c-ab08-45f28983db46",
          x: 3218.4130814639248,
          y: -539.3976418813319,
          width: 200,
          height: 128,
          nodeType: "Shape",
          nodeInfo: {
            type: "split-string",
            formValues: {
              splitBy: "WHITESPACE"
            },
            nodeCannotBeReplaced: false,
            showFormOnlyInPopup: false,
            useInCompositionOnly: false,
            keepPopupOpenAfterUpdate: false
          }
        },
        {
          id: "9e50af75-dd49-4055-a4ee-1f80d7b1fc53",
          x: 1901.387707530473,
          y: -120.05597031133505,
          width: 234.0546875,
          height: 136,
          nodeType: "Shape",
          nodeInfo: {
            type: "register-expression-function-node",
            formValues: {
              customFunctionCode: "(a) => {\n  return parseInt(a);\n};",
              functionName: "parseInt"
            },
            nodeCannotBeReplaced: true,
            showFormOnlyInPopup: true,
            useInCompositionOnly: false,
            keepPopupOpenAfterUpdate: true,
            isRunOnStart: true
          }
        },
        {
          id: "d812b09b-3443-454e-8ecd-c7b1b75a7577",
          x: 1846.4689190431982,
          y: -999.6826365625462,
          width: 201.08596813816183,
          height: 248.0000275796161,
          nodeType: "Shape",
          nodeInfo: {
            type: "scope-variable",
            formValues: {
              variableName: "location2",
              initialValue: "",
              fieldType: "array",
              fieldValueType: "number",
              enumValues: [],
              initialEnumValue: ""
            },
            isVariable: true,
            nodeCannotBeReplaced: true
          }
        },
        {
          id: "6777110c-225b-411f-9137-3fe94023acb1",
          x: 4141.818889267697,
          y: -541.8983541127102,
          width: 280,
          height: 40,
          nodeType: "Shape",
          nodeInfo: {
            type: "push-value-to-array-variable",
            formValues: {
              variableName: "location1"
            },
            nodeCannotBeReplaced: false,
            showFormOnlyInPopup: true,
            useInCompositionOnly: false,
            keepPopupOpenAfterUpdate: false
          }
        },
        {
          id: "4a632638-800b-4862-b11a-562a74bdf041",
          x: 4142.116684296375,
          y: -321.7069594515441,
          width: 280,
          height: 40,
          nodeType: "Shape",
          nodeInfo: {
            type: "push-value-to-array-variable",
            formValues: {
              variableName: "location2"
            },
            nodeCannotBeReplaced: false,
            showFormOnlyInPopup: true,
            useInCompositionOnly: false,
            keepPopupOpenAfterUpdate: false
          }
        },
        {
          id: "1f7452cd-0708-454b-9975-03e655f1def5",
          x: 5118.905536939922,
          y: -917.2966104317494,
          width: 200,
          height: 64,
          nodeType: "Shape",
          nodeInfo: {
            type: "get-array",
            formValues: {
              variableName: "location1"
            },
            nodeCannotBeReplaced: false,
            showFormOnlyInPopup: true,
            useInCompositionOnly: false,
            keepPopupOpenAfterUpdate: false
          }
        },
        {
          id: "72343264-6ba4-4511-9750-260c5b779b54",
          x: 4811.911961063581,
          y: -955.6511881444801,
          width: 200,
          height: 128,
          nodeType: "Shape",
          nodeInfo: {
            type: "reset-variable",
            formValues: {
              variableName: "sum"
            },
            nodeCannotBeReplaced: false,
            showFormOnlyInPopup: false,
            useInCompositionOnly: false,
            keepPopupOpenAfterUpdate: false
          }
        },
        {
          id: "2cca7703-a0d5-4b4f-b18b-8c5ee3f50c68",
          x: 3394.5583030055996,
          y: -1117.4002274810323,
          width: 174.42199726535895,
          height: 83.99998477493939,
          nodeType: "Shape",
          nodeInfo: {
            type: "scope-variable",
            formValues: {
              variableName: "sum",
              initialValue: "0",
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
          id: "0002caef-5740-461b-add1-f1bae6be0752",
          x: 5459.196590375796,
          y: -884.3941038487769,
          width: 110,
          height: 110,
          nodeType: "Shape",
          nodeInfo: {
            type: "foreach",
            formValues: {}
          }
        },
        {
          id: "4ced5c62-8ba5-4a4f-96c3-60b3266b5a11",
          x: 6414.559806623142,
          y: -849.6966208214327,
          width: 200,
          height: 100,
          nodeType: "Shape",
          nodeInfo: {
            type: "expression",
            formValues: {
              expression: "abs(a - b)",
              inputType: "number"
            },
            showFormOnlyInPopup: true,
            isSettingsPopup: true,
            supportsPreview: true
          }
        },
        {
          id: "7a454403-ce95-47cf-9d7b-598bbe64407a",
          x: 6746.855643128705,
          y: -852.0135806633481,
          width: 200,
          height: 100,
          nodeType: "Shape",
          nodeInfo: {
            type: "expression",
            formValues: {
              expression: "sum + input",
              inputType: "number"
            },
            showFormOnlyInPopup: true,
            isSettingsPopup: true,
            supportsPreview: true
          }
        },
        {
          id: "f6e7d208-e4d0-4644-8ea8-bebd492cd5ca",
          x: 7052.878153990811,
          y: -866.4856411615725,
          width: 200,
          height: 128,
          nodeType: "Shape",
          nodeInfo: {
            type: "set-variable",
            formValues: {
              variableName: "sum"
            },
            nodeCannotBeReplaced: false,
            showFormOnlyInPopup: false,
            useInCompositionOnly: false,
            keepPopupOpenAfterUpdate: false
          }
        },
        {
          id: "029b07c2-6119-4332-8b86-c888d42346f2",
          x: 5687.98996586698,
          y: -1048.0276649952534,
          width: 200,
          height: 100,
          nodeType: "Shape",
          nodeInfo: {
            type: "expression",
            formValues: {
              expression: "sum",
              inputType: "number"
            },
            showFormOnlyInPopup: true,
            isSettingsPopup: true,
            supportsPreview: true
          }
        },
        {
          id: "0499c5bf-2f4a-4474-87e0-8f3b85addf24",
          x: 6113.580491226558,
          y: -1037.5553853914703,
          width: 119.99899436747651,
          height: 56.00003399853048,
          nodeType: "Shape",
          nodeInfo: {
            type: "show-value",
            formValues: {
              append: "",
              decimals: "0",
              name: ""
            },
            initializeOnStartFlow: true,
            isSettingsPopup: true
          }
        },
        {
          id: "87079da8-f506-4ac8-8da7-bbe03cdf082e",
          x: 1903.107346844383,
          y: 39.38335497447436,
          width: 234.0548095703125,
          height: 136,
          nodeType: "Shape",
          nodeInfo: {
            type: "register-expression-function-node",
            formValues: {
              customFunctionCode: "(a) => {\n  return Math.abs(a);\n};",
              functionName: "abs"
            },
            nodeCannotBeReplaced: true,
            showFormOnlyInPopup: true,
            useInCompositionOnly: false,
            keepPopupOpenAfterUpdate: true,
            isRunOnStart: true
          }
        },
        {
          id: "b329eedc-32b2-406d-bbb4-b550fd05e9d2",
          x: 1743.3775602771354,
          y: -577.831193990902,
          width: 200,
          height: 128,
          nodeType: "Shape",
          nodeInfo: {
            type: "reset-variable",
            formValues: {
              variableName: "location1"
            },
            nodeCannotBeReplaced: false,
            showFormOnlyInPopup: false,
            useInCompositionOnly: false,
            keepPopupOpenAfterUpdate: false
          }
        },
        {
          id: "bb49d427-4a9a-40b7-bb6b-3d7f10e72c0e",
          x: 2192.9988645115995,
          y: -576.6043591449185,
          width: 200,
          height: 128,
          nodeType: "Shape",
          nodeInfo: {
            type: "reset-variable",
            formValues: {
              variableName: "location2"
            },
            nodeCannotBeReplaced: false,
            showFormOnlyInPopup: false,
            useInCompositionOnly: false,
            keepPopupOpenAfterUpdate: false
          }
        },
        {
          id: "0811290f-21ba-404d-afd4-ed82fdb1a9d3",
          x: 5826.975003229387,
          y: -910.157484659621,
          width: 200,
          height: 113.28125,
          nodeType: "Shape",
          nodeInfo: {
            type: "composition-522ffa14-9762-4df7-b442-8c77a9997fcb",
            formValues: {},
            nodeCannotBeReplaced: false,
            showFormOnlyInPopup: false,
            useInCompositionOnly: false,
            keepPopupOpenAfterUpdate: false,
            isComposition: true,
            compositionId: "522ffa14-9762-4df7-b442-8c77a9997fcb"
          }
        },
        {
          id: "02729870-1618-4749-b458-91f86802b9b9",
          x: 4056.135925105743,
          y: -966.8251085368139,
          width: 199.999755859375,
          height: 113.28125,
          nodeType: "Shape",
          nodeInfo: {
            type: "composition-058d2698-0f64-4bd4-b41d-539df3f901a3",
            formValues: {},
            nodeCannotBeReplaced: false,
            showFormOnlyInPopup: false,
            useInCompositionOnly: false,
            keepPopupOpenAfterUpdate: false,
            isComposition: true,
            compositionId: "058d2698-0f64-4bd4-b41d-539df3f901a3"
          }
        },
        {
          id: "089a3261-253e-4b12-a2c9-348c20cc6f3e",
          x: 1422.6242808714762,
          y: -553.3876435071004,
          width: 74.7109375,
          height: 80,
          nodeType: "Shape",
          nodeInfo: {
            type: "text-node",
            formValues: {
              text: "3   4\n4   3\n2   5\n1   3\n3   9\n3   3"
            },
            nodeCannotBeReplaced: true,
            showFormOnlyInPopup: true,
            useInCompositionOnly: false,
            keepPopupOpenAfterUpdate: true
          }
        },
        {
          id: "d03c6926-8315-49b6-9d45-5dfe4cd9b92e",
          x: 2842.619922538427,
          y: -513.831193990902,
          endX: 2966.230665874529,
          endY: -511.73516692711746,
          startNodeId: "53638b84-bf2c-4932-8102-2035e2c484c6",
          endNodeId: "bfd88ff9-9a9d-4ca1-aa73-ee4ce82510a5",
          startThumbName: "output",
          endThumbName: "input",
          lineType: "BezierCubic",
          nodeType: "Connection",
          layer: 1,
          nodeInfo: {}
        },
        {
          id: "bc77d561-c09a-44c9-9a6d-80a87b909f01",
          x: 3076.230665874529,
          y: -486.73516692711746,
          endX: 3218.4130814639248,
          endY: -475.3976418813319,
          startNodeId: "bfd88ff9-9a9d-4ca1-aa73-ee4ce82510a5",
          endNodeId: "f0fe8799-0dc6-4e4c-ab08-45f28983db46",
          startThumbName: "output2",
          endThumbName: "input",
          lineType: "BezierCubic",
          nodeType: "Connection",
          layer: 1,
          nodeInfo: {}
        },
        {
          id: "500c6143-90f6-4af3-be6a-40a4b9d4eb9d",
          x: 3418.4130814639248,
          y: -475.3976418813319,
          endX: 3506.3427301526226,
          endY: -490.07417839600475,
          startNodeId: "f0fe8799-0dc6-4e4c-ab08-45f28983db46",
          endNodeId: "cbc88c2b-ab9b-41e6-ad01-b060bcaf2385",
          startThumbName: "output",
          endThumbName: "input",
          lineType: "BezierCubic",
          nodeType: "Connection",
          layer: 1,
          nodeInfo: {}
        },
        {
          id: "bddc1027-3346-4b4b-ac8c-b932816327bc",
          x: 3620.9364801526226,
          y: -512.5741783960048,
          endX: 3775.164001372038,
          endY: -519.3732538493451,
          startNodeId: "cbc88c2b-ab9b-41e6-ad01-b060bcaf2385",
          endNodeId: "114f35ca-1bdf-4d40-9145-d4af6343ce55",
          startThumbName: "output1",
          endThumbName: "input",
          lineType: "BezierCubic",
          nodeType: "Connection",
          layer: 1,
          nodeInfo: {}
        },
        {
          id: "93b14d2e-bace-4659-95ce-c2f736bce024",
          x: 3620.9364801526226,
          y: -462.57417839600475,
          endX: 3782.331562657435,
          endY: -302.0519033243151,
          startNodeId: "cbc88c2b-ab9b-41e6-ad01-b060bcaf2385",
          endNodeId: "1fadec40-eb60-4fcc-b8d3-88893c8a9808",
          startThumbName: "output2",
          endThumbName: "input",
          lineType: "BezierCubic",
          nodeType: "Connection",
          layer: 1,
          nodeInfo: {}
        },
        {
          id: "39fe1756-f610-46b6-a17f-6a51f0412af5",
          x: 3076.230665874529,
          y: -536.7351669271175,
          endX: 4056.135925105743,
          endY: -907.5438585368139,
          startNodeId: "bfd88ff9-9a9d-4ca1-aa73-ee4ce82510a5",
          endNodeId: "02729870-1618-4749-b458-91f86802b9b9",
          startThumbName: "output1",
          endThumbName: "input_0",
          endThumbIdentifierWithinNode: "550bc299-07b0-4a98-9563-dadc1cd15dd7",
          lineType: "BezierCubic",
          nodeType: "Connection",
          layer: 1,
          nodeInfo: {}
        },
        {
          id: "e1d38fa6-b151-4d89-8a13-34b377bb729a",
          x: 3975.164001372038,
          y: -519.3732538493451,
          endX: 4141.818889267697,
          endY: -521.8983541127102,
          startNodeId: "114f35ca-1bdf-4d40-9145-d4af6343ce55",
          endNodeId: "6777110c-225b-411f-9137-3fe94023acb1",
          startThumbName: "output",
          endThumbName: "value",
          lineType: "BezierCubic",
          nodeType: "Connection",
          layer: 1,
          nodeInfo: {}
        },
        {
          id: "8acc28f4-64d9-4ec2-a0b6-032c8252a832",
          x: 3982.331562657435,
          y: -302.0519033243151,
          endX: 4142.116684296375,
          endY: -301.7069594515441,
          startNodeId: "1fadec40-eb60-4fcc-b8d3-88893c8a9808",
          endNodeId: "4a632638-800b-4862-b11a-562a74bdf041",
          startThumbName: "output",
          endThumbName: "value",
          lineType: "BezierCubic",
          nodeType: "Connection",
          layer: 1,
          nodeInfo: {}
        },
        {
          id: "862fdf1c-ef70-4c2f-ad6c-018248e55191",
          x: 4256.135680965118,
          y: -907.5438585368139,
          endX: 4811.911961063581,
          endY: -891.6511881444801,
          startNodeId: "02729870-1618-4749-b458-91f86802b9b9",
          endNodeId: "72343264-6ba4-4511-9750-260c5b779b54",
          startThumbName: "output_0",
          endThumbName: "input",
          startThumbIdentifierWithinNode: "2ab46fce-06e6-452b-8882-2c473e245aa4",
          lineType: "BezierCubic",
          nodeType: "Connection",
          layer: 1,
          nodeInfo: {}
        },
        {
          id: "006e36f5-348f-4279-8032-e5bd2afc1722",
          x: 5011.911961063581,
          y: -891.6511881444801,
          endX: 5118.905536939922,
          endY: -885.2966104317494,
          startNodeId: "72343264-6ba4-4511-9750-260c5b779b54",
          endNodeId: "1f7452cd-0708-454b-9975-03e655f1def5",
          startThumbName: "output",
          endThumbName: "input",
          lineType: "BezierCubic",
          nodeType: "Connection",
          layer: 1,
          nodeInfo: {}
        },
        {
          id: "87813ac6-de4c-4d39-b12b-b12d9a9e8925",
          x: 5318.905536939922,
          y: -885.2966104317494,
          endX: 5459.196590375796,
          endY: -829.3941038487769,
          startNodeId: "1f7452cd-0708-454b-9975-03e655f1def5",
          endNodeId: "0002caef-5740-461b-add1-f1bae6be0752",
          startThumbName: "output",
          endThumbName: "input",
          lineType: "BezierCubic",
          nodeType: "Connection",
          layer: 1,
          nodeInfo: {}
        },
        {
          id: "5f85baf3-5a9d-4b24-9f90-ba80cb4180fa",
          x: 5569.196590375796,
          y: -804.3941038487769,
          endX: 5826.975003229387,
          endY: -850.876234659621,
          startNodeId: "0002caef-5740-461b-add1-f1bae6be0752",
          endNodeId: "0811290f-21ba-404d-afd4-ed82fdb1a9d3",
          startThumbName: "output2",
          endThumbName: "input_0",
          endThumbIdentifierWithinNode: "4247a224-b695-4c44-9333-d1374ffc3c14",
          lineType: "BezierCubic",
          nodeType: "Connection",
          layer: 1,
          nodeInfo: {}
        },
        {
          id: "d18aefdd-4ba6-4cb9-9c09-9f29457810e5",
          x: 6026.975003229387,
          y: -850.876234659621,
          endX: 6414.559806623142,
          endY: -799.6966208214327,
          startNodeId: "0811290f-21ba-404d-afd4-ed82fdb1a9d3",
          endNodeId: "4ced5c62-8ba5-4a4f-96c3-60b3266b5a11",
          startThumbName: "output_0",
          endThumbName: "input",
          startThumbIdentifierWithinNode: "e4a9985a-fb14-4382-b93e-abe4830b3d8a",
          lineType: "BezierCubic",
          nodeType: "Connection",
          layer: 1,
          nodeInfo: {}
        },
        {
          id: "2abbfdb2-9320-4632-8e2e-aecdd204dd09",
          x: 6614.559806623142,
          y: -799.6966208214327,
          endX: 6746.855643128705,
          endY: -802.0135806633481,
          startNodeId: "4ced5c62-8ba5-4a4f-96c3-60b3266b5a11",
          endNodeId: "7a454403-ce95-47cf-9d7b-598bbe64407a",
          startThumbName: "output",
          endThumbName: "input",
          lineType: "BezierCubic",
          nodeType: "Connection",
          layer: 1,
          nodeInfo: {}
        },
        {
          id: "c292c508-3370-464c-97f7-a96e913c3770",
          x: 6946.855643128705,
          y: -802.0135806633481,
          endX: 7052.878153990811,
          endY: -802.4856411615725,
          startNodeId: "7a454403-ce95-47cf-9d7b-598bbe64407a",
          endNodeId: "f6e7d208-e4d0-4644-8ea8-bebd492cd5ca",
          startThumbName: "output",
          endThumbName: "input",
          lineType: "BezierCubic",
          nodeType: "Connection",
          layer: 1,
          nodeInfo: {}
        },
        {
          id: "120e49db-24df-41f7-961b-48e8f32c9d4b",
          x: 5569.196590375796,
          y: -854.3941038487769,
          endX: 5687.98996586698,
          endY: -998.0276649952534,
          startNodeId: "0002caef-5740-461b-add1-f1bae6be0752",
          endNodeId: "029b07c2-6119-4332-8b86-c888d42346f2",
          startThumbName: "output1",
          endThumbName: "input",
          lineType: "BezierCubic",
          nodeType: "Connection",
          layer: 1,
          nodeInfo: {}
        },
        {
          id: "31cb38af-2145-4b6c-90fc-6f3dc2ce373a",
          x: 5887.98996586698,
          y: -998.0276649952534,
          endX: 6113.580491226558,
          endY: -1007.5553853914703,
          startNodeId: "029b07c2-6119-4332-8b86-c888d42346f2",
          endNodeId: "0499c5bf-2f4a-4474-87e0-8f3b85addf24",
          startThumbName: "output",
          endThumbName: "input",
          lineType: "BezierCubic",
          nodeType: "Connection",
          layer: 1,
          nodeInfo: {}
        },
        {
          id: "99194a93-f837-4981-962c-d16e21dd21e3",
          x: 1943.3775602771354,
          y: -513.831193990902,
          endX: 2192.9988645115995,
          endY: -512.6043591449185,
          startNodeId: "b329eedc-32b2-406d-bbb4-b550fd05e9d2",
          endNodeId: "bb49d427-4a9a-40b7-bb6b-3d7f10e72c0e",
          startThumbName: "output",
          endThumbName: "input",
          lineType: "BezierCubic",
          nodeType: "Connection",
          layer: 1,
          nodeInfo: {}
        },
        {
          id: "1b12b834-800a-4c86-9d09-375e27e37a32",
          x: 2392.9988645115995,
          y: -512.6043591449185,
          endX: 2642.619922538427,
          endY: -513.831193990902,
          startNodeId: "bb49d427-4a9a-40b7-bb6b-3d7f10e72c0e",
          endNodeId: "53638b84-bf2c-4932-8102-2035e2c484c6",
          startThumbName: "output",
          endThumbName: "input",
          lineType: "BezierCubic",
          nodeType: "Connection",
          layer: 1,
          nodeInfo: {}
        },
        {
          id: "ca185833-09f3-44a6-aab4-5a1ac3eec2d0",
          x: 1497.3352183714762,
          y: -513.3876435071004,
          endX: 1743.3775602771354,
          endY: -513.831193990902,
          startNodeId: "089a3261-253e-4b12-a2c9-348c20cc6f3e",
          endNodeId: "b329eedc-32b2-406d-bbb4-b550fd05e9d2",
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
  compositions: {
    ["522ffa14-9762-4df7-b442-8c77a9997fcb"]: {
      id: "522ffa14-9762-4df7-b442-8c77a9997fcb",
      name: "test",
      nodes: [
        {
          id: "453e3345-e9d0-4696-8c13-72f640becedc",
          x: 5677.5057301117495,
          y: -850.1574487471909,
          width: 100.296875,
          height: 105,
          nodeType: "Shape",
          nodeInfo: {
            type: "parallel",
            formValues: {
              ["output-thumbs"]: []
            },
            isSettingsPopup: true
          }
        },
        {
          id: "e4a8aefb-95bc-4228-b6ed-e08d56d8e2ad",
          x: 5880.5613012679205,
          y: -882.8434595164545,
          width: 200,
          height: 100,
          nodeType: "Shape",
          nodeInfo: {
            type: "expression",
            formValues: {
              expression: "location2[index]",
              inputType: "number"
            },
            showFormOnlyInPopup: true,
            isSettingsPopup: true,
            supportsPreview: true
          }
        },
        {
          id: "44e89e00-31df-4fc3-bf1b-97d2d7a8ab56",
          x: 6176.4443259482705,
          y: -850.0777513404379,
          width: 100,
          height: 105,
          nodeType: "Shape",
          nodeInfo: {
            type: "merge",
            formValues: {},
            nodeCannotBeReplaced: false,
            showFormOnlyInPopup: false,
            useInCompositionOnly: false,
            keepPopupOpenAfterUpdate: false
          }
        },
        {
          id: "74b8a1ea-17bf-4f85-aced-eb4cf91af656",
          x: 5777.8026051117495,
          y: -820.1574487471909,
          endX: 5880.5613012679205,
          endY: -832.8434595164545,
          startNodeId: "453e3345-e9d0-4696-8c13-72f640becedc",
          endNodeId: "e4a8aefb-95bc-4228-b6ed-e08d56d8e2ad",
          startThumbName: "output1",
          endThumbName: "input",
          lineType: "BezierCubic",
          nodeType: "Connection",
          layer: 1,
          nodeInfo: {}
        },
        {
          id: "34458d0a-1789-4e7e-9772-d5295c7aeff9",
          x: 5777.8026051117495,
          y: -770.1574487471909,
          endX: 6176.4443259482705,
          endY: -770.0777513404379,
          startNodeId: "453e3345-e9d0-4696-8c13-72f640becedc",
          endNodeId: "44e89e00-31df-4fc3-bf1b-97d2d7a8ab56",
          startThumbName: "output2",
          endThumbName: "b",
          lineType: "BezierCubic",
          nodeType: "Connection",
          layer: 1,
          nodeInfo: {}
        },
        {
          id: "2514678f-c98e-4464-b8e9-cee57f23051f",
          x: 6080.5613012679205,
          y: -832.8434595164545,
          endX: 6176.4443259482705,
          endY: -820.0777513404379,
          startNodeId: "e4a8aefb-95bc-4228-b6ed-e08d56d8e2ad",
          endNodeId: "44e89e00-31df-4fc3-bf1b-97d2d7a8ab56",
          startThumbName: "output",
          endThumbName: "a",
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
          prefixLabel: "",
          name: "input_0",
          internalName: "input",
          thumbConstraint: "",
          color: "white",
          thumbIdentifierWithinNode: "4247a224-b695-4c44-9333-d1374ffc3c14",
          nodeId: "453e3345-e9d0-4696-8c13-72f640becedc"
        },
        {
          thumbIndex: 0,
          thumbType: "StartConnectorRight",
          connectionType: "start",
          prefixLabel: "output",
          name: "output_0",
          internalName: "output",
          thumbConstraint: "",
          color: "white",
          thumbIdentifierWithinNode: "e4a9985a-fb14-4382-b93e-abe4830b3d8a",
          nodeId: "44e89e00-31df-4fc3-bf1b-97d2d7a8ab56"
        }
      ],
      inputNodes: [
        {
          id: "453e3345-e9d0-4696-8c13-72f640becedc",
          x: 5677.5057301117495,
          y: -850.1574487471909,
          width: 100.296875,
          height: 105,
          nodeType: "Shape",
          nodeInfo: {
            type: "parallel",
            formValues: {
              ["output-thumbs"]: []
            },
            isSettingsPopup: true
          }
        }
      ],
      outputNodes: [
        {
          id: "44e89e00-31df-4fc3-bf1b-97d2d7a8ab56",
          x: 6176.4443259482705,
          y: -850.0777513404379,
          width: 100,
          height: 105,
          nodeType: "Shape",
          nodeInfo: {
            type: "merge",
            formValues: {},
            nodeCannotBeReplaced: false,
            showFormOnlyInPopup: false,
            useInCompositionOnly: false,
            keepPopupOpenAfterUpdate: false
          }
        }
      ]
    },
    ["058d2698-0f64-4bd4-b41d-539df3f901a3"]: {
      id: "058d2698-0f64-4bd4-b41d-539df3f901a3",
      name: "test2",
      nodes: [
        {
          id: "db2b72d4-9e39-4d97-895f-a0ff84122aa1",
          x: 3732.778044404292,
          y: -936.1990356302122,
          width: 150,
          height: 40,
          nodeType: "Shape",
          nodeInfo: {
            type: "sort-array",
            formValues: {},
            nodeCannotBeReplaced: false,
            showFormOnlyInPopup: false,
            useInCompositionOnly: false,
            keepPopupOpenAfterUpdate: false
          }
        },
        {
          id: "3de15a8a-515e-4718-8d41-5ddb31de0751",
          x: 3732.7341758052817,
          y: -824.1499135176399,
          width: 150,
          height: 40,
          nodeType: "Shape",
          nodeInfo: {
            type: "sort-array",
            formValues: {},
            nodeCannotBeReplaced: false,
            showFormOnlyInPopup: false,
            useInCompositionOnly: false,
            keepPopupOpenAfterUpdate: false
          }
        },
        {
          id: "56ff71d8-ef58-40a7-976e-86aa1dfb595b",
          x: 3445.7073438300577,
          y: -931.2148265825339,
          width: 200,
          height: 64,
          nodeType: "Shape",
          nodeInfo: {
            type: "get-array",
            formValues: {
              variableName: "location1"
            },
            nodeCannotBeReplaced: false,
            showFormOnlyInPopup: true,
            useInCompositionOnly: false,
            keepPopupOpenAfterUpdate: false
          }
        },
        {
          id: "17178091-ca91-44ee-bdd6-b3538cf5705a",
          x: 3208.2364076701415,
          y: -915.474853503311,
          width: 100.296875,
          height: 105,
          nodeType: "Shape",
          nodeInfo: {
            type: "parallel",
            formValues: {
              ["output-thumbs"]: []
            },
            isSettingsPopup: true
          }
        },
        {
          id: "491def58-9c92-4d1e-b607-1bf6e504b15f",
          x: 3432.0517026458374,
          y: -854.3280603845548,
          width: 200,
          height: 64,
          nodeType: "Shape",
          nodeInfo: {
            type: "get-array",
            formValues: {
              variableName: "location2"
            },
            nodeCannotBeReplaced: false,
            showFormOnlyInPopup: true,
            useInCompositionOnly: false,
            keepPopupOpenAfterUpdate: false
          }
        },
        {
          id: "48041dd9-49ee-447f-a5ba-3ff1d52f4ed3",
          x: 4378.09132929818,
          y: -931.1010355047612,
          width: 100,
          height: 105,
          nodeType: "Shape",
          nodeInfo: {
            type: "merge",
            formValues: {},
            nodeCannotBeReplaced: false,
            showFormOnlyInPopup: false,
            useInCompositionOnly: false,
            keepPopupOpenAfterUpdate: false
          }
        },
        {
          id: "4b292d5f-95fd-4c14-b62e-dbb173f52b28",
          x: 4579.493805807194,
          y: -915.7939655712468,
          width: 120.00002925302944,
          height: 56.00001365141374,
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
          id: "5b7b3b76-b19d-4e34-a1e8-5d0ade220737",
          x: 4015.0958364502303,
          y: -952.1262473341226,
          width: 199.999755859375,
          height: 64,
          nodeType: "Shape",
          nodeInfo: {
            type: "set-array-variable",
            formValues: {
              variableName: "location1"
            },
            nodeCannotBeReplaced: false,
            showFormOnlyInPopup: true,
            useInCompositionOnly: false,
            keepPopupOpenAfterUpdate: false
          }
        },
        {
          id: "10468cb6-1ba2-465e-a124-50aca6a26b4c",
          x: 4013.013594064726,
          y: -829.4511814434156,
          width: 200,
          height: 64,
          nodeType: "Shape",
          nodeInfo: {
            type: "set-array-variable",
            formValues: {
              variableName: "location2"
            },
            nodeCannotBeReplaced: false,
            showFormOnlyInPopup: true,
            useInCompositionOnly: false,
            keepPopupOpenAfterUpdate: false
          }
        },
        {
          id: "c18b2d9c-228f-4f44-be9e-f9815d0d900a",
          x: 3645.7073438300577,
          y: -899.2148265825339,
          endX: 3732.778044404292,
          endY: -916.1990356302122,
          startNodeId: "56ff71d8-ef58-40a7-976e-86aa1dfb595b",
          endNodeId: "db2b72d4-9e39-4d97-895f-a0ff84122aa1",
          startThumbName: "output",
          endThumbName: "input",
          lineType: "BezierCubic",
          nodeType: "Connection",
          layer: 1,
          nodeInfo: {}
        },
        {
          id: "6323e65e-d2e8-4ada-aee8-e278a40cbd94",
          x: 3882.778044404292,
          y: -916.1990356302122,
          endX: 4015.0958364502303,
          endY: -922.1262473341226,
          startNodeId: "db2b72d4-9e39-4d97-895f-a0ff84122aa1",
          endNodeId: "5b7b3b76-b19d-4e34-a1e8-5d0ade220737",
          startThumbName: "output",
          endThumbName: "array",
          lineType: "BezierCubic",
          nodeType: "Connection",
          layer: 1,
          nodeInfo: {}
        },
        {
          id: "bca8cd9a-aba1-4268-a33f-b7697d3af287",
          x: 3632.0517026458374,
          y: -822.3280603845548,
          endX: 3732.7341758052817,
          endY: -804.1499135176399,
          startNodeId: "491def58-9c92-4d1e-b607-1bf6e504b15f",
          endNodeId: "3de15a8a-515e-4718-8d41-5ddb31de0751",
          startThumbName: "output",
          endThumbName: "input",
          lineType: "BezierCubic",
          nodeType: "Connection",
          layer: 1,
          nodeInfo: {}
        },
        {
          id: "312018b2-de58-4b2c-a6c9-304c505a9054",
          x: 3882.7341758052817,
          y: -804.1499135176399,
          endX: 4013.013594064726,
          endY: -799.4511814434156,
          startNodeId: "3de15a8a-515e-4718-8d41-5ddb31de0751",
          endNodeId: "10468cb6-1ba2-465e-a124-50aca6a26b4c",
          startThumbName: "output",
          endThumbName: "array",
          lineType: "BezierCubic",
          nodeType: "Connection",
          layer: 1,
          nodeInfo: {}
        },
        {
          id: "525db371-634d-47d1-9890-c49898f9bbfa",
          x: 3308.5332826701415,
          y: -885.474853503311,
          endX: 3445.7073438300577,
          endY: -899.2148265825339,
          startNodeId: "17178091-ca91-44ee-bdd6-b3538cf5705a",
          endNodeId: "56ff71d8-ef58-40a7-976e-86aa1dfb595b",
          startThumbName: "output1",
          endThumbName: "input",
          lineType: "BezierCubic",
          nodeType: "Connection",
          layer: 1,
          nodeInfo: {}
        },
        {
          id: "b4c6535c-5d0e-42b7-9fcc-e154e06eaadd",
          x: 3308.5332826701415,
          y: -835.474853503311,
          endX: 3432.0517026458374,
          endY: -822.3280603845548,
          startNodeId: "17178091-ca91-44ee-bdd6-b3538cf5705a",
          endNodeId: "491def58-9c92-4d1e-b607-1bf6e504b15f",
          startThumbName: "output2",
          endThumbName: "input",
          lineType: "BezierCubic",
          nodeType: "Connection",
          layer: 1,
          nodeInfo: {}
        },
        {
          id: "5eb9ebd5-5714-4439-a524-440d111352e0",
          x: 4478.09132929818,
          y: -878.6010355047612,
          endX: 4579.493805807194,
          endY: -885.7939655712468,
          startNodeId: "48041dd9-49ee-447f-a5ba-3ff1d52f4ed3",
          endNodeId: "4b292d5f-95fd-4c14-b62e-dbb173f52b28",
          startThumbName: "output",
          endThumbName: "input",
          lineType: "BezierCubic",
          nodeType: "Connection",
          layer: 1,
          nodeInfo: {}
        },
        {
          id: "0e48cb12-7c7b-4eb4-9b92-837aa17f85a1",
          x: 4213.013594064726,
          y: -797.4511814434156,
          endX: 4378.09132929818,
          endY: -851.1010355047612,
          startNodeId: "10468cb6-1ba2-465e-a124-50aca6a26b4c",
          endNodeId: "48041dd9-49ee-447f-a5ba-3ff1d52f4ed3",
          startThumbName: "output",
          endThumbName: "b",
          lineType: "BezierCubic",
          nodeType: "Connection",
          layer: 1,
          nodeInfo: {}
        },
        {
          id: "abdb325f-0fc1-462d-9446-70c81cc1bc86",
          x: 4215.095592309605,
          y: -920.1262473341226,
          endX: 4378.09132929818,
          endY: -901.1010355047612,
          startNodeId: "5b7b3b76-b19d-4e34-a1e8-5d0ade220737",
          endNodeId: "48041dd9-49ee-447f-a5ba-3ff1d52f4ed3",
          startThumbName: "output",
          endThumbName: "a",
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
          prefixLabel: "",
          name: "input_0",
          internalName: "input",
          thumbConstraint: "",
          color: "white",
          thumbIdentifierWithinNode: "550bc299-07b0-4a98-9563-dadc1cd15dd7",
          nodeId: "17178091-ca91-44ee-bdd6-b3538cf5705a"
        },
        {
          thumbIndex: 0,
          thumbType: "StartConnectorRight",
          connectionType: "start",
          name: "output_0",
          internalName: "output",
          thumbConstraint: "",
          color: "white",
          thumbIdentifierWithinNode: "2ab46fce-06e6-452b-8882-2c473e245aa4",
          nodeId: "4b292d5f-95fd-4c14-b62e-dbb173f52b28"
        }
      ],
      inputNodes: [
        {
          id: "17178091-ca91-44ee-bdd6-b3538cf5705a",
          x: 3208.2364076701415,
          y: -915.474853503311,
          width: 100.296875,
          height: 105,
          nodeType: "Shape",
          nodeInfo: {
            type: "parallel",
            formValues: {
              ["output-thumbs"]: []
            },
            isSettingsPopup: true
          }
        }
      ],
      outputNodes: [
        {
          id: "4b292d5f-95fd-4c14-b62e-dbb173f52b28",
          x: 4579.493805807194,
          y: -915.7939655712468,
          width: 120.00002925302944,
          height: 56.00001365141374,
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
        }
      ]
    }
  }
};