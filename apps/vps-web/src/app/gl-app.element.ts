import './app.element.css';
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import styles from '../styles.css?inline';
//import iconStyles from '../../public/icon-styles.css?inline';
import {
  createElement,
  IElementNode,
  INodeComponent,
  createEffect,
  getSelectedNode,
  setSelectNode,
  setupMarkupElement,
  CanvasAppInstance,
  IRectNodeComponent,
  Flow,
  updateNamedSignal,
  NodeType,
  SelectedNodeInfo,
  FlowNode,
} from '@devhelpr/visual-programming-system';

import { registerCustomFunction } from '@devhelpr/expression-compiler';

import { FormComponent } from './components/form-component';

import {
  createIndexedDBStorageProvider,
  FlowrunnerIndexedDbStorageProvider,
} from './storage/indexeddb-storage-provider';
import { GLNavbarMenu } from './components/gl-navbar-components';
import {
  menubarClasses,
  navBarButton,
  navBarIconButton,
  navBarIconButtonInnerElement,
} from './consts/classes';
import { serializeElementsMap } from './storage/serialize-canvas';
import { importToCanvas } from './storage/import-to-canvas';
import { AppElement } from './app.element';
import {
  getGLNodeFactoryNames,
  getGLNodeTaskFactory,
  setupGLNodeTaskRegistry,
} from './node-task-registry/gl-node-task-registry';

export class GLAppElement extends AppElement<any> {
  public static observedAttributes = [];

  onclick = (_ev: MouseEvent) => {
    alert('clicked');
  };

  isStoring = false;

  storageProvider: FlowrunnerIndexedDbStorageProvider | undefined = undefined;

  scopeNodeDomElement: HTMLElement | undefined = undefined;

  formElement: INodeComponent<any> | undefined = undefined;
  selectedNodeLabel: IElementNode<any> | undefined = undefined;

