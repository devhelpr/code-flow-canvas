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
    id: "f5d47be2-da69-440a-9e81-f9c88d082ab6",
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
          id: "f2d31b4a-a260-4068-87bc-e6116aebd33b",
          x: 75.57629814632509,
          y: 1494.7301887865522,
          width: 319.14066764113846,
          height: 107.99887645511853,
          nodeType: "Shape",
          nodeInfo: {
            type: "function",
            formValues: {
              node: "quickSort",
              parameters: "list,parentTreeNode,childTreeNode"
            }
          }
        },
        {
          id: "03937c1d-ef2c-4d29-8515-c53fc06d4c16",
          x: 3355.787738629858,
          y: 483.29419305049777,
          width: 200,
          height: 212,
          nodeType: "Shape",
          nodeInfo: {
            type: "call-function",
            formValues: {
              functionCall: "quickSort(array,\"rootx\",\"rootxx\")"
            },
            decorators: [
              {
                taskType: "send-node-to-node-tree",
                formValues: {
                  commandHandlerName: "node-tree",
                  treeNode: "root",
                  childTreeNode: "rootx",
                  caption: "send 'unsorted' to node tree"
                },
                executeOrder: "before"
              }
            ],
            nodeCannotBeReplaced: false,
            showFormOnlyInPopup: false,
            useInCompositionOnly: false
          }
        },
        {
          id: "c8468309-2ed4-4947-91de-7667794120fe",
          x: 2987.720763145926,
          y: 231.6748530414456,
          width: 239.99991861985163,
          height: 215.99998414006998,
          nodeType: "Shape",
          nodeInfo: {
            type: "variable",
            formValues: {
              variableName: "array",
              initialValue: "",
              fieldType: "array",
              fieldValueType: "number"
            },
            isVariable: true,
            nodeCannotBeReplaced: true
          }
        },
        {
          id: "4337e04c-f6b7-4de1-b6f6-b377e9ed70ef",
          x: 2856.9465061151577,
          y: 1255.7249696114905,
          width: 200,
          height: 112,
          nodeType: "Shape",
          nodeInfo: {
            type: "expression",
            formValues: {
              expression: "list",
              inputType: "number"
            },
            showFormOnlyInPopup: true,
            isSettingsPopup: true
          }
        },
        {
          id: "653e1564-2017-42fa-b071-7c6ee7db877d",
          x: 2441.1601609677455,
          y: 453.8281459266993,
          width: 150,
          height: 155,
          nodeType: "Shape",
          nodeInfo: {
            type: "range",
            formValues: {},
            nodeCannotBeReplaced: false,
            showFormOnlyInPopup: false,
            useInCompositionOnly: false
          }
        },
        {
          id: "82041c9e-06dc-42f3-b2b0-5abbab74cbfc",
          x: 2063.01030372355,
          y: 345.27475675273274,
          width: 200,
          height: 112,
          nodeType: "Shape",
          nodeInfo: {
            type: "value",
            formValues: {
              value: "0"
            }
          }
        },
        {
          id: "f5d47be2-da69-440a-9e81-f9c88d082ab6",
          x: 2060.4109679115663,
          y: 557.215263089041,
          width: 200,
          height: 112,
          nodeType: "Shape",
          nodeInfo: {
            type: "value",
            formValues: {
              value: "10"
            }
          }
        },
        {
          id: "50f3976a-1752-402a-b003-81d8d38a4a88",
          x: 2996.873511538354,
          y: 508.575259802187,
          width: 200,
          height: 64,
          nodeType: "Shape",
          nodeInfo: {
            type: "set-array-variable",
            formValues: {
              variableName: "array"
            },
            nodeCannotBeReplaced: false,
            showFormOnlyInPopup: true,
            useInCompositionOnly: false
          }
        },
        {
          id: "dea7a8ed-f5e3-496e-9ff9-e16d927b05b9",
          x: 3756.2933223315104,
          y: 512.6116735119815,
          width: 119.9998971330694,
          height: 103.99995441157438,
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
          id: "303e3b52-15e0-4a3d-873a-044469feeb6f",
          x: 2716.5348183649594,
          y: 476.4680797584578,
          width: 110,
          height: 110,
          nodeType: "Shape",
          nodeInfo: {
            type: "map",
            formValues: {}
          }
        },
        {
          id: "a486f1d5-a951-42b0-8225-dcf2223040d7",
          x: 2953.54283405415,
          y: 674.407077289538,
          width: 200,
          height: 112,
          nodeType: "Shape",
          nodeInfo: {
            type: "expression",
            formValues: {
              expression: "random",
              inputType: "number"
            },
            showFormOnlyInPopup: true,
            isSettingsPopup: true
          }
        },
        {
          id: "69964781-69b0-4341-bc6e-9c66b543d1b2",
          x: 2630.2144788369646,
          y: 1562.0624435424454,
          width: 239.99998096434265,
          height: 120.00008383127326,
          nodeType: "Shape",
          nodeInfo: {
            type: "scope-variable",
            formValues: {
              variableName: "right",
              initialValue: "",
              fieldType: "array",
              fieldValueType: "number"
            },
            isVariable: true,
            nodeCannotBeReplaced: true
          }
        },
        {
          id: "e743603f-2581-4ff6-aabd-8e05e209fa4f",
          x: 2652.0723997403074,
          y: 868.4481373147885,
          width: 239.99998096434265,
          height: 96.00002972537783,
          nodeType: "Shape",
          nodeInfo: {
            type: "scope-variable",
            formValues: {
              variableName: "left",
              initialValue: "",
              fieldType: "array",
              fieldValueType: "number"
            },
            isVariable: true,
            nodeCannotBeReplaced: true
          }
        },
        {
          id: "3148c1c0-f69d-43ef-88ca-dbdfe11662f3",
          x: 3245.314301112891,
          y: 1228.8676666402484,
          width: 110,
          height: 110,
          nodeType: "Shape",
          nodeInfo: {
            type: "foreach",
            formValues: {}
          }
        },
        {
          id: "47808db5-94a1-4a07-81e6-7ba8b382920a",
          x: 3524.384884219816,
          y: 1601.939775204935,
          width: 150,
          height: 150,
          nodeType: "Shape",
          nodeInfo: {
            type: "if-condition",
            formValues: {
              Mode: "expression",
              expression: "input < pivot",
              inputType: "number"
            }
          }
        },
        {
          id: "b87159d6-99f1-472f-9601-0b565589d1aa",
          x: 3946.148882813113,
          y: 1614.2976882898756,
          width: 279.999755859375,
          height: 40,
          nodeType: "Shape",
          nodeInfo: {
            type: "push-value-to-array-variable",
            formValues: {
              variableName: "left"
            },
            nodeCannotBeReplaced: false,
            showFormOnlyInPopup: true,
            useInCompositionOnly: false
          }
        },
        {
          id: "4f3054da-f290-4eae-86d0-a2b1bbc60805",
          x: 4042.670756921451,
          y: 1821.065673728428,
          width: 280.000244140625,
          height: 40,
          nodeType: "Shape",
          nodeInfo: {
            type: "push-value-to-array-variable",
            formValues: {
              variableName: "right"
            },
            nodeCannotBeReplaced: false,
            showFormOnlyInPopup: true,
            useInCompositionOnly: false
          }
        },
        {
          id: "be92fbf3-3b0d-49d3-812e-8401754903ce",
          x: 3754.879437138114,
          y: 1771.0558847606767,
          width: 150,
          height: 150,
          nodeType: "Shape",
          nodeInfo: {
            type: "gate",
            formValues: {
              Mode: "expression",
              expression: "input >= pivot"
            }
          }
        },
        {
          id: "de7d7abe-ee7a-4167-a8b0-ae03f045782d",
          x: 3965.989286166651,
          y: 481.23039321872693,
          width: 239.9997942661388,
          height: 95.99998305082687,
          nodeType: "Shape",
          nodeInfo: {
            type: "scope-variable",
            formValues: {
              variableName: "result",
              initialValue: "",
              fieldType: "array",
              fieldValueType: "number"
            },
            isVariable: true,
            nodeCannotBeReplaced: true
          }
        },
        {
          id: "9fd36007-96e4-4682-8f95-dd895e35c564",
          x: 3936.1505948128647,
          y: 910.0330534904745,
          width: 199.999755859375,
          height: 296,
          nodeType: "Shape",
          nodeInfo: {
            type: "call-function",
            formValues: {
              functionCall: "quickSort(left,childTreeNode+\"left\",childTreeNode+\"leftx\")"
            },
            decorators: [
              {
                taskType: "send-node-to-node-tree",
                formValues: {
                  commandHandlerName: "node-tree",
                  expression: "left",
                  label: "left",
                  addToId: "left",
                  caption: "send 'left' to node tree",
                  nodeClass: ""
                },
                executeOrder: "before"
              },
              {
                taskType: "send-node-to-node-tree",
                formValues: {
                  commandHandlerName: "node-tree",
                  expression: "pivot",
                  label: "pivot",
                  addToId: "pivot",
                  caption: "send 'pivot' to node tree",
                  nodeClass: "node-tree__pivot"
                },
                executeOrder: "before"
              }
            ],
            nodeCannotBeReplaced: false,
            showFormOnlyInPopup: false,
            useInCompositionOnly: false
          }
        },
        {
          id: "73aaeb72-0eff-4e08-bc45-d23d304b5ba0",
          x: 3932.92410484883,
          y: 1467.1190786305485,
          width: 200,
          height: 212,
          nodeType: "Shape",
          nodeInfo: {
            type: "call-function",
            formValues: {
              functionCall: "quickSort(right,childTreeNode+\"right\",childTreeNode+\"rightx\")"
            },
            decorators: [
              {
                taskType: "send-node-to-node-tree",
                formValues: {
                  commandHandlerName: "node-tree",
                  expression: "right",
                  label: "right",
                  addToId: "right",
                  caption: "send 'right' to node tree",
                  nodeClass: ""
                },
                executeOrder: "before"
              }
            ],
            nodeCannotBeReplaced: false,
            showFormOnlyInPopup: false,
            useInCompositionOnly: false
          }
        },
        {
          id: "4748116f-5cc8-4615-a9a0-6115e4a53d2e",
          x: 652.4522517632229,
          y: 1515.3610494747431,
          width: 200,
          height: 64,
          nodeType: "Shape",
          nodeInfo: {
            type: "get-array-size",
            formValues: {
              variableName: "list"
            },
            nodeCannotBeReplaced: false,
            showFormOnlyInPopup: true,
            useInCompositionOnly: false
          }
        },
        {
          id: "b5e50d91-4909-45f3-ba19-7db05366cb46",
          x: 995.5768189591934,
          y: 1471.7037966161708,
          width: 150.00006103515625,
          height: 150,
          nodeType: "Shape",
          nodeInfo: {
            type: "if-condition",
            formValues: {
              Mode: "expression",
              expression: "input > 1",
              inputType: "number"
            }
          }
        },
        {
          id: "8b4d139e-d2a1-4b0d-8704-96253244259e",
          x: 1706.4791327147084,
          y: 1690.116273801721,
          width: 200,
          height: 112,
          nodeType: "Shape",
          nodeInfo: {
            type: "expression",
            formValues: {
              expression: "list",
              inputType: "array"
            },
            showFormOnlyInPopup: true,
            isSettingsPopup: true
          }
        },
        {
          id: "8f32302e-b15b-4cd4-9081-5141bc436a88",
          x: 4389.388279748456,
          y: 1089.9590799946316,
          width: 100,
          height: 105,
          nodeType: "Shape",
          nodeInfo: {
            type: "merge",
            formValues: {},
            nodeCannotBeReplaced: false,
            showFormOnlyInPopup: false,
            useInCompositionOnly: false
          }
        },
        {
          id: "69eb24d4-6d14-4810-bd54-4fc60b9a7add",
          x: 4632.433117472752,
          y: 1100.8311954124238,
          width: 280,
          height: 100,
          nodeType: "Shape",
          nodeInfo: {
            type: "push-value-to-array-variable",
            formValues: {
              variableName: "result"
            },
            decorators: [
              {
                taskType: "expression",
                formValues: {
                  expression: "a",
                  inputType: "number"
                },
                executeOrder: "before"
              }
            ],
            nodeCannotBeReplaced: false,
            showFormOnlyInPopup: true,
            useInCompositionOnly: false
          }
        },
        {
          id: "8cdf2e63-4901-4c60-9117-7d015acdbe86",
          x: 5108.050577273252,
          y: 1099.7683300018236,
          width: 280,
          height: 100,
          nodeType: "Shape",
          nodeInfo: {
            type: "push-value-to-array-variable",
            formValues: {
              variableName: "result"
            },
            decorators: [
              {
                taskType: "expression",
                formValues: {
                  expression: "pivot",
                  inputType: "number"
                },
                executeOrder: "before"
              }
            ],
            nodeCannotBeReplaced: false,
            showFormOnlyInPopup: true,
            useInCompositionOnly: false
          }
        },
        {
          id: "ff455640-c329-4261-ab26-c703e6061f6f",
          x: 5552.244892255547,
          y: 1099.5151392823363,
          width: 280,
          height: 100,
          nodeType: "Shape",
          nodeInfo: {
            type: "push-value-to-array-variable",
            formValues: {
              variableName: "result"
            },
            decorators: [
              {
                taskType: "expression",
                formValues: {
                  expression: "b",
                  inputType: "number"
                },
                executeOrder: "before"
              }
            ],
            nodeCannotBeReplaced: false,
            showFormOnlyInPopup: true,
            useInCompositionOnly: false
          }
        },
        {
          id: "547b5f2e-1973-4394-8de3-a098f3859d39",
          x: 5987.154865350469,
          y: 1086.464773541189,
          width: 200,
          height: 112,
          nodeType: "Shape",
          nodeInfo: {
            type: "expression",
            formValues: {
              expression: "result",
              inputType: "array"
            },
            showFormOnlyInPopup: true,
            isSettingsPopup: true
          }
        },
        {
          id: "a630f2d2-72e4-4dbf-a919-feb1d3d27e0b",
          x: 6302.2605252033045,
          y: 1114.66007823758,
          width: 119.99995930992581,
          height: 56.00009577570577,
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
          id: "8edc3799-eec3-4aea-aa97-5ec27b220c59",
          x: 1590.8411394303123,
          y: 1024.9274055339058,
          width: 119.9998971330694,
          height: 108.00005677832554,
          nodeType: "Shape",
          nodeInfo: {
            type: "scope-variable",
            formValues: {
              variableName: "pivot",
              initialValue: "0",
              fieldType: "value",
              fieldValueType: "number"
            },
            isVariable: true,
            nodeCannotBeReplaced: true
          }
        },
        {
          id: "4212ea62-bb49-4ec4-9420-1abe506d8744",
          x: 1179.4311089005996,
          y: 1276.6603278418168,
          width: 300,
          height: 64,
          nodeType: "Shape",
          nodeInfo: {
            type: "pop-array-value",
            formValues: {
              variableName: "list",
              popMode: "begin"
            },
            nodeCannotBeReplaced: false,
            showFormOnlyInPopup: true,
            useInCompositionOnly: false
          }
        },
        {
          id: "2832411d-c176-4ed6-abe4-7ae89e7402a8",
          x: 1569.4318742975731,
          y: 1238.7197790112225,
          width: 200,
          height: 128,
          nodeType: "Shape",
          nodeInfo: {
            type: "set-variable",
            formValues: {
              variableName: "pivot"
            },
            nodeCannotBeReplaced: false,
            showFormOnlyInPopup: false,
            useInCompositionOnly: false
          }
        },
        {
          id: "570c3fa8-82a2-4d9c-adad-d8394df6470e",
          x: 2089.113475539736,
          y: 1711.970013581653,
          width: 119.9998971330694,
          height: 56.00012624708932,
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
          id: "9f540563-f857-4072-83f0-7d97cfcc9181",
          x: 4370.015563073987,
          y: 2345.0875695438044,
          width: 464.80459511671467,
          height: 304.0000318976285,
          nodeType: "Shape",
          nodeInfo: {
            type: "node-tree-visualizer",
            formValues: {
              commandHandlerName: "node-tree"
            },
            isVariable: true,
            showFormOnlyInPopup: true,
            initializeOnStartFlow: true
          }
        },
        {
          id: "3db0b201-48a6-4f56-aa9d-50f6ac2dbd99",
          x: 1900.715797929765,
          y: 1278.0462408685712,
          width: 200,
          height: 64,
          nodeType: "Shape",
          nodeInfo: {
            type: "init-array-variable",
            formValues: {
              variableName: "result"
            },
            nodeCannotBeReplaced: false,
            showFormOnlyInPopup: true,
            useInCompositionOnly: false
          }
        },
        {
          id: "847997cb-d956-4dd6-b2fb-835629c0950a",
          x: 2224.1599890438983,
          y: 1279.5221553928552,
          width: 200,
          height: 64,
          nodeType: "Shape",
          nodeInfo: {
            type: "init-array-variable",
            formValues: {
              variableName: "left"
            },
            nodeCannotBeReplaced: false,
            showFormOnlyInPopup: true,
            useInCompositionOnly: false
          }
        },
        {
          id: "73dea4e6-5154-476c-8967-5df8be2e9352",
          x: 2551.504144517578,
          y: 1279.9380080674803,
          width: 200,
          height: 64,
          nodeType: "Shape",
          nodeInfo: {
            type: "init-array-variable",
            formValues: {
              variableName: "right"
            },
            nodeCannotBeReplaced: false,
            showFormOnlyInPopup: true,
            useInCompositionOnly: false
          }
        },
        {
          id: "580e57c7-a82a-4061-9b6d-3741bff8e2ef",
          x: 3659.443845203107,
          y: 1249.7780106814487,
          width: 110.00003157201496,
          height: 155.00003106025184,
          nodeType: "Shape",
          nodeInfo: {
            type: "sequential",
            formValues: {
              ["output-thumbs"]: [
                {
                  thumbName: "test2"
                }
              ]
            },
            isSettingsPopup: true
          }
        },
        {
          id: "4b426b1d-26c5-4b2a-9961-c81e78e24f1a",
          x: 3056.9465061151577,
          y: 1311.7249696114905,
          endX: 3245.314301112891,
          endY: 1283.8676666402484,
          startNodeId: "4337e04c-f6b7-4de1-b6f6-b377e9ed70ef",
          endNodeId: "3148c1c0-f69d-43ef-88ca-dbdfe11662f3",
          startThumbName: "output",
          endThumbName: "input",
          lineType: "BezierCubic",
          nodeType: "Connection",
          layer: 1,
          nodeInfo: {}
        },
        {
          id: "0993369a-9bb5-42fb-878a-da10aee0eda1",
          x: 2263.01030372355,
          y: 401.27475675273274,
          endX: 2441.1601609677455,
          endY: 483.8281459266993,
          startNodeId: "82041c9e-06dc-42f3-b2b0-5abbab74cbfc",
          endNodeId: "653e1564-2017-42fa-b071-7c6ee7db877d",
          startThumbName: "output",
          endThumbName: "min",
          lineType: "BezierCubic",
          nodeType: "Connection",
          layer: 1,
          nodeInfo: {}
        },
        {
          id: "b52f8ba0-7f5d-45fb-8008-bff45301ab94",
          x: 2591.1601609677455,
          y: 531.3281459266993,
          endX: 2716.5348183649594,
          endY: 531.4680797584579,
          startNodeId: "653e1564-2017-42fa-b071-7c6ee7db877d",
          endNodeId: "303e3b52-15e0-4a3d-873a-044469feeb6f",
          startThumbName: "output",
          endThumbName: "input",
          lineType: "BezierCubic",
          nodeType: "Connection",
          layer: 1,
          nodeInfo: {}
        },
        {
          id: "3a25f95d-b24b-462d-a237-ffd375c5945f",
          x: 2260.4109679115663,
          y: 613.215263089041,
          endX: 2441.1601609677455,
          endY: 533.8281459266993,
          startNodeId: "f5d47be2-da69-440a-9e81-f9c88d082ab6",
          endNodeId: "653e1564-2017-42fa-b071-7c6ee7db877d",
          startThumbName: "output",
          endThumbName: "max",
          lineType: "BezierCubic",
          nodeType: "Connection",
          layer: 1,
          nodeInfo: {}
        },
        {
          id: "d4dc5b0c-14f8-45ca-81d8-34b394b885b9",
          x: 3196.873511538354,
          y: 540.575259802187,
          endX: 3355.787738629858,
          endY: 589.2941930504978,
          startNodeId: "50f3976a-1752-402a-b003-81d8d38a4a88",
          endNodeId: "03937c1d-ef2c-4d29-8515-c53fc06d4c16",
          startThumbName: "output",
          endThumbName: "input",
          lineType: "BezierCubic",
          nodeType: "Connection",
          layer: 1,
          nodeInfo: {}
        },
        {
          id: "4c1c6050-66e2-4858-9f57-fe4d1d82bd03",
          x: 3555.787738629858,
          y: 589.2941930504978,
          endX: 3756.2933223315104,
          endY: 542.6116735119815,
          startNodeId: "03937c1d-ef2c-4d29-8515-c53fc06d4c16",
          endNodeId: "dea7a8ed-f5e3-496e-9ff9-e16d927b05b9",
          startThumbName: "output",
          endThumbName: "input",
          lineType: "BezierCubic",
          nodeType: "Connection",
          layer: 1,
          nodeInfo: {}
        },
        {
          id: "6fbec0b2-3790-4d96-9811-e52cc065a497",
          x: 2826.5348183649594,
          y: 506.4680797584578,
          endX: 2996.873511538354,
          endY: 538.575259802187,
          startNodeId: "303e3b52-15e0-4a3d-873a-044469feeb6f",
          endNodeId: "50f3976a-1752-402a-b003-81d8d38a4a88",
          startThumbName: "output1",
          endThumbName: "array",
          lineType: "BezierCubic",
          nodeType: "Connection",
          layer: 1,
          nodeInfo: {}
        },
        {
          id: "dc08ee91-10b2-4966-967c-bf0e27ca86b2",
          x: 2826.5348183649594,
          y: 556.4680797584579,
          endX: 2953.54283405415,
          endY: 730.407077289538,
          startNodeId: "303e3b52-15e0-4a3d-873a-044469feeb6f",
          endNodeId: "a486f1d5-a951-42b0-8225-dcf2223040d7",
          startThumbName: "output2",
          endThumbName: "input",
          lineType: "BezierCubic",
          nodeType: "Connection",
          layer: 1,
          nodeInfo: {}
        },
        {
          id: "47ad8fa7-743a-4462-9806-1d8a6e54af74",
          x: 3355.314301112891,
          y: 1308.8676666402484,
          endX: 3524.384884219816,
          endY: 1676.939775204935,
          startNodeId: "3148c1c0-f69d-43ef-88ca-dbdfe11662f3",
          endNodeId: "47808db5-94a1-4a07-81e6-7ba8b382920a",
          startThumbName: "output2",
          endThumbName: "input",
          lineType: "BezierCubic",
          nodeType: "Connection",
          layer: 1,
          nodeInfo: {}
        },
        {
          id: "f914536e-9065-4366-b7a6-98588389c549",
          x: 3599.384884219816,
          y: 1601.939775204935,
          endX: 3946.148882813113,
          endY: 1634.2976882898756,
          startNodeId: "47808db5-94a1-4a07-81e6-7ba8b382920a",
          endNodeId: "b87159d6-99f1-472f-9601-0b565589d1aa",
          startThumbName: "success",
          endThumbName: "value",
          lineType: "BezierCubic",
          nodeType: "Connection",
          layer: 1,
          nodeInfo: {}
        },
        {
          id: "0c06d6af-0a74-4acb-9bec-e4ac5cbd0d98",
          x: 3599.384884219816,
          y: 1751.939775204935,
          endX: 3754.879437138114,
          endY: 1846.0558847606767,
          startNodeId: "47808db5-94a1-4a07-81e6-7ba8b382920a",
          endNodeId: "be92fbf3-3b0d-49d3-812e-8401754903ce",
          startThumbName: "failure",
          endThumbName: "input",
          lineType: "BezierCubic",
          nodeType: "Connection",
          layer: 1,
          nodeInfo: {}
        },
        {
          id: "5062ded7-e8f1-4603-8f77-83e510e54097",
          x: 394.71696578746355,
          y: 1548.7296270141114,
          endX: 652.4522517632229,
          endY: 1547.3610494747431,
          startNodeId: "f2d31b4a-a260-4068-87bc-e6116aebd33b",
          endNodeId: "4748116f-5cc8-4615-a9a0-6115e4a53d2e",
          startThumbName: "output",
          endThumbName: "input",
          lineType: "BezierCubic",
          nodeType: "Connection",
          layer: 1,
          nodeInfo: {}
        },
        {
          id: "1d60d432-3c89-44df-9751-e548a24fcc58",
          x: 3355.314301112891,
          y: 1258.8676666402484,
          endX: 3659.443845203107,
          endY: 1327.2780262115746,
          startNodeId: "3148c1c0-f69d-43ef-88ca-dbdfe11662f3",
          endNodeId: "580e57c7-a82a-4061-9b6d-3741bff8e2ef",
          startThumbName: "output1",
          endThumbName: "input",
          lineType: "BezierCubic",
          nodeType: "Connection",
          layer: 1,
          nodeInfo: {}
        },
        {
          id: "d0874759-da8f-496c-bc77-a8bf4e62f129",
          x: 3769.4438767751217,
          y: 1279.7780106814487,
          endX: 3936.1505948128647,
          endY: 1058.0330534904745,
          startNodeId: "580e57c7-a82a-4061-9b6d-3741bff8e2ef",
          endNodeId: "9fd36007-96e4-4682-8f95-dd895e35c564",
          startThumbName: "output1",
          endThumbName: "input",
          lineType: "BezierCubic",
          nodeType: "Connection",
          layer: 1,
          nodeInfo: {}
        },
        {
          id: "70e3a57f-b735-4d83-90b2-2399e14810b4",
          x: 3769.4438767751217,
          y: 1379.7780106814487,
          endX: 3932.92410484883,
          endY: 1573.1190786305485,
          startNodeId: "580e57c7-a82a-4061-9b6d-3741bff8e2ef",
          endNodeId: "73aaeb72-0eff-4e08-bc45-d23d304b5ba0",
          startThumbName: "output3",
          endThumbName: "input",
          lineType: "BezierCubic",
          nodeType: "Connection",
          layer: 1,
          nodeInfo: {}
        },
        {
          id: "812ad093-4376-4af8-8b70-8835c34c79b6",
          x: 852.4522517632229,
          y: 1547.3610494747431,
          endX: 995.5768189591934,
          endY: 1546.7037966161708,
          startNodeId: "4748116f-5cc8-4615-a9a0-6115e4a53d2e",
          endNodeId: "b5e50d91-4909-45f3-ba19-7db05366cb46",
          startThumbName: "output",
          endThumbName: "input",
          lineType: "BezierCubic",
          nodeType: "Connection",
          layer: 1,
          nodeInfo: {}
        },
        {
          id: "951992e5-3705-4bb9-b12a-76e5209508b3",
          x: 1070.5768494767715,
          y: 1621.7037966161708,
          endX: 1706.4791327147084,
          endY: 1746.116273801721,
          startNodeId: "b5e50d91-4909-45f3-ba19-7db05366cb46",
          endNodeId: "8b4d139e-d2a1-4b0d-8704-96253244259e",
          startThumbName: "failure",
          endThumbName: "input",
          lineType: "BezierCubic",
          nodeType: "Connection",
          layer: 1,
          nodeInfo: {}
        },
        {
          id: "05dcb162-ac11-4900-b130-bc366056e894",
          x: 4136.15035067224,
          y: 1058.0330534904745,
          endX: 4389.388279748456,
          endY: 1119.9590799946316,
          startNodeId: "9fd36007-96e4-4682-8f95-dd895e35c564",
          endNodeId: "8f32302e-b15b-4cd4-9081-5141bc436a88",
          startThumbName: "output",
          endThumbName: "a",
          lineType: "BezierCubic",
          nodeType: "Connection",
          layer: 1,
          nodeInfo: {}
        },
        {
          id: "5f1bb296-1e85-4899-bc36-db1f4de82f11",
          x: 4132.92410484883,
          y: 1573.1190786305485,
          endX: 4389.388279748456,
          endY: 1169.9590799946316,
          startNodeId: "73aaeb72-0eff-4e08-bc45-d23d304b5ba0",
          endNodeId: "8f32302e-b15b-4cd4-9081-5141bc436a88",
          startThumbName: "output",
          endThumbName: "b",
          lineType: "BezierCubic",
          nodeType: "Connection",
          layer: 1,
          nodeInfo: {}
        },
        {
          id: "94c1383f-d959-470a-b56b-b33339b70f0d",
          x: 4489.388279748456,
          y: 1142.4590799946316,
          endX: 4632.433117472752,
          endY: 1150.8311954124238,
          startNodeId: "8f32302e-b15b-4cd4-9081-5141bc436a88",
          endNodeId: "69eb24d4-6d14-4810-bd54-4fc60b9a7add",
          startThumbName: "output",
          endThumbName: "value",
          lineType: "BezierCubic",
          nodeType: "Connection",
          layer: 1,
          nodeInfo: {}
        },
        {
          id: "c097d532-0089-4465-b353-ed7eeedf99cf",
          x: 4912.433117472752,
          y: 1150.8311954124238,
          endX: 5108.050577273252,
          endY: 1149.7683300018236,
          startNodeId: "69eb24d4-6d14-4810-bd54-4fc60b9a7add",
          endNodeId: "8cdf2e63-4901-4c60-9117-7d015acdbe86",
          startThumbName: "output",
          endThumbName: "value",
          lineType: "BezierCubic",
          nodeType: "Connection",
          layer: 1,
          nodeInfo: {}
        },
        {
          id: "97221acc-59da-4edd-8074-d95f56775ecf",
          x: 5388.050577273252,
          y: 1149.7683300018236,
          endX: 5552.244892255547,
          endY: 1149.5151392823363,
          startNodeId: "8cdf2e63-4901-4c60-9117-7d015acdbe86",
          endNodeId: "ff455640-c329-4261-ab26-c703e6061f6f",
          startThumbName: "output",
          endThumbName: "value",
          lineType: "BezierCubic",
          nodeType: "Connection",
          layer: 1,
          nodeInfo: {}
        },
        {
          id: "7d70632b-56ca-41a1-b883-55ed441c2596",
          x: 5832.244892255547,
          y: 1149.5151392823363,
          endX: 5987.154865350469,
          endY: 1142.464773541189,
          startNodeId: "ff455640-c329-4261-ab26-c703e6061f6f",
          endNodeId: "547b5f2e-1973-4394-8de3-a098f3859d39",
          startThumbName: "output",
          endThumbName: "input",
          lineType: "BezierCubic",
          nodeType: "Connection",
          layer: 1,
          nodeInfo: {}
        },
        {
          id: "d064e959-bbcb-4b24-afd7-fad3533379cc",
          x: 6187.154865350469,
          y: 1142.464773541189,
          endX: 6302.2605252033045,
          endY: 1144.66007823758,
          startNodeId: "547b5f2e-1973-4394-8de3-a098f3859d39",
          endNodeId: "a630f2d2-72e4-4dbf-a919-feb1d3d27e0b",
          startThumbName: "output",
          endThumbName: "input",
          lineType: "BezierCubic",
          nodeType: "Connection",
          layer: 1,
          nodeInfo: {}
        },
        {
          id: "5a78d13b-8241-4143-915d-3c03cd066bac",
          x: 3904.879437138114,
          y: 1846.0558847606767,
          endX: 4042.670756921451,
          endY: 1841.065673728428,
          startNodeId: "be92fbf3-3b0d-49d3-812e-8401754903ce",
          endNodeId: "4f3054da-f290-4eae-86d0-a2b1bbc60805",
          startThumbName: "success",
          endThumbName: "value",
          lineType: "BezierCubic",
          nodeType: "Connection",
          layer: 1,
          nodeInfo: {}
        },
        {
          id: "58491e2d-ad15-419f-bfc0-2a7183d06c09",
          x: 1479.4311089005996,
          y: 1308.6603278418168,
          endX: 1569.4318742975731,
          endY: 1302.7197790112225,
          startNodeId: "4212ea62-bb49-4ec4-9420-1abe506d8744",
          endNodeId: "2832411d-c176-4ed6-abe4-7ae89e7402a8",
          startThumbName: "output",
          endThumbName: "input",
          lineType: "BezierCubic",
          nodeType: "Connection",
          layer: 1,
          nodeInfo: {}
        },
        {
          id: "e3dfdff2-ae58-4b22-86a7-3628bb2c6fed",
          x: 1070.5768494767715,
          y: 1471.7037966161708,
          endX: 1179.4311089005996,
          endY: 1308.6603278418168,
          startNodeId: "b5e50d91-4909-45f3-ba19-7db05366cb46",
          endNodeId: "4212ea62-bb49-4ec4-9420-1abe506d8744",
          startThumbName: "success",
          endThumbName: "input",
          lineType: "BezierCubic",
          nodeType: "Connection",
          layer: 1,
          nodeInfo: {}
        },
        {
          id: "130ab274-1dd7-454b-bbf9-f7a36cfcbc59",
          x: 1906.4791327147084,
          y: 1746.116273801721,
          endX: 2089.113475539736,
          endY: 1741.970013581653,
          startNodeId: "8b4d139e-d2a1-4b0d-8704-96253244259e",
          endNodeId: "570c3fa8-82a2-4d9c-adad-d8394df6470e",
          startThumbName: "output",
          endThumbName: "input",
          lineType: "BezierCubic",
          nodeType: "Connection",
          layer: 1,
          nodeInfo: {}
        },
        {
          id: "41e0b478-5faa-4753-aaf2-147c28f28113",
          x: 1769.4318742975731,
          y: 1302.7197790112225,
          endX: 1900.715797929765,
          endY: 1308.0462408685712,
          startNodeId: "2832411d-c176-4ed6-abe4-7ae89e7402a8",
          endNodeId: "3db0b201-48a6-4f56-aa9d-50f6ac2dbd99",
          startThumbName: "output",
          endThumbName: "array",
          lineType: "BezierCubic",
          nodeType: "Connection",
          layer: 1,
          nodeInfo: {}
        },
        {
          id: "1d9f0cd6-45d8-47cc-8281-09ffb8c39c43",
          x: 2751.504144517578,
          y: 1311.9380080674803,
          endX: 2856.9465061151577,
          endY: 1311.7249696114905,
          startNodeId: "73dea4e6-5154-476c-8967-5df8be2e9352",
          endNodeId: "4337e04c-f6b7-4de1-b6f6-b377e9ed70ef",
          startThumbName: "output",
          endThumbName: "input",
          lineType: "BezierCubic",
          nodeType: "Connection",
          layer: 1,
          nodeInfo: {}
        },
        {
          id: "c421737a-b5fa-4c48-9c84-2ca02878b7c6",
          x: 2424.1599890438983,
          y: 1311.5221553928552,
          endX: 2551.504144517578,
          endY: 1309.9380080674803,
          startNodeId: "847997cb-d956-4dd6-b2fb-835629c0950a",
          endNodeId: "73dea4e6-5154-476c-8967-5df8be2e9352",
          startThumbName: "output",
          endThumbName: "array",
          lineType: "BezierCubic",
          nodeType: "Connection",
          layer: 1,
          nodeInfo: {}
        },
        {
          id: "72a2c6a5-7b2f-4ca2-b46b-2e16a3cc9d2b",
          x: 2100.715797929765,
          y: 1310.0462408685712,
          endX: 2224.1599890438983,
          endY: 1309.5221553928552,
          startNodeId: "3db0b201-48a6-4f56-aa9d-50f6ac2dbd99",
          endNodeId: "847997cb-d956-4dd6-b2fb-835629c0950a",
          startThumbName: "output",
          endThumbName: "array",
          lineType: "BezierCubic",
          nodeType: "Connection",
          layer: 1,
          nodeInfo: {}
        },
        {
          id: "7a370f94-c7ce-48d9-ab89-3077a1082e2d",
          x: 3769.4438767751217,
          y: 1329.7780106814487,
          endX: 4024.037082155491,
          endY: 1328.9378935943637,
          startNodeId: "580e57c7-a82a-4061-9b6d-3741bff8e2ef",
          endNodeId: "7959fe32-a8e1-4672-b6ef-dc5de0818540",
          startThumbName: "output2",
          endThumbName: "input",
          lineType: "BezierCubic",
          nodeType: "Connection",
          layer: 1,
          nodeInfo: {}
        },
        {
          id: "7959fe32-a8e1-4672-b6ef-dc5de0818540",
          x: 4024.037082155491,
          y: 1192.9378679273411,
          width: 199.9997566356164,
          height: 272.00005133404494,
          nodeType: "Shape",
          nodeInfo: {
            type: "send-node-to-node-tree",
            formValues: {
              expression: "pivot"
            },
            nodeCannotBeReplaced: false,
            showFormOnlyInPopup: false,
            useInCompositionOnly: false,
            taskType: "send-node-to-node-tree"
          }
        }
      ]
    }
  },
  compositions: {}
};