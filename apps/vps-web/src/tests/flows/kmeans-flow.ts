import { Flow, FlowEndpoint,FlowMeta } from "@devhelpr/visual-programming-system";
import { NodeInfo } from "@devhelpr/web-flow-executor";
export const metaData : FlowMeta = {
  title: "Initialisation : create 100 random points and initialize centroids with random points (use variable k for number of clusters)"
};  
export const endpoints : Record<string,FlowEndpoint> = {
  default: {
    id: "default",
    type: "default",
    name: "default",
    group: "endpoints",
    outputs: [
      {
        id: "d074bb8f-1693-45b6-80ab-e5ed4557c4fa",
        name: "output",
        type: "show-input"
      }
    ]
  },
  default_1: {
    id: "d6a6b905-9c2d-4bbe-b489-acbae0355ede",
    type: "expression",
    name: "default_1",
    group: "endpoints",
    outputs: [
      {
        id: "d074bb8f-1693-45b6-80ab-e5ed4557c4fa",
        name: "output",
        type: "show-input"
      }
    ]
  },
  default_2: {
    id: "1b20430f-e529-4493-a163-aa9e999560c7",
    type: "start-node",
    name: "default_2",
    group: "endpoints",
    outputs: [
      {
        id: "d074bb8f-1693-45b6-80ab-e5ed4557c4fa",
        name: "output",
        type: "show-input"
      }
    ]
  },
  default_3: {
    id: "e370f15f-1236-4ce3-80b1-c03082dc303e",
    type: "observe-variable",
    name: "default_3",
    group: "endpoints",
    outputs: []
  },
  default_4: {
    id: "472fd563-dd51-4ce1-8b2b-756acb532d7d",
    type: "observe-variable",
    name: "default_4",
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
          id: "f030a86e-2280-4b12-8615-4644f98cb625",
          x: 3218.510068723205,
          y: 1079.3107144634794,
          width: 239.99991332800636,
          height: 215.99996927315948,
          nodeType: "Shape",
          nodeInfo: {
            type: "variable",
            formValues: {
              variableName: "data",
              initialValue: "",
              fieldType: "array",
              fieldValueType: "number"
            },
            isVariable: true,
            nodeCannotBeReplaced: true
          }
        },
        {
          id: "693410e0-2810-4237-b888-07ea51248a6e",
          x: 3605.68753580387,
          y: 1102.179755079369,
          width: 120.00008312827404,
          height: 83.99996325026315,
          nodeType: "Shape",
          nodeInfo: {
            type: "variable",
            formValues: {
              variableName: "clusters",
              initialValue: "",
              fieldType: "array",
              fieldValueType: "array"
            },
            isVariable: true,
            nodeCannotBeReplaced: true
          }
        },
        {
          id: "dab880f1-662c-4e23-98eb-4b374ca84e68",
          x: 3901.659453834542,
          y: 1076.8259188667582,
          width: 120.00008312827404,
          height: 83.99996325026315,
          nodeType: "Shape",
          nodeInfo: {
            type: "variable",
            formValues: {
              variableName: "centroids",
              initialValue: "",
              fieldType: "array",
              fieldValueType: "number"
            },
            isVariable: true,
            nodeCannotBeReplaced: true
          }
        },
        {
          id: "ae56dc77-4c0e-479c-9caf-390762aac180",
          x: 3263.074212637936,
          y: 1621.031313917981,
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
          id: "248c7829-295b-44fd-b581-18cafc953842",
          x: 2928.9264141208932,
          y: 1544.9889592387547,
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
          id: "bfc7c418-33fa-44a9-bd5a-5acef9038735",
          x: 2924.212382306903,
          y: 1717.5867652234415,
          width: 200,
          height: 112,
          nodeType: "Shape",
          nodeInfo: {
            type: "value",
            formValues: {
              value: "100"
            }
          }
        },
        {
          id: "be12c859-b2c1-4be9-9359-ced5985aebcc",
          x: 3502.101617072024,
          y: 1630.6227343932114,
          width: 110,
          height: 110,
          nodeType: "Shape",
          nodeInfo: {
            type: "map",
            formValues: {}
          }
        },
        {
          id: "7b8c7fbf-81d0-4ea7-adb3-1ce04f0ce5c5",
          x: 3705.1795902474455,
          y: 1720.5065054596478,
          width: 229.20923207859414,
          height: 115.77249145425958,
          nodeType: "Shape",
          nodeInfo: {
            type: "expression",
            formValues: {
              expression: "[random() , random()]",
              inputType: "number"
            },
            showFormOnlyInPopup: true,
            isSettingsPopup: true
          }
        },
        {
          id: "2b646b69-3b5d-41b0-b1bf-65cff9b6898b",
          x: 3808.52078598491,
          y: 1602.4215404853467,
          width: 200,
          height: 64,
          nodeType: "Shape",
          nodeInfo: {
            type: "set-array-variable",
            formValues: {
              variableName: "data"
            },
            nodeCannotBeReplaced: false,
            showFormOnlyInPopup: true,
            useInCompositionOnly: false
          }
        },
        {
          id: "3b1c2a61-436e-4625-93e9-8e6117ba0424",
          x: 2948.003739242402,
          y: 1092.1766682834289,
          width: 120.00008312827404,
          height: 83.99996325026315,
          nodeType: "Shape",
          nodeInfo: {
            type: "variable",
            formValues: {
              variableName: "k",
              initialValue: "5",
              fieldType: "value",
              fieldValueType: "number"
            },
            isVariable: true,
            nodeCannotBeReplaced: true
          }
        },
        {
          id: "ac063440-0517-4880-8ffc-79610e86fc7a",
          x: 4548.207982977223,
          y: 1741.4621262284763,
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
          id: "d6a6b905-9c2d-4bbe-b489-acbae0355ede",
          x: 4120.909137276225,
          y: 2003.2320601343065,
          width: 200,
          height: 111.9998779296875,
          nodeType: "Shape",
          nodeInfo: {
            type: "expression",
            formValues: {
              expression: "k",
              inputType: "number"
            },
            showFormOnlyInPopup: true,
            isSettingsPopup: true
          }
        },
        {
          id: "d1f557d9-2ce4-47f4-9982-6739dfce3b7b",
          x: 4839.885203842909,
          y: 1770.5647124219797,
          width: 110,
          height: 110,
          nodeType: "Shape",
          nodeInfo: {
            type: "map",
            formValues: {}
          }
        },
        {
          id: "28fe4ef5-5577-4943-a722-a2c1c618b7e2",
          x: 5039.513606938384,
          y: 1870.024157597062,
          width: 223.00997277902025,
          height: 119.87738546114588,
          nodeType: "Shape",
          nodeInfo: {
            type: "expression",
            formValues: {
              expression: "[random() , random()]",
              inputType: "number"
            },
            showFormOnlyInPopup: true,
            isSettingsPopup: true
          }
        },
        {
          id: "ea7bdf4e-6c33-48f4-b633-bff38ffb2a3c",
          x: 5012.936333470498,
          y: 1710.9236203121095,
          width: 200,
          height: 64,
          nodeType: "Shape",
          nodeInfo: {
            type: "set-array-variable",
            formValues: {
              variableName: "centroids"
            },
            nodeCannotBeReplaced: false,
            showFormOnlyInPopup: true,
            useInCompositionOnly: false
          }
        },
        {
          id: "a301c7c2-c840-449c-8fcf-094168b0a42a",
          x: 4237.832875462038,
          y: 1727.7376854356596,
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
          id: "d68aeeb6-d2b2-4503-a704-7d21334b9c7f",
          x: 7529.235659441017,
          y: 809.8628137256552,
          width: 541.607184260587,
          height: 520.5699638027584,
          nodeType: "Shape",
          nodeInfo: {
            type: "iframe-html-node",
            formValues: {
              html: "<!DOCTYPE html>\n<html lang=\"en\">\n  <head>\n    <meta charset=\"UTF-8\" />\n    <meta name=\"viewport\" content=\"width=device-width, initial-scale=1.0\" />\n    <title>Plot visualization</title>\n    <script src=\"https://cdn.tailwindcss.com\"></script>\n    <style>\n      .wrapper {\n        display: flex;\n        flex-direction: row;\n        gap: 4px;\n        height: 100vh;\n        align-items: center;\n        justify-content: center;\n        padding: 4px;\n      }\n    </style>\n  </head>\n  <body class=\"bg-white\">\n    <div class=\"min-h-screen flex wrapper\" id=\"inner\">\n      <svg\n        id=\"svg\"\n        class=\"object-cover h-full w-full\"\n        viewbox=\"0 0 1200 1200\"\n      ></svg>\n    </div>\n\n    <script>\n      // Define the colors for the clusters .. borrowed the d3-palette colors observable10\n      let colors = [\n        '#4269d0',\n        '#efb118',\n        '#ff725c',\n        '#6cc5b0',\n        '#3ca951',\n        '#ff8ab7',\n        '#a463f2',\n        '#97bbf5',\n        '#9c6b4e',\n        '#9498a0',\n      ];\n      function getColor(index) {\n        return colors[index % colors.length];\n      }\n\n      function getDarkenColor(index) {\n        // darken color with pure javascript\n        let color = colors[index % colors.length];\n        let r = parseInt(color.slice(1, 3), 16);\n        let g = parseInt(color.slice(3, 5), 16);\n        let b = parseInt(color.slice(5, 7), 16);\n\n        const newColor = [r, g, b].map((c) => parseInt((c * 0.75).toFixed(0)));\n\n        return `#${newColor[0].toString(16)}${newColor[1].toString(\n          16\n        )}${newColor[2].toString(16)}`;\n      }\n      // Initialize the global variable \"input\"\n      window.input = window.input;\n      let inputstream = [];\n      let initialized = false;\n      let elements = [];\n      let svg = document.getElementById('svg');\n      // Function to rerender the UI\n      function rerenderUI() {\n        if (!initialized && window['createElement']) {\n          initialized = true;\n        }\n        let documentFragment = document.createDocumentFragment();\n        if (window.input !== undefined && window.input.clusters) {\n          if (Array.isArray(window.input.clusters)) {\n            window.input.clusters.forEach((element, index) => {\n              if (Array.isArray(element)) {\n                element.forEach((point, i) => {\n                  if (Array.isArray(point)) {\n                    let circle = document.createElementNS(\n                      'http://www.w3.org/2000/svg',\n                      'circle'\n                    );\n                    circle.setAttribute('cx', point[0] * 10 + 100);\n                    circle.setAttribute('cy', point[1] * 10 + 100);\n                    circle.setAttribute('r', 25);\n                    circle.setAttribute('fill', getColor(index));\n                    documentFragment.appendChild(circle);\n                  }\n                });\n              }\n            });\n            if (window.input.centroids) {\n              window.input.centroids.forEach((element, index) => {\n                if (Array.isArray(element)) {\n                  let circle = document.createElementNS(\n                    'http://www.w3.org/2000/svg',\n                    'circle'\n                  );\n                  circle.setAttribute('cx', element[0] * 10 + 100);\n                  circle.setAttribute('cy', element[1] * 10 + 100);\n                  circle.setAttribute('r', 50);\n                  circle.setAttribute('fill-opacity', \"50%\"); \n                  circle.setAttribute('fill', getDarkenColor(index));\n                  documentFragment.appendChild(circle);\n                }\n              });\n            }\n          }\n        }\n        svg.innerHTML = '';\n        svg.appendChild(documentFragment);\n      }\n\n      // Attach the rerenderUI function to the global onExecute method\n      window.onExecute = rerenderUI;\n\n      rerenderUI();\n    </script>\n  </body>\n</html>\n",
              aiprompt: ""
            },
            showFormOnlyInPopup: true,
            initializeOnStartFlow: true
          }
        },
        {
          id: "8a5cfde7-22fd-4f25-8af4-4540f69e3c8f",
          x: 5721.680464640531,
          y: 1659.6576691336236,
          width: 110,
          height: 110,
          nodeType: "Shape",
          nodeInfo: {
            type: "map",
            formValues: {}
          }
        },
        {
          id: "1d1b2896-c11d-4ddd-a4b8-1d3b77e493ba",
          x: 5924.359698349896,
          y: 1765.7883444118866,
          width: 200,
          height: 112,
          nodeType: "Shape",
          nodeInfo: {
            type: "expression",
            formValues: {
              expression: "[]",
              inputType: "number"
            },
            showFormOnlyInPopup: true,
            isSettingsPopup: true
          }
        },
        {
          id: "ab054f77-2e88-49ec-afe6-848468c0be3c",
          x: 5925.051508209566,
          y: 1630.4898975210604,
          width: 200,
          height: 64,
          nodeType: "Shape",
          nodeInfo: {
            type: "set-array-variable",
            formValues: {
              variableName: "clusters"
            },
            nodeCannotBeReplaced: false,
            showFormOnlyInPopup: true,
            useInCompositionOnly: false
          }
        },
        {
          id: "6373efe5-c0de-4674-8e62-94917080c536",
          x: 5757.601045429119,
          y: 2943.490693639539,
          width: 542.0078125,
          height: 136,
          nodeType: "Shape",
          nodeInfo: {
            type: "register-expression-function-node",
            formValues: {
              functionName: "distances_to_each_centroid",
              customFunctionCode: "(centroids, points, clusters) => {\n  if (\n    Array.isArray(centroids) &&\n    Array.isArray(points) &&\n    Array.isArray(clusters)\n  ) {\n    let result = [...clusters];\n\n    points.forEach((point) => {\n      let distances = [];\n      centroids.forEach((vector) => {\n        const distance = Math.sqrt(\n          Math.pow(point[0] - vector[0], 2) + Math.pow(point[1] - vector[1], 2)\n        );\n        distances.push(distance);\n      });\n      let minimum = -1;\n      let minIndex = -1;\n      distances.forEach((distance, index) => {\n        if (minimum == -1 || distance < minimum) {\n          minimum = distance;\n          minIndex = index;\n        }\n      });\n      if (minIndex >= 0 && minIndex < clusters.length) {\n        result[minIndex].push(point);\n      }\n    });\n    return {\n      clusters: result,\n      centroids: centroids\n    }\n  }\n  return  {\n    clusters: [],\n    centroids: []\n  };\n};\n"
            },
            nodeCannotBeReplaced: true,
            showFormOnlyInPopup: true,
            useInCompositionOnly: false,
            isRunOnStart: true,
            isSettingsPopup: true
          }
        },
        {
          id: "5a697c29-8f0b-4b8f-b251-29d389d4b606",
          x: 6314.426498783223,
          y: 1603.2007610146404,
          width: 467.59282779498153,
          height: 131.57610086277032,
          nodeType: "Shape",
          nodeInfo: {
            type: "expression",
            formValues: {
              expression: "distances_to_each_centroid(centroids,data,clusters)",
              inputType: "number"
            },
            showFormOnlyInPopup: true,
            isSettingsPopup: true
          }
        },
        {
          id: "d074bb8f-1693-45b6-80ab-e5ed4557c4fa",
          x: 6997.1068187887195,
          y: 1641.399733371719,
          width: 120.00039959336962,
          height: 55.99992275599284,
          nodeType: "Shape",
          nodeInfo: {
            type: "show-input",
            formValues: {
              name: "output",
              ["data-type"]: "default"
            },
            initializeOnStartFlow: true,
            isSettingsPopup: true
          }
        },
        {
          id: "0e543618-6d2d-4cef-84f8-62431f40847d",
          x: 6470.189415300728,
          y: 2931.1294491842896,
          width: 394.2265625,
          height: 136,
          nodeType: "Shape",
          nodeInfo: {
            type: "register-expression-function-node",
            formValues: {
              functionName: "calculate_centroids",
              customFunctionCode: "(clusters, centroids, iterationCount) => {\n  let newcentroids = [];\n  clusters.forEach((cluster) => {\n    let sumX = 0;\n    let sumY = 0;\n    cluster.forEach((point) => {\n      sumX += point[0];\n      sumY += point[1];\n    });\n    newcentroids.push([sumX / cluster.length, sumY / cluster.length]);\n  });\n  let centroidsfound = [];\n  newcentroids.forEach((newcentroid) => {\n    centroids.forEach((oldcentroid, index) => {\n      const indexWasMatchedForOtherCentrod =\n        centroidsfound.findIndex((centroidIndex) => index === centroidIndex) >=\n        0;\n      if (\n        !indexWasMatchedForOtherCentrod &&\n        oldcentroid[0] === newcentroid[0] &&\n        oldcentroid[1].toFixed(5) === newcentroid[1].toFixed(5)\n      ) {\n        centroidsfound.push(index);\n      }\n    });\n  });\n  \n  const converged = (centroidsfound.length === newcentroids.length) || (iterationCount >= 15);\n  console.log('converged', centroidsfound, converged, newcentroids, centroids);\n  return {\n    newcentroids: newcentroids,\n    converged: converged,\n    nextIteration: iterationCount + 1 \n  };\n};"
            },
            nodeCannotBeReplaced: true,
            showFormOnlyInPopup: true,
            useInCompositionOnly: false,
            isRunOnStart: true,
            isSettingsPopup: true
          }
        },
        {
          id: "0934003b-1022-4bd0-aba9-db1425d64ced",
          x: 7002.481385436919,
          y: 2136.3062796165837,
          width: 462.29624577114646,
          height: 111.14524633572455,
          nodeType: "Shape",
          nodeInfo: {
            type: "expression",
            formValues: {
              expression: "calculate_centroids(clusters,centroids,iterationCount)",
              inputType: "number"
            },
            showFormOnlyInPopup: true,
            isSettingsPopup: true
          }
        },
        {
          id: "21d97ca7-019a-47d5-9c8a-c9da448487ee",
          x: 7715.462781449716,
          y: 2210.149928905682,
          width: 119.99976666317846,
          height: 56.00008098854063,
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
          id: "1b20430f-e529-4493-a163-aa9e999560c7",
          x: 2202.301773797244,
          y: 1585.4703729045239,
          width: 50,
          height: 50,
          nodeType: "Shape",
          nodeInfo: {
            type: "start-node",
            formValues: {
              name: "",
              group: ""
            }
          }
        },
        {
          id: "50eef179-242e-40cb-9d36-68a85ccccfc5",
          x: 8227.26873270523,
          y: 2230.4184457324804,
          width: 150,
          height: 150,
          nodeType: "Shape",
          nodeInfo: {
            type: "if-condition",
            formValues: {
              Mode: "expression",
              expression: "converged == true",
              inputType: "boolean"
            }
          }
        },
        {
          id: "308d7104-2a78-448b-8b13-9fb1496f17ac",
          x: 8591.960083322982,
          y: 2356.8842461188474,
          width: 200,
          height: 112,
          nodeType: "Shape",
          nodeInfo: {
            type: "expression",
            formValues: {
              expression: "newcentroids",
              inputType: "number"
            },
            showFormOnlyInPopup: true,
            isSettingsPopup: true
          }
        },
        {
          id: "60e86642-ddd3-42a1-8dfa-79374effa93d",
          x: 9038.650722580649,
          y: 2372.1023257293264,
          width: 200,
          height: 64,
          nodeType: "Shape",
          nodeInfo: {
            type: "set-array-variable",
            formValues: {
              variableName: "centroids"
            },
            nodeCannotBeReplaced: false,
            showFormOnlyInPopup: true,
            useInCompositionOnly: false
          }
        },
        {
          id: "044da6a1-974d-42fe-85dd-5058d7ef43d9",
          x: 5377.135579848421,
          y: 1838.3030479835184,
          width: 200,
          height: 112,
          nodeType: "Shape",
          nodeInfo: {
            type: "expression",
            formValues: {
              expression: "centroids",
              inputType: "number"
            },
            showFormOnlyInPopup: true,
            isSettingsPopup: true
          }
        },
        {
          id: "857c7840-b47b-415e-a3e8-9a9d03ababe3",
          x: 5602.437274145248,
          y: 1703.9978529280963,
          width: 50,
          height: 50,
          nodeType: "Shape",
          nodeInfo: {
            type: "summing-junction"
          }
        },
        {
          id: "5f45e8e4-4b24-4dd9-83c1-d5653e824e6b",
          x: 3162.1770029416493,
          y: 1987.1999045927596,
          width: 622.8532678601155,
          height: 260.2117197359662,
          nodeType: "Shape",
          nodeInfo: {
            type: "annotation",
            formValues: {
              annotation: "Initialisation : create 100 random points and initialize centroids with random points (use variable k for number of clusters)",
              fontSize: "37.6",
              fontWeight: "false"
            },
            isSettingsPopup: true,
            nodeCannotBeReplaced: true,
            isAnnotation: true
          }
        },
        {
          id: "a3a7e41f-f95a-485f-85cf-de31e0a20f39",
          x: 5703.010130615032,
          y: 2024.5313950487891,
          width: 979.4172478500905,
          height: 389.7487833543769,
          nodeType: "Shape",
          nodeInfo: {
            type: "annotation",
            formValues: {
              annotation: "k-means algorithm : \n- Fill clusters by assign each point to the \"closest\" centroid \n- Calculate new centroids (use centre of clusters)\n- Check if new centroids equal the previous centroids\n- If yes: then stop",
              fontSize: "37.6",
              fontWeight: "false"
            },
            isSettingsPopup: true,
            nodeCannotBeReplaced: true,
            isAnnotation: true
          }
        },
        {
          id: "b460f627-e6c1-4236-832f-789da2a7ab9a",
          x: 5140.735637975367,
          y: 2935.5571740014793,
          width: 497.3528357296998,
          height: 216.81059916859294,
          nodeType: "Shape",
          nodeInfo: {
            type: "annotation",
            formValues: {
              annotation: "Escape hatches for assigning points to closest centroids , calculating new centroids and checking if old centroids equal the new centroids",
              fontSize: "24.1",
              fontWeight: "false"
            },
            isSettingsPopup: true,
            nodeCannotBeReplaced: true,
            isAnnotation: true
          }
        },
        {
          id: "be2b1562-842a-4373-ac70-a601789c1725",
          x: 4297.9383006443095,
          y: 1098.0292244361813,
          width: 119.99976666317846,
          height: 83.99996325026315,
          nodeType: "Shape",
          nodeInfo: {
            type: "variable",
            formValues: {
              variableName: "iterationCount",
              initialValue: "0",
              fieldType: "value",
              fieldValueType: "number"
            },
            isVariable: true,
            nodeCannotBeReplaced: true
          }
        },
        {
          id: "f5d98b6a-f894-496d-9597-6ae58c263fe7",
          x: 7675.026955717727,
          y: 2034.096635207233,
          width: 200,
          height: 112.0001220703125,
          nodeType: "Shape",
          nodeInfo: {
            type: "expression",
            formValues: {
              expression: "nextIteration",
              inputType: "number"
            },
            showFormOnlyInPopup: true,
            isSettingsPopup: true
          }
        },
        {
          id: "a7fc22c0-1e33-43c0-aa41-dae551926d70",
          x: 8006.663792802744,
          y: 2026.4248504552354,
          width: 200.00048828125,
          height: 128,
          nodeType: "Shape",
          nodeInfo: {
            type: "set-variable",
            formValues: {
              variableName: "iterationCount"
            },
            nodeCannotBeReplaced: false,
            showFormOnlyInPopup: false,
            useInCompositionOnly: false
          }
        },
        {
          id: "11d8c68e-1bc1-4665-aa22-c205b602d367",
          x: 2531.2746399032585,
          y: 1557.5320104130874,
          width: 200,
          height: 128,
          nodeType: "Shape",
          nodeInfo: {
            type: "reset-variable",
            formValues: {
              variableName: "iterationCount"
            },
            nodeCannotBeReplaced: false,
            showFormOnlyInPopup: false,
            useInCompositionOnly: false
          }
        },
        {
          id: "ec2f9ba6-9436-415e-8bf8-3b0f5a698b84",
          x: 5852.737727602735,
          y: 986.0827282757905,
          width: 400,
          height: 400,
          nodeType: "Shape",
          nodeInfo: {
            type: "iframe-html-node",
            formValues: {
              html: "<!DOCTYPE html>\n<html lang=\"en\">\n  <head>\n    <meta charset=\"UTF-8\" />\n    <meta name=\"viewport\" content=\"width=device-width, initial-scale=1.0\" />\n    <title>Plot visualization</title>\n    <script src=\"https://cdn.tailwindcss.com\"></script>\n    <style>\n      .wrapper {\n        display: flex;\n        flex-direction: row;\n        gap: 4px;\n        height: 100vh;\n        align-items: center;\n        justify-content: center;\n        padding: 4px;\n      }\n    </style>\n  </head>\n  <body class=\"bg-white\">\n    <div class=\"min-h-screen flex wrapper\" id=\"inner\">\n      <svg\n        id=\"svg\"\n        class=\"object-cover h-full w-full\"\n        viewbox=\"0 0 1200 1200\"\n      ></svg>\n    </div>\n\n    <script>\n      // Define the colors for the clusters .. borrowed the d3-palette colors observable10\n      let colors = [\n        '#4269d0',\n        '#efb118',\n        '#ff725c',\n        '#6cc5b0',\n        '#3ca951',\n        '#ff8ab7',\n        '#a463f2',\n        '#97bbf5',\n        '#9c6b4e',\n        '#9498a0',\n      ];\n      function getColor(index) {\n        return colors[index % colors.length];\n      }\n\n      function getDarkenColor(index) {\n        // darken color with pure javascript\n        let color = colors[index % colors.length];\n        let r = parseInt(color.slice(1, 3), 16);\n        let g = parseInt(color.slice(3, 5), 16);\n        let b = parseInt(color.slice(5, 7), 16);\n\n        const newColor = [r, g, b].map((c) => parseInt((c * 0.75).toFixed(0)));\n\n        return `#${newColor[0].toString(16)}${newColor[1].toString(\n          16\n        )}${newColor[2].toString(16)}`;\n      }\n      // Initialize the global variable \"input\"\n      window.input = window.input;\n      let inputstream = [];\n      let initialized = false;\n      let elements = [];\n\n      let svg = document.getElementById('svg');\n      // Function to rerender the UI\n      function rerenderUI() {\n        if (!initialized && window['createElement']) {\n          initialized = true;\n        }\n        let documentFragment = document.createDocumentFragment();\n        let circles = [];\n        if (window.input !== undefined) {\n          if (Array.isArray(window.input)) {\n            if (true) {\n              window.input.forEach((element, index) => {\n                if (Array.isArray(element)) {\n                  \n                  let circle = document.createElementNS(\n                    'http://www.w3.org/2000/svg',\n                    'circle'\n                  );\n                  circle.setAttribute('cx', element[0] * 10 + 100);\n                  circle.setAttribute('cy', element[1] * 10 + 100);\n                  circle.setAttribute('r', 50);\n                  circle.setAttribute('fill', getColor(index));\n                  documentFragment.appendChild(circle);\n                }\n              });\n              \n            }\n          }\n        }\n        svg.innerHTML = '';\n        svg.appendChild(documentFragment);\n      }\n\n      // Attach the rerenderUI function to the global onExecute method\n      window.onExecute = rerenderUI;\n\n      rerenderUI();\n    </script>\n  </body>\n</html>\n",
              aiprompt: ""
            },
            showFormOnlyInPopup: true,
            initializeOnStartFlow: true
          }
        },
        {
          id: "e370f15f-1236-4ce3-80b1-c03082dc303e",
          x: 4962.494498114469,
          y: 1128.4118593516014,
          width: 200,
          height: 116,
          nodeType: "Shape",
          nodeInfo: {
            type: "observe-variable",
            formValues: {
              variableName: "centroids"
            }
          }
        },
        {
          id: "f59f81b7-c03d-454a-b64e-aad6620ff46e",
          x: 5851.178266237294,
          y: 142.53035849180498,
          width: 400,
          height: 400,
          nodeType: "Shape",
          nodeInfo: {
            type: "iframe-html-node",
            formValues: {
              html: "<!DOCTYPE html>\n<html lang=\"en\">\n  <head>\n    <meta charset=\"UTF-8\" />\n    <meta name=\"viewport\" content=\"width=device-width, initial-scale=1.0\" />\n    <title>Plot visualization</title>\n    <script src=\"https://cdn.tailwindcss.com\"></script>\n    <style>\n      .wrapper {\n        display: flex;\n        flex-direction: row;\n        gap: 4px;\n        height: 100vh;\n        align-items: center;\n        justify-content: center;\n        padding: 4px;\n      }\n    </style>\n  </head>\n  <body class=\"bg-white\">\n    <div class=\"min-h-screen flex wrapper\" id=\"inner\">\n      <svg\n        id=\"svg\"\n        class=\"object-cover h-full w-full\"\n        viewbox=\"0 0 1200 1200\"\n      ></svg>\n    </div>\n\n    <script>\n      // Initialize the global variable \"input\"\n      window.input = window.input;\n      let inputstream = [];\n      let initialized = false;\n      let elements = [];\n\n      let svg = document.getElementById('svg');\n      // Function to rerender the UI\n      function rerenderUI() {\n        if (!initialized && window['createElement']) {\n          initialized = true;\n        }\n        let documentFragment = document.createDocumentFragment();\n        let circles = [];\n        if (window.input !== undefined) {\n          if (Array.isArray(window.input)) {\n            \n              window.input.forEach((element, index) => {\n                if (Array.isArray(element)) {\n                  \n                  let circle = document.createElementNS(\n                    'http://www.w3.org/2000/svg',\n                    'circle'\n                  );\n                  circle.setAttribute('cx', element[0] * 10 + 100);\n                  circle.setAttribute('cy', element[1] * 10 + 100);\n                  circle.setAttribute('r', 25);\n                  circle.setAttribute('fill', \"#000000\");\n                  documentFragment.appendChild(circle);\n                }\n              });\n          }\n        }\n        svg.innerHTML = '';\n        svg.appendChild(documentFragment);\n      }\n\n      // Attach the rerenderUI function to the global onExecute method\n      window.onExecute = rerenderUI;\n\n      rerenderUI();\n    </script>\n  </body>\n</html>\n",
              aiprompt: ""
            },
            showFormOnlyInPopup: true,
            initializeOnStartFlow: true
          }
        },
        {
          id: "472fd563-dd51-4ce1-8b2b-756acb532d7d",
          x: 5218.9094677879775,
          y: 332.1667749113369,
          width: 200,
          height: 116,
          nodeType: "Shape",
          nodeInfo: {
            type: "observe-variable",
            formValues: {
              variableName: "data"
            }
          }
        },
        {
          id: "e4771889-b12b-4895-8617-b1559c8a8fdc",
          x: 5439.479222424322,
          y: 1133.631436482648,
          width: 119.99976666317846,
          height: 55.99992275599284,
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
          id: "47a51f3b-751e-4ad9-9e3b-6b993d4a3a7f",
          x: 3128.9264141208932,
          y: 1600.9889592387547,
          endX: 3263.074212637936,
          endY: 1651.031313917981,
          startNodeId: "248c7829-295b-44fd-b581-18cafc953842",
          endNodeId: "ae56dc77-4c0e-479c-9caf-390762aac180",
          startThumbName: "output",
          endThumbName: "min",
          lineType: "BezierCubic",
          nodeType: "Connection",
          layer: 1,
          nodeInfo: {}
        },
        {
          id: "87bb9375-9cbc-4baf-b337-ceb4f92b875e",
          x: 3124.212382306903,
          y: 1773.5867652234415,
          endX: 3263.074212637936,
          endY: 1701.031313917981,
          startNodeId: "bfc7c418-33fa-44a9-bd5a-5acef9038735",
          endNodeId: "ae56dc77-4c0e-479c-9caf-390762aac180",
          startThumbName: "output",
          endThumbName: "max",
          lineType: "BezierCubic",
          nodeType: "Connection",
          layer: 1,
          nodeInfo: {}
        },
        {
          id: "389e6b59-cc14-419c-9533-1585745efe0b",
          x: 3413.074212637936,
          y: 1698.531313917981,
          endX: 3502.101617072024,
          endY: 1685.6227343932114,
          startNodeId: "ae56dc77-4c0e-479c-9caf-390762aac180",
          endNodeId: "be12c859-b2c1-4be9-9359-ced5985aebcc",
          startThumbName: "output",
          endThumbName: "input",
          lineType: "BezierCubic",
          nodeType: "Connection",
          layer: 1,
          nodeInfo: {}
        },
        {
          id: "0c99804e-4f80-4e02-a852-eb62de744925",
          x: 3612.101617072024,
          y: 1710.6227343932114,
          endX: 3705.1795902474455,
          endY: 1778.3927511867776,
          startNodeId: "be12c859-b2c1-4be9-9359-ced5985aebcc",
          endNodeId: "7b8c7fbf-81d0-4ea7-adb3-1ce04f0ce5c5",
          startThumbName: "output2",
          endThumbName: "input",
          lineType: "BezierCubic",
          nodeType: "Connection",
          layer: 1,
          nodeInfo: {}
        },
        {
          id: "cc562af5-1e54-43c7-b561-cd786cc22061",
          x: 3612.101617072024,
          y: 1660.6227343932114,
          endX: 3808.52078598491,
          endY: 1632.4215404853467,
          startNodeId: "be12c859-b2c1-4be9-9359-ced5985aebcc",
          endNodeId: "2b646b69-3b5d-41b0-b1bf-65cff9b6898b",
          startThumbName: "output1",
          endThumbName: "array",
          lineType: "BezierCubic",
          nodeType: "Connection",
          layer: 1,
          nodeInfo: {}
        },
        {
          id: "8595bdb7-1c77-4e61-98d4-832947564bcf",
          x: 4320.909137276225,
          y: 2059.23199909915,
          endX: 4548.207982977223,
          endY: 1821.4621262284763,
          startNodeId: "d6a6b905-9c2d-4bbe-b489-acbae0355ede",
          endNodeId: "ac063440-0517-4880-8ffc-79610e86fc7a",
          startThumbName: "output",
          endThumbName: "max",
          lineType: "BezierCubic",
          nodeType: "Connection",
          layer: 1,
          nodeInfo: {}
        },
        {
          id: "898b3158-53e7-4462-aa9d-4c612f922b43",
          x: 4698.207982977223,
          y: 1818.9621262284763,
          endX: 4839.885203842909,
          endY: 1825.5647124219797,
          startNodeId: "ac063440-0517-4880-8ffc-79610e86fc7a",
          endNodeId: "d1f557d9-2ce4-47f4-9982-6739dfce3b7b",
          startThumbName: "output",
          endThumbName: "input",
          lineType: "BezierCubic",
          nodeType: "Connection",
          layer: 1,
          nodeInfo: {}
        },
        {
          id: "3dfdf87f-4fc7-4031-9e08-521f49b94e15",
          x: 4949.885203842909,
          y: 1850.5647124219797,
          endX: 5039.513606938384,
          endY: 1929.962850327635,
          startNodeId: "d1f557d9-2ce4-47f4-9982-6739dfce3b7b",
          endNodeId: "28fe4ef5-5577-4943-a722-a2c1c618b7e2",
          startThumbName: "output2",
          endThumbName: "input",
          lineType: "BezierCubic",
          nodeType: "Connection",
          layer: 1,
          nodeInfo: {}
        },
        {
          id: "75005860-4bc9-4c0f-8610-abd10d784eed",
          x: 4949.885203842909,
          y: 1800.5647124219797,
          endX: 5012.936333470498,
          endY: 1740.9236203121095,
          startNodeId: "d1f557d9-2ce4-47f4-9982-6739dfce3b7b",
          endNodeId: "ea7bdf4e-6c33-48f4-b633-bff38ffb2a3c",
          startThumbName: "output1",
          endThumbName: "array",
          lineType: "BezierCubic",
          nodeType: "Connection",
          layer: 1,
          nodeInfo: {}
        },
        {
          id: "43985ccd-ac5d-48d1-93c1-75defbda64c3",
          x: 4437.832875462038,
          y: 1783.7376854356596,
          endX: 4548.207982977223,
          endY: 1771.4621262284763,
          startNodeId: "a301c7c2-c840-449c-8fcf-094168b0a42a",
          endNodeId: "ac063440-0517-4880-8ffc-79610e86fc7a",
          startThumbName: "output",
          endThumbName: "min",
          lineType: "BezierCubic",
          nodeType: "Connection",
          layer: 1,
          nodeInfo: {}
        },
        {
          id: "eab6e4a7-1e12-4bbb-b7ef-809b3ef43ca5",
          x: 5831.680464640531,
          y: 1739.6576691336236,
          endX: 5924.359698349896,
          endY: 1821.7883444118866,
          startNodeId: "8a5cfde7-22fd-4f25-8af4-4540f69e3c8f",
          endNodeId: "1d1b2896-c11d-4ddd-a4b8-1d3b77e493ba",
          startThumbName: "output2",
          endThumbName: "input",
          lineType: "BezierCubic",
          nodeType: "Connection",
          layer: 1,
          nodeInfo: {}
        },
        {
          id: "e03baa33-862d-4ea1-9712-ab81e08a550e",
          x: 5831.680464640531,
          y: 1689.6576691336236,
          endX: 5925.051508209566,
          endY: 1660.4898975210604,
          startNodeId: "8a5cfde7-22fd-4f25-8af4-4540f69e3c8f",
          endNodeId: "ab054f77-2e88-49ec-afe6-848468c0be3c",
          startThumbName: "output1",
          endThumbName: "array",
          lineType: "BezierCubic",
          nodeType: "Connection",
          layer: 1,
          nodeInfo: {}
        },
        {
          id: "7b116fa8-c0f4-47d6-9d28-5151802abba9",
          x: 4008.52078598491,
          y: 1634.4215404853467,
          endX: 4237.832875462038,
          endY: 1783.7376854356596,
          startNodeId: "2b646b69-3b5d-41b0-b1bf-65cff9b6898b",
          endNodeId: "a301c7c2-c840-449c-8fcf-094168b0a42a",
          startThumbName: "output",
          endThumbName: "input",
          lineType: "BezierCubic",
          nodeType: "Connection",
          layer: 1,
          nodeInfo: {}
        },
        {
          id: "6a09a070-9bd1-4bd5-bbd0-844769d30f62",
          x: 6125.051508209566,
          y: 1662.4898975210604,
          endX: 6314.426498783223,
          endY: 1668.9888114460255,
          startNodeId: "ab054f77-2e88-49ec-afe6-848468c0be3c",
          endNodeId: "5a697c29-8f0b-4b8f-b251-29d389d4b606",
          startThumbName: "output",
          endThumbName: "input",
          lineType: "BezierCubic",
          nodeType: "Connection",
          layer: 1,
          nodeInfo: {}
        },
        {
          id: "74dfb159-7b16-4027-b2d0-c3fb755b008a",
          x: 6782.0193265782045,
          y: 1668.9888114460255,
          endX: 6997.1068187887195,
          endY: 1671.399733371719,
          startNodeId: "5a697c29-8f0b-4b8f-b251-29d389d4b606",
          endNodeId: "d074bb8f-1693-45b6-80ab-e5ed4557c4fa",
          startThumbName: "output",
          endThumbName: "input",
          lineType: "BezierCubic",
          nodeType: "Connection",
          layer: 1,
          nodeInfo: {}
        },
        {
          id: "e05858fb-5e14-444e-8685-b44cdd5129f9",
          x: 7117.107218382089,
          y: 1671.399733371719,
          endX: 7529.235659441017,
          endY: 1070.1477956270344,
          startNodeId: "d074bb8f-1693-45b6-80ab-e5ed4557c4fa",
          endNodeId: "d68aeeb6-d2b2-4503-a704-7d21334b9c7f",
          startThumbName: "output",
          endThumbName: "input",
          lineType: "BezierCubic",
          nodeType: "Connection",
          layer: 1,
          nodeInfo: {}
        },
        {
          id: "40767bbd-3b06-4afb-a791-31254aac14cc",
          x: 6782.0193265782045,
          y: 1668.9888114460255,
          endX: 7002.481385436919,
          endY: 2191.878902784446,
          startNodeId: "5a697c29-8f0b-4b8f-b251-29d389d4b606",
          endNodeId: "0934003b-1022-4bd0-aba9-db1425d64ced",
          startThumbName: "output",
          endThumbName: "input",
          lineType: "BezierCubic",
          nodeType: "Connection",
          layer: 1,
          nodeInfo: {}
        },
        {
          id: "71d16b29-ff93-4ef8-a81d-fc4ef10dc69b",
          x: 7464.777631208065,
          y: 2191.878902784446,
          endX: 7715.462781449716,
          endY: 2240.149928905682,
          startNodeId: "0934003b-1022-4bd0-aba9-db1425d64ced",
          endNodeId: "21d97ca7-019a-47d5-9c8a-c9da448487ee",
          startThumbName: "output",
          endThumbName: "input",
          lineType: "BezierCubic",
          nodeType: "Connection",
          layer: 1,
          nodeInfo: {}
        },
        {
          id: "101abac1-2a71-4b84-86bc-05be40561539",
          x: 2227.301773797244,
          y: 1610.4703729045239,
          endX: 2531.2746399032585,
          endY: 1621.5320104130874,
          startNodeId: "1b20430f-e529-4493-a163-aa9e999560c7",
          endNodeId: "11d8c68e-1bc1-4665-aa22-c205b602d367",
          startThumbName: "output",
          endThumbName: "input",
          lineType: "Straight",
          nodeType: "Connection",
          layer: 1,
          nodeInfo: {}
        },
        {
          id: "5b57afe5-bdcd-4fbf-bb3a-3ebae7a3bc92",
          x: 7835.462548112895,
          y: 2240.149928905682,
          endX: 8227.26873270523,
          endY: 2305.4184457324804,
          startNodeId: "21d97ca7-019a-47d5-9c8a-c9da448487ee",
          endNodeId: "50eef179-242e-40cb-9d36-68a85ccccfc5",
          startThumbName: "output",
          endThumbName: "input",
          lineType: "BezierCubic",
          nodeType: "Connection",
          layer: 1,
          nodeInfo: {}
        },
        {
          id: "2fab76ba-2731-4cef-8924-ecd1188ca1fb",
          x: 8302.26873270523,
          y: 2380.4184457324804,
          endX: 8591.960083322982,
          endY: 2412.8842461188474,
          startNodeId: "50eef179-242e-40cb-9d36-68a85ccccfc5",
          endNodeId: "308d7104-2a78-448b-8b13-9fb1496f17ac",
          startThumbName: "failure",
          endThumbName: "input",
          lineType: "BezierCubic",
          nodeType: "Connection",
          layer: 1,
          nodeInfo: {}
        },
        {
          id: "705c7eb3-fe63-4a5d-9432-330b3be57cb6",
          x: 8791.960083322982,
          y: 2412.8842461188474,
          endX: 9038.650722580649,
          endY: 2402.1023257293264,
          startNodeId: "308d7104-2a78-448b-8b13-9fb1496f17ac",
          endNodeId: "60e86642-ddd3-42a1-8dfa-79374effa93d",
          startThumbName: "output",
          endThumbName: "array",
          lineType: "BezierCubic",
          nodeType: "Connection",
          layer: 1,
          nodeInfo: {}
        },
        {
          id: "db375f3c-d3fe-43b2-a580-3f860fadad22",
          x: 9238.650722580649,
          y: 2404.1023257293264,
          endX: 5377.135579848421,
          endY: 1894.3030479835184,
          startNodeId: "60e86642-ddd3-42a1-8dfa-79374effa93d",
          endNodeId: "044da6a1-974d-42fe-85dd-5058d7ef43d9",
          startThumbName: "output",
          endThumbName: "input",
          lineType: "BezierCubic",
          nodeType: "Connection",
          layer: 1,
          nodeInfo: {}
        },
        {
          id: "9f3d40cc-43bb-40db-b1a2-0e1a257a5388",
          x: 5577.135579848421,
          y: 1894.3030479835184,
          endX: 5627.437274145248,
          endY: 1763.9978529280963,
          startNodeId: "044da6a1-974d-42fe-85dd-5058d7ef43d9",
          endNodeId: "857c7840-b47b-415e-a3e8-9a9d03ababe3",
          startThumbName: "output",
          endThumbName: "input",
          lineType: "BezierCubic",
          nodeType: "Connection",
          layer: 1,
          nodeInfo: {}
        },
        {
          id: "08ab0691-205f-46e6-8b0c-7e01da76b7b5",
          x: 5212.936333470498,
          y: 1742.9236203121095,
          endX: 5592.457010085521,
          endY: 1730.1730662328819,
          startNodeId: "ea7bdf4e-6c33-48f4-b633-bff38ffb2a3c",
          endNodeId: "857c7840-b47b-415e-a3e8-9a9d03ababe3",
          startThumbName: "output",
          endThumbName: "input",
          lineType: "BezierCubic",
          nodeType: "Connection",
          layer: 1,
          nodeInfo: {}
        },
        {
          id: "ec9295bf-c9fa-4e61-a761-d9e802fe8147",
          x: 5627.437274145248,
          y: 1728.9978529280963,
          endX: 5721.680464640531,
          endY: 1714.6576691336236,
          startNodeId: "857c7840-b47b-415e-a3e8-9a9d03ababe3",
          endNodeId: "8a5cfde7-22fd-4f25-8af4-4540f69e3c8f",
          startThumbName: "output",
          endThumbName: "input",
          lineType: "Straight",
          nodeType: "Connection",
          layer: 1,
          nodeInfo: {}
        },
        {
          id: "17606be6-5c55-4abe-94fb-220c188968be",
          x: 7464.777631208065,
          y: 2191.878902784446,
          endX: 7675.026955717727,
          endY: 2090.096696242389,
          startNodeId: "0934003b-1022-4bd0-aba9-db1425d64ced",
          endNodeId: "f5d98b6a-f894-496d-9597-6ae58c263fe7",
          startThumbName: "output",
          endThumbName: "input",
          lineType: "BezierCubic",
          nodeType: "Connection",
          layer: 1,
          nodeInfo: {}
        },
        {
          id: "08e6a922-39f9-46a6-a19d-6e49c94b809c",
          x: 7875.026955717727,
          y: 2090.096696242389,
          endX: 8006.663792802744,
          endY: 2090.424850455235,
          startNodeId: "f5d98b6a-f894-496d-9597-6ae58c263fe7",
          endNodeId: "a7fc22c0-1e33-43c0-aa41-dae551926d70",
          startThumbName: "output",
          endThumbName: "input",
          lineType: "BezierCubic",
          nodeType: "Connection",
          layer: 1,
          nodeInfo: {}
        },
        {
          id: "de81b3b0-5547-4c03-be79-85a269702cd5",
          x: 2731.2746399032585,
          y: 1621.5320104130874,
          endX: 2928.9264141208932,
          endY: 1600.9889592387547,
          startNodeId: "11d8c68e-1bc1-4665-aa22-c205b602d367",
          endNodeId: "248c7829-295b-44fd-b581-18cafc953842",
          startThumbName: "output",
          endThumbName: "input",
          lineType: "BezierCubic",
          nodeType: "Connection",
          layer: 1,
          nodeInfo: {}
        },
        {
          id: "e877d2e7-6102-443b-a2a9-12003cd3b6a6",
          x: 5162.494498114469,
          y: 1186.4118593516014,
          endX: 5439.479222424322,
          endY: 1163.631436482648,
          startNodeId: "e370f15f-1236-4ce3-80b1-c03082dc303e",
          endNodeId: "e4771889-b12b-4895-8617-b1559c8a8fdc",
          startThumbName: "output",
          endThumbName: "input",
          lineType: "BezierCubic",
          nodeType: "Connection",
          layer: 1,
          nodeInfo: {}
        },
        {
          id: "ab9de524-e39d-460d-bc9b-ce78f2346bf7",
          x: 5418.9094677879775,
          y: 390.1667749113369,
          endX: 5851.178266237294,
          endY: 342.530358491805,
          startNodeId: "472fd563-dd51-4ce1-8b2b-756acb532d7d",
          endNodeId: "f59f81b7-c03d-454a-b64e-aad6620ff46e",
          startThumbName: "output",
          endThumbName: "input",
          lineType: "BezierCubic",
          nodeType: "Connection",
          layer: 1,
          nodeInfo: {}
        },
        {
          id: "d203878c-8c7e-4e18-96e2-efee31ca152a",
          x: 5559.478989087501,
          y: 1163.631436482648,
          endX: 5852.737727602735,
          endY: 1186.0827282757905,
          startNodeId: "e4771889-b12b-4895-8617-b1559c8a8fdc",
          endNodeId: "ec2f9ba6-9436-415e-8bf8-3b0f5a698b84",
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