  constructor(appRootSelector: string) {
    const template = document.createElement('template');
    template.innerHTML = `<div>
  <div class="h-screen w-1/2 bg-slate-800 overflow-hidden touch-none" id="root" >
  </div>
  <canvas id="glcanvas" class="gl-canvas"></canvas></div>
`;

    super(appRootSelector, template);
    if (!this.rootElement) {
      return;
    }
    if (!this.canvasApp) {
      return;
    }
    this.setupWindowResize();
    this.setupGLCanvas();

    setupGLNodeTaskRegistry();
    createIndexedDBStorageProvider()
      .then((storageProvider) => {
        console.log('storageProvider', storageProvider);
        this.isStoring = true;
        this.storageProvider = storageProvider;

        if (this.storageProvider && this.canvasApp && this.rootElement) {
          GLNavbarMenu({
            clearCanvas: this.clearCanvas,
            initializeNodes: initializeNodes,
            storageProvider: this.storageProvider,
            selectNodeType: selectNodeType.domElement as HTMLSelectElement,
            canvasUpdated: canvasUpdated,
            canvasApp: this.canvasApp,
            removeElement: this.removeElement,
            rootElement: menubarElement.domElement as HTMLElement,
            rootAppElement: this.rootElement as HTMLElement,
            setIsStoring: setIsStoring,
            importToCanvas: (
              nodesList: FlowNode<any>[],
              canvasApp: CanvasAppInstance<any>,
              canvasUpdated: () => void,
              containerNode?: IRectNodeComponent<any>,
              nestedLevel?: number,
              getGLNodeTaskFactory?: (name: string) => any
            ) => {
              this.isStoring = true;
              importToCanvas(
                nodesList,
                canvasApp,
                canvasUpdated,
                containerNode,
                nestedLevel,
                getGLNodeTaskFactory
              );
              this.isStoring = false;
              canvasUpdated();
            },
          }) as unknown as HTMLElement;

          this.selectedNodeLabel = createElement(
            'div',
            {
              id: 'selectedNode',
              class: 'text-white',
            },
            menubarElement.domElement
          );
        }
        this.clearCanvas();
        storageProvider
          .getFlow('gl')
          .then((flow) => {
            if (!this.canvasApp) {
              throw new Error('canvasApp not defined');
            }
            importToCanvas(
              flow.flows.flow.nodes,
              this.canvasApp,
              canvasUpdated,
              undefined,
              0,
              getGLNodeTaskFactory
            );
            this.canvasApp.centerCamera();
            initializeNodes();
            this.flowTOGLCanvas();
            this.isStoring = false;
          })
          .catch((error) => {
            console.log('error', error);
            this.isStoring = false;
          });
      })
      .catch((error) => {
        console.log('error', error);
      });

    const store = () => {
      if (this.storageProvider) {
        const nodesList = serializeFlow();
        if (!nodesList) {
          return;
        }
        console.log('nodesList', nodesList);
        const flow: Flow<any> = {
          schemaType: 'flow',
          schemaVersion: '0.0.1',
          id: 'gl',
          flows: {
            flow: {
              flowType: 'flow',
              nodes: nodesList,
            },
          },
        };
        this.storageProvider.saveFlow('gl', flow);
      }
    };

    const canvasUpdated = () => {
      if (this.isStoring) {
        return;
      }
      this.flowTOGLCanvas();
      store();
    };
    this.canvasApp.setOnCanvasUpdated(() => {
      canvasUpdated();
    });

    const setIsStoring = (isStoring: boolean) => {
      this.isStoring = isStoring;
    };

    this.canvasApp.setOnCanvasClick((x, y) => {
      console.log('OnCanvasClick');
      setSelectNode(undefined);
    });

    const menubarElement = createElement(
      'div',
      {
        class: menubarClasses,
      },
      this.rootElement
    );

    createElement(
      'button',
      {
        class: navBarButton,
        click: (event) => {
          event.preventDefault();
          event.stopPropagation();
          this.clearCanvas();
          store();
          return false;
        },
      },
      menubarElement.domElement,
      'Clear canvas'
    );

    const initializeNodes = () => {
      if (!this.rootElement) {
        return;
      }
      const elements = this.rootElement.querySelectorAll('.state-active');
      elements.forEach((element) => {
        element.classList.remove('state-active');
      });

      this.canvasApp?.elements.forEach((node) => {
        const nodeComponent = node as unknown as INodeComponent<any>;
        if (nodeComponent.nodeType !== NodeType.Connection) {
          if (nodeComponent?.nodeInfo?.initializeCompute) {
            nodeComponent.nodeInfo.initializeCompute();
          }
        }
      });
    };
    createElement(
      'button',
      {
        class: navBarButton,
        click: (event) => {
          event.preventDefault();
          event.stopPropagation();
          initializeNodes();
          return false;
        },
      },
      menubarElement.domElement,
      'Reset state'
    );

    const serializeFlow = () => {
      if (!this.canvasApp) {
        return;
      }
      return serializeElementsMap(this.canvasApp.elements);
    };

    let speedMeter = 100;
    createElement(
      'input',
      {
        type: 'range',
        class: 'p-2 m-2 relative ', //top-[60px]',
        name: 'speed',
        min: '0.1',
        max: '100',
        value: '100',
        change: (event) => {
          speedMeter = parseInt((event.target as HTMLInputElement).value);
          //setSpeedMeter(speedMeter);
          // const timerList = Array.from(timers ?? []);
          // timerList.forEach((timer) => {
          //   timer[1]();
          // });
        },
      },
      menubarElement.domElement,
      ''
    );

    const createOption = (
      selectElement: HTMLSelectElement,
      value: string,
      text: string
    ) => {
      const option = createElement(
        'option',
        {
          value: value,
        },
        selectElement,
        text
      );
      return option;
    };

    const selectNodeType = createElement(
      'select',
      {
        type: 'select',
        class: 'p-2 m-2 relative ', //top-[60px]',
        name: 'select-node-type',
        change: (event) => {
          //
        },
      },
      menubarElement.domElement,
      ''
    );
    const setupTasksInDropdown = () => {
      if (selectNodeType?.domElement) {
        (selectNodeType.domElement as HTMLSelectElement).innerHTML = '';
        const nodeTasks = getGLNodeFactoryNames();
        nodeTasks.forEach((nodeTask) => {
          const factory = getGLNodeTaskFactory(nodeTask);
          if (factory) {
            const node = factory(canvasUpdated);
            if (node.isContained) {
              return;
            }
          }
          createOption(
            selectNodeType.domElement as HTMLSelectElement,
            nodeTask,
            nodeTask
          );
        });
      }
    };
    const setupTasksForContainerTaskInDropdown = (
      allowedNodeTasks: string[]
    ) => {
      if (selectNodeType?.domElement) {
        (selectNodeType.domElement as HTMLSelectElement).innerHTML = '';
        const nodeTasks = getGLNodeFactoryNames();
        nodeTasks.forEach((nodeTask) => {
          const factory = getGLNodeTaskFactory(nodeTask);
          if (factory) {
            const node = factory(canvasUpdated);
            if (allowedNodeTasks.indexOf(node.name) < 0) {
              return;
            }
          }
          createOption(
            selectNodeType.domElement as HTMLSelectElement,
            nodeTask,
            nodeTask
          );
        });
      }
    };
    setupTasksInDropdown();

    let currentSelectedNode: SelectedNodeInfo | undefined = undefined;

    const removeFormElement = () => {
      if (this.formElement) {
        this.canvasApp?.deleteElementFromNode(
          this.editPopupContainer as INodeComponent<any>,
          this.formElement
        );
        this.formElement = undefined;
      }
    };

    createEffect(() => {
      const selectedNodeInfo = getSelectedNode();
      console.log('selected nodeElement...', selectedNodeInfo);
      if (!this.rootElement) {
        return;
      }
      this.rootElement.querySelectorAll('.selected').forEach((element) => {
        element.classList.remove('selected');
      });

      if (
        currentSelectedNode &&
        (!selectedNodeInfo || selectedNodeInfo.id !== currentSelectedNode.id)
      ) {
        const node = (
          currentSelectedNode?.containerNode
            ? (currentSelectedNode?.containerNode?.nodeInfo as any)
                ?.canvasAppInstance?.elements
            : this.canvasApp?.elements
        )?.get(currentSelectedNode.id);
        if (node) {
          if (node.nodeType === NodeType.Connection) {
            node.connectorWrapper?.classList?.remove('selected');
          } else {
            node.domElement.classList.remove('selected');
          }
        }
      }

      removeFormElement();
      if (selectedNodeInfo && this.selectedNodeLabel) {
        this.selectedNodeLabel.domElement.textContent = 'NODE'; //`${selectedNodeInfo.id}`;
        const node = (
          selectedNodeInfo?.containerNode
            ? (selectedNodeInfo?.containerNode?.nodeInfo as any)
                ?.canvasAppInstance?.elements
            : this.canvasApp?.elements
        )?.get(selectedNodeInfo.id);

        if (!node) {
          return;
        }
        if (node.nodeType === NodeType.Connection) {
          console.log('selected connection', node);
          node.connectorWrapper?.domElement?.classList?.add('selected');
        } else {
          node.domElement.classList.add('selected');
        }
        const nodeInfo: any = node?.nodeInfo ?? {};
        if (
          node &&
          (node as INodeComponent<any>).nodeType === NodeType.Connection
        ) {
          (
            this.editPopupContainer?.domElement as unknown as HTMLElement
          ).classList.add('hidden');
          (
            this.editPopupLineContainer?.domElement as unknown as HTMLElement
          ).classList.add('hidden');

          (
            this.editPopupEditingNodeIndicator
              ?.domElement as unknown as HTMLElement
          ).classList.add('hidden');

          (
            this.editPopupEditingNodeIndicator
              ?.domElement as unknown as HTMLElement
          ).classList.remove('editing-node-indicator');

          return;
        }

        console.log('nodeInfo', nodeInfo);

        const factory = getGLNodeTaskFactory(nodeInfo.type);
        if (factory) {
          const nodeTask = factory(() => undefined);
          if ((nodeTask.childNodeTasks || []).length > 0) {
            setupTasksForContainerTaskInDropdown(nodeTask.childNodeTasks ?? []);
          } else {
            setupTasksInDropdown();
          }
        }

        if (((nodeInfo as any)?.formElements ?? []).length === 0) {
          (
            this.editPopupContainer?.domElement as unknown as HTMLElement
          ).classList.add('hidden');
          (
            this.editPopupLineContainer?.domElement as unknown as HTMLElement
          ).classList.add('hidden');
          (
            this.editPopupEditingNodeIndicator
              ?.domElement as unknown as HTMLElement
          ).classList.add('hidden');

          (
            this.editPopupEditingNodeIndicator
              ?.domElement as unknown as HTMLElement
          ).classList.remove('editing-node-indicator');

          return;
        }

        const formElementInstance = createElement(
          'div',
          {},
          this.editPopupContainer?.domElement,
          undefined
        );
        this.formElement = formElementInstance as INodeComponent<any>;

        FormComponent({
          rootElement: this.formElement.domElement as HTMLElement,
          id: selectedNodeInfo.id,
          hasSubmitButton: true,
          onSave: (values: any) => {
            console.log('onSave', values);

            this.rootElement
              ?.querySelectorAll('.selected')
              .forEach((element) => {
                element.classList.remove('selected');
              });

            const node = (
              selectedNodeInfo?.containerNode
                ? (selectedNodeInfo?.containerNode.nodeInfo as any)
                    ?.canvasAppInstance?.elements
                : this.canvasApp?.elements
            )?.get(selectedNodeInfo.id);
            if (node) {
              if ((node.nodeInfo as any).formElements) {
                (node.nodeInfo as any).formValues = values;
                Object.entries(values).forEach(([key, value]) => {
                  console.log(
                    'updateNamedSignal',
                    selectedNodeInfo.id + '_' + key,
                    value
                  );
                  updateNamedSignal(
                    selectedNodeInfo.id + '_' + key,
                    value as unknown as string
                  );
                });
              } else {
                node.nodeInfo = values;
              }
            }

            removeFormElement();
            currentSelectedNode = undefined;

            if (this.selectedNodeLabel) {
              this.selectedNodeLabel.domElement.textContent = '';
            }
            (
              this.editPopupContainer?.domElement as unknown as HTMLElement
            ).classList.add('hidden');
            (
              this.editPopupLineContainer?.domElement as unknown as HTMLElement
            ).classList.add('hidden');

            (
              this.editPopupEditingNodeIndicator
                ?.domElement as unknown as HTMLElement
            ).classList.add('hidden');

            (
              this.editPopupEditingNodeIndicator
                ?.domElement as unknown as HTMLElement
            ).classList.remove('editing-node-indicator');
          },
          formElements: ((node?.nodeInfo as any)?.formElements ?? []).map(
            (item: any) => {
              return {
                ...item,
                value: ((node?.nodeInfo as any)?.formValues ?? {})[
                  item.fieldName
                ],
              };
            }
          ),
        }) as unknown as HTMLElement;
        console.log('before positionPopup1');
        this.positionPopup(node);
      } else {
        if (this.selectedNodeLabel) {
          this.selectedNodeLabel.domElement.textContent = '';
        }
        (
          this.editPopupContainer?.domElement as unknown as HTMLElement
        ).classList.add('hidden');
        (
          this.editPopupLineContainer?.domElement as unknown as HTMLElement
        ).classList.add('hidden');
        (
          this.editPopupEditingNodeIndicator
            ?.domElement as unknown as HTMLElement
        ).classList.add('hidden');

        (
          this.editPopupEditingNodeIndicator
            ?.domElement as unknown as HTMLElement
        ).classList.remove('editing-node-indicator');

        setupTasksInDropdown();
        if (getSelectedNode()) {
          setSelectNode(undefined);
        }
      }

      currentSelectedNode = selectedNodeInfo;
    });

    setupMarkupElement(
      `
      function Test() {
        return <div class="bg-black"><div class="p-4">test{2*3}</div></div>;
      }  
      return Test();  
    `,
      this.rootElement
    );

    registerCustomFunction('log', [], (message: any) => {
      console.log('log', message);
    });
  }

  onShouldPositionPopup = (node: IRectNodeComponent<any>) => {
    const nodeInfo = node?.nodeInfo ?? {};
    if (node && node.nodeType === NodeType.Connection) {
      return false;
    }

    if ((nodeInfo?.formElements ?? []).length === 0) {
      return false;
    }
    if (!this.formElement) {
      return false;
    }
    return true;
  };

  onPreRemoveElement = (element: IElementNode<any>) => {
    if (element.nodeInfo?.delete) {
      element.nodeInfo.delete();
    }
  };

  onPreclearCanvas = () => {
    //
  };

  updateGLCanvasParameters = () => {
    if (
      this.fragmentShader &&
      this.vertexShader &&
      this.shaderProgram &&
      this.gl
    ) {
      this.pauseRender = true;
      console.log('SHADER RECREATION');

      this.gl.clearColor(0.0, 0.0, 0.0, 1.0);
      this.gl.detachShader(this.shaderProgram, this.fragmentShader);
      this.gl.detachShader(this.shaderProgram, this.vertexShader);
      this.gl.deleteProgram(this.shaderProgram);
      this.u_timeUniformLocation = null;
      this.u_CanvasWidthUniformLocation = null;
      this.u_CanvasHeightUniformLocation = null;
      this.u_TestUniformLocation = null;
      this.setupShader(this.gl);
      this.gl.clearColor(0.0, 0.0, 0.0, 1.0);
      this.pauseRender = false;
    }
  };

  test = 1;
  glcanvas: HTMLCanvasElement | undefined = undefined;
  canvasSize: DOMRect | undefined = undefined;
  setupWindowResize = () => {
    window.addEventListener('resize', () => {
      if (!this.glcanvas) {
        return;
      }
      this.canvasSize = this.glcanvas?.getBoundingClientRect();
      this.glcanvas.width = this.canvasSize.width;
      this.glcanvas.height = this.canvasSize.height;
      console.log('resize', this.canvasSize.width, this.canvasSize.height);
      this.gl?.viewport(0, 0, this.canvasSize.width, this.canvasSize.height);
    });
  };
  gl: WebGLRenderingContext | null = null;
  fragmentShader: WebGLShader | null = null;
  vertexShader: WebGLShader | null = null;
  shaderProgram: WebGLProgram | null = null;
  u_timeUniformLocation: WebGLUniformLocation | null = null;
  u_CanvasWidthUniformLocation: WebGLUniformLocation | null = null;
  u_CanvasHeightUniformLocation: WebGLUniformLocation | null = null;
  u_TestUniformLocation: WebGLUniformLocation | null = null;
  vertexPositionAttribute = 0;

  createFragmentShader = (statements: string) => {
    return `
    precision mediump float;
    uniform float u_time;
    uniform float u_width;
    uniform float u_height;
    uniform float u_test;
    
    void main() {
      float aspect = u_width/u_height;
      vec2 resolution = vec2(u_width, u_height);
      vec2 uv = (gl_FragCoord.xy / resolution.xy);      
      vec2 centeredCoord = uv * 2.0  - 1.0;
      centeredCoord.x *= aspect;

      vec3 finalColor = vec3(0.0);

      

      ${statements}

      
      gl_FragColor = vec4(finalColor, 1.0);        
    }
    `;
    //vec3 color = vec3(0.5, 0.7, 0.);
    //color *= uv.x + uv.y;
    //color *= smoothstep(0.2,0.3,length(uv-vec2(0.5,0.5)));
  };

  vsSource = `
      attribute vec4 aVertexPosition;
      void main() {
          gl_Position = aVertexPosition;
      }
    `;

  createShader = (gl: WebGLRenderingContext, type: number, source: string) => {
    const shader = gl.createShader(type);
    if (!shader) {
      console.error('An error occurred creating the shaders');
      return null;
    }
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
      console.error(
        'An error occurred compiling the shaders: ' +
          gl.getShaderInfoLog(shader)
      );
      gl.deleteShader(shader);
      return null;
    }
    return shader;
  };

  initShaderProgram = (
    gl: WebGLRenderingContext,
    vsSource: string,
    fsSource: string
  ) => {
    this.vertexShader = this.createShader(gl, gl.VERTEX_SHADER, vsSource);
    this.fragmentShader = this.createShader(gl, gl.FRAGMENT_SHADER, fsSource);

    this.shaderProgram = gl.createProgram();
    if (!this.shaderProgram) {
      console.error('Unable to create shader program');
      return null;
    }
    if (!this.vertexShader || !this.fragmentShader) {
      console.error('Unable to create vertex or fragment shader');
      return null;
    }
    gl.attachShader(this.shaderProgram, this.vertexShader);
    gl.attachShader(this.shaderProgram, this.fragmentShader);
    gl.linkProgram(this.shaderProgram);

    if (!gl.getProgramParameter(this.shaderProgram, gl.LINK_STATUS)) {
      console.error(
        'Unable to initialize the shader program: ' +
          gl.getProgramInfoLog(this.shaderProgram)
      );
      return null;
    }

    return;
  };

  /*
  float dist1 = length(centeredCoord + vec2(sin(u_time*2.), cos(u_time*1.) ) ) ;
      dist1 -= 0.5;
      dist1 = abs(dist1);
      dist1 = smoothstep(0.01, 0.05, dist1);

      finalColor += vec3(0.,0., smoothstep(0.6,1.,1.0 - dist1 * 0.5));
  */
  setupShader = (gl: WebGLRenderingContext) => {
    const fsSource = this.createFragmentShader(`
      ${this.shaderStatements}
    `);
    console.log('fsSource', fsSource);
    this.initShaderProgram(gl, this.vsSource, fsSource);
    if (!this.shaderProgram) {
      throw new Error('Unable to initialize the shader program');
    }
    this.u_timeUniformLocation = gl.getUniformLocation(
      this.shaderProgram,
      'u_time'
    );
    this.u_CanvasWidthUniformLocation = gl.getUniformLocation(
      this.shaderProgram,
      'u_width'
    );
    this.u_CanvasHeightUniformLocation = gl.getUniformLocation(
      this.shaderProgram,
      'u_height'
    );
    this.u_TestUniformLocation = gl.getUniformLocation(
      this.shaderProgram,
      'u_test'
    );

    this.vertexPositionAttribute = gl.getAttribLocation(
      this.shaderProgram,
      'aVertexPosition'
    );
  };

  getNodeOutput = (node: IRectNodeComponent<any>) => {
    const inputs: Record<string, string> = {};

    node.connections.forEach((connection) => {
      if (connection.endNode?.id === node.id) {
        if (connection.endNodeThumb?.thumbName) {
          inputs[connection.endNodeThumb?.thumbName] = this.getNodeOutput(
            connection.startNode as IRectNodeComponent<any>
          );
        }
      }
    });

    const result = node?.nodeInfo?.compute(0, [], 0, inputs);
    return result.result;
  };

  getInputsForNode = (node: IRectNodeComponent<any>) => {
    const inputs: Record<string, string> = {};
    node.connections.forEach((connection) => {
      if (connection.endNode?.id === node.id) {
        if (connection.endNodeThumb?.thumbName && connection.startNode) {
          inputs[connection.endNodeThumb?.thumbName] = this.getNodeOutput(
            connection.startNode
          );
        }
      }
    });
    return inputs;
  };
  shaderStatements = '';
  flowTOGLCanvas = () => {
    console.log('flowTOGLCanvas');
    let sdfIndex = 1;
    this.shaderStatements = '';
    if (this.canvasApp) {
      this.canvasApp.elements.forEach((element) => {
        const node = element as unknown as INodeComponent<any>;
        if (node.nodeType === NodeType.Shape) {
          //'circle-node'
          if (node.nodeInfo?.type === 'circle-node') {
            const inputs = this.getInputsForNode(
              node as IRectNodeComponent<any>
            );
            const result = node.nodeInfo?.compute(0, [], sdfIndex, inputs);
            this.shaderStatements += result?.result ?? '';
            this.shaderStatements += `
`;
            sdfIndex++;
          }
          // const data = node.nodeInfo?.formValues['test'];
          // const parsedData = parseFloat(data);
          // if (!isNaN(parsedData)) {
          //   this.test = parsedData;
          // }
          // console.log('canvasUpdated', data, parseFloat(data));
        }
      });
      //       if (sdfIndex > 1) {
      //         this.shaderStatements += `
      //       finalColor = finalColor / ${sdfIndex - 1}.;
      // `;
      //       }
      this.updateGLCanvasParameters();
    }
  };

  pauseRender = false;
  positionBuffer: WebGLBuffer | null = null;
  setupGLCanvas = () => {
    this.glcanvas = document.getElementById('glcanvas') as HTMLCanvasElement;
    this.canvasSize = this.glcanvas.getBoundingClientRect();
    this.glcanvas.width = this.canvasSize.width;
    this.glcanvas.height = this.canvasSize.height;

    const gl = this.glcanvas.getContext('webgl');
    this.gl?.viewport(0, 0, this.canvasSize.width, this.canvasSize.height);

    if (!gl) {
      console.error('WebGL not supported');
      throw new Error('WebGL not supported');
    }
    this.gl = gl;

    this.setupShader(gl);

    this.positionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, this.positionBuffer);

    const positions = [1.0, 1.0, -1.0, 1.0, 1.0, -1.0, -1.0, -1.0];
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.STATIC_DRAW);

    if (!this.positionBuffer) {
      throw new Error('Unable to create buffer');
    }

    this.rafId = requestAnimationFrame(this.renderLoop);
  };
  renderLoop = () => {
    if (
      this.pauseRender ||
      !this.gl ||
      !this.shaderProgram ||
      !this.glcanvas ||
      !this.positionBuffer
    ) {
      return;
    }
    const time = performance.now() * 0.001; // time in seconds

    this.drawScene(
      this.gl,
      this.shaderProgram,
      this.positionBuffer,
      time,
      this.glcanvas
    );
    requestAnimationFrame(this.renderLoop);
  };
  drawScene = (
    gl: WebGLRenderingContext,
    shaderProgram: WebGLProgram,
    positionBuffer: WebGLBuffer,
    time: number,
    glcanvas: HTMLCanvasElement
  ) => {
    gl.clearColor(0.0, 0.0, 0.0, 1.0);
    gl.clear(gl.COLOR_BUFFER_BIT);

    gl.useProgram(shaderProgram);
    gl.uniform1f(this.u_timeUniformLocation, time);
    // gl.uniform1f(u_CanvasWidthUniformLocation, canvas.width);
    // gl.uniform1f(u_CanvasHeightUniformLocation, canvas.height);
    // gl.uniform1f(u_TestUniformLocation, testHelper);
    gl.uniform1f(this.u_CanvasWidthUniformLocation, glcanvas.width);
    gl.uniform1f(this.u_CanvasHeightUniformLocation, glcanvas.height);
    gl.uniform1f(this.u_TestUniformLocation, this.test);

    gl.enableVertexAttribArray(this.vertexPositionAttribute);
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);

    const size = 2; // 2 components per iteration
    const type = gl.FLOAT; // the data is 32bit floats
    const normalize = false; // don't normalize the data
    const stride = 0; // 0 = move forward size * sizeof(type) each iteration to get the next position
    let offset = 0; // start at the beginning of the buffer
    gl.vertexAttribPointer(
      this.vertexPositionAttribute,
      size,
      type,
      normalize,
      stride,
      offset
    );

    const primitiveType = gl.TRIANGLE_STRIP;
    offset = 0;
    const count = 4;
    gl.drawArrays(primitiveType, offset, count);
  };
  rafId = -1;
}
