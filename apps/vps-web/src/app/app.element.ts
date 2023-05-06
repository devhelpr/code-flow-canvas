import './app.element.css';
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import styles from '../styles.css?inline';
import {
  createElement,
  createNodeElement,
  IElementNode,
  INodeComponent,
  INodeComponentRelation,
  NodeComponentRelationType,
  createMarkupElement,
  createEffect,
  getSelectedNode,
  getVisbility,
  setVisibility,
  setupMarkupElement,
  NodeInfo,
  createElementMap,
  createCanvasApp,
  CanvasAppInstance,
  ThumbType,
  ThumbConnectionType,
} from '@devhelpr/visual-programming-system';

import {
  compileExpressionAsInfo,
  registerCustomBlock,
  registerCustomFunction,
} from '@devhelpr/expression-compiler';
import flowData from '../example-data/tiltest.json';

import { TestApp } from './test-app';
console.log('Test', TestApp);

const template = document.createElement('template');
template.innerHTML = `
  <style>${styles}</style>
  <div class="h-screen w-full bg-slate-800 overflow-hidden" id="root" >
  </div>
`; // flex flex-col

const button =
  'rounded-md bg-slate-500 text-white p-2 m-2 hover:bg-slate-600 select-none';
const menubar = 'fixed top-0 z-20 flex flex-row items-center justify-start';

export class AppElement extends HTMLElement {
  public static observedAttributes = [];

  onclick = (_ev: MouseEvent) => {
    alert('clicked');
  };

  disconnectedCallback() {
    const button = document.querySelector('button');
    if (button) {
      button.removeEventListener('click', this.onclick);
    }
  }

  canvas?: IElementNode<NodeInfo> = undefined;
  canvasApp?: CanvasAppInstance = undefined;

  clearElement = (element: IElementNode<NodeInfo>) => {
    element.domElement.remove();
    const node = element as unknown as INodeComponent<NodeInfo>;
    if (node && node.delete) {
      node.delete();
    }
    element.elements.forEach((element: IElementNode<NodeInfo>) => {
      this.clearElement(element as unknown as IElementNode<NodeInfo>);
    });
    element.elements = createElementMap<NodeInfo>();
  };

  clearCanvas = () => {
    this.canvasApp?.elements.forEach((element) => {
      element.domElement.remove();
      this.clearElement(element as unknown as IElementNode<NodeInfo>);
    });
    this.canvasApp?.elements.clear();
    this.canvasApp?.setCamera(0, 0, 1);
  };

  getThumbNode = (thumbType: ThumbType, node: INodeComponent<NodeInfo>) => {
    if (node.thumbConnectors) {
      const thumbNode = node.thumbConnectors.find((thumbNode) => {
        return thumbNode.thumbType === thumbType;
      });
      return thumbNode;
    }
  };

  constructor() {
    super();
    const shadowRoot = this.attachShadow({ mode: 'open' });
    shadowRoot.appendChild(template.content.cloneNode(true));
    const rootElement = shadowRoot.querySelector('div#root') as HTMLElement;
    if (!rootElement) {
      return;
    }
    let bezierCurve: any = undefined;

    const canvasApp = createCanvasApp<NodeInfo>(rootElement);
    this.canvas = canvasApp.canvas;
    this.canvasApp = canvasApp;
    canvasApp.setOnCanvasClick((x, y) => {
      canvasApp.createRect(
        x,
        y,
        200,
        100,
        undefined,
        undefined,
        [
          {
            thumbType: ThumbType.StartConnectorCenter,
            thumbIndex: 0,
            connectionType: ThumbConnectionType.start,
          },
          {
            thumbType: ThumbType.EndConnectorCenter,
            thumbIndex: 0,
            connectionType: ThumbConnectionType.end,
          },
        ],
        `<p>Node</p><p>Created on click</p><p>dummy node</p><div class="h-24"></div>`,
        {
          classNames: `bg-slate-500 p-4 rounded`,
        }
      );
    });

    const menubarElement = createElement(
      'div',
      {
        class: menubar,
      },
      rootElement
    );
    createElement(
      'button',
      {
        class: button,
        click: (event) => {
          event.preventDefault();
          if (this.canvas) {
            createNodeElement(
              'div',
              this.canvas.domElement,
              canvasApp.elements
            );
          }
          return false;
        },
      },
      menubarElement.domElement,
      'Add element'
    );

    createElement(
      'button',
      {
        class: button,
        click: (event) => {
          event.preventDefault();
          event.stopPropagation();
          this.clearCanvas();
          return false;
        },
      },
      menubarElement.domElement,
      'Clear canvas'
    );

    createElement(
      'button',
      {
        class: button,
        click: (event) => {
          event.preventDefault();
          this.clearCanvas();
          flowData.forEach((flowNode) => {
            if (flowNode.shapeType !== 'Line') {
              const rect = canvasApp?.createRect(
                flowNode.x ?? 0,
                flowNode.y ?? 0,
                200,
                300,
                flowNode.taskType,
                undefined,
                [
                  {
                    thumbType: ThumbType.StartConnectorCenter,
                    thumbIndex: 0,
                    connectionType: ThumbConnectionType.start,
                  },
                  {
                    thumbType: ThumbType.EndConnectorCenter,
                    thumbIndex: 0,
                    connectionType: ThumbConnectionType.end,
                  },
                ],
                `<p>${flowNode.taskType}</p>`,
                {
                  classNames: `bg-slate-500 p-4 rounded`,
                }
              );
              rect.nodeComponent.nodeInfo = flowNode;
            }
          });

          const elementList = Array.from(canvasApp?.elements ?? []);
          console.log('elementList', elementList);

          flowData.forEach((flowNode) => {
            if (flowNode.shapeType === 'Line') {
              let start: INodeComponent<NodeInfo> | undefined = undefined;
              let end: INodeComponent<NodeInfo> | undefined = undefined;
              if (flowNode.startshapeid) {
                const startElement = elementList.find((e) => {
                  const element = e[1] as IElementNode<NodeInfo>;
                  return element.nodeInfo?.id === flowNode.startshapeid;
                });
                if (startElement) {
                  start =
                    startElement[1] as unknown as INodeComponent<NodeInfo>;
                }
              }
              if (flowNode.endshapeid) {
                const endElement = elementList.find((e) => {
                  const element = e[1] as IElementNode<NodeInfo>;
                  return element.nodeInfo?.id === flowNode.endshapeid;
                });
                if (endElement) {
                  end = endElement[1] as unknown as INodeComponent<NodeInfo>;
                }
              }

              const curve = canvasApp.createCubicBezier(
                start?.x ?? 0,
                start?.y ?? 0,
                end?.x ?? 0,
                end?.y ?? 0,
                (start?.x ?? 0) + 100,
                (start?.y ?? 0) + 150,
                (end?.x ?? 0) + 100,
                (end?.y ?? 0) + 150,
                false
              );

              curve.nodeComponent.isControlled = true;

              if (start && curve.nodeComponent) {
                curve.nodeComponent.components.push({
                  type: NodeComponentRelationType.start,
                  component: start,
                } as unknown as INodeComponentRelation<NodeInfo>);

                curve.nodeComponent.startNode = start;
                curve.nodeComponent.startNodeThumb = this.getThumbNode(
                  ThumbType.StartConnectorCenter,
                  start
                );
              }

              if (end && curve.nodeComponent) {
                curve.nodeComponent.components.push({
                  type: NodeComponentRelationType.end,
                  component: end,
                } as unknown as INodeComponentRelation<NodeInfo>);

                curve.nodeComponent.endNode = end;
                curve.nodeComponent.endNodeThumb = this.getThumbNode(
                  ThumbType.EndConnectorCenter,
                  end
                );
              }
              if (curve.nodeComponent.update) {
                curve.nodeComponent.update();
              }
            }
          });
          this.canvasApp?.centerCamera();
          return false;
        },
      },
      menubarElement.domElement,
      'import flow'
    );

    createElement(
      'button',
      {
        class: button,
        click: (event) => {
          event.preventDefault();
          console.log('click RECT', (event.target as HTMLElement)?.tagName);
          const startX = Math.floor(Math.random() * 250);
          const startY = Math.floor(Math.random() * 500);

          const testButton = createElement(
            'button',
            {
              class: `${button} w-[300px] h-[300px] overflow-hidden m-0`,
              click: (event) => {
                event.preventDefault();
                alert('test');
                return false;
              },
            },
            undefined,
            'Click here'
          );

          const testJSXElement = createElement(
            'div',
            {
              class: `bg-slate-500 p-4 rounded cursor-pointer`,
            },
            undefined,
            TestApp() as unknown as HTMLElement
          ) as unknown as INodeComponent<NodeInfo>;

          canvasApp.createRect(
            startX,
            startY,
            200,
            100,
            undefined,
            undefined,
            [
              {
                thumbType: ThumbType.StartConnectorCenter,
                thumbIndex: 0,
                connectionType: ThumbConnectionType.start,
              },
              {
                thumbType: ThumbType.EndConnectorCenter,
                thumbIndex: 0,
                connectionType: ThumbConnectionType.end,
              },
              {
                thumbType: ThumbType.StartConnectorRight,
                thumbIndex: 0,
                connectionType: ThumbConnectionType.start,
              },
              {
                thumbType: ThumbType.StartConnectorRight,
                thumbIndex: 1,
                connectionType: ThumbConnectionType.start,
              },
              {
                thumbType: ThumbType.StartConnectorTop,
                thumbIndex: 0,
                connectionType: ThumbConnectionType.start,
              },
              {
                thumbType: ThumbType.EndConnectorTop,
                thumbIndex: 0,
                connectionType: ThumbConnectionType.end,
              },
            ],
            testJSXElement,
            //testButton as unknown as INodeComponent<NodeInfo>,
            //`<p>Node</p><p>Lorem ipsum</p><p>dummy node</p><div class="h-24"></div>`,
            {
              classNames: `bg-slate-500 p-4 rounded`,
            }
          );

          return false;
        },
      },
      menubarElement.domElement,
      'Add rect'
    );

    createElement(
      'button',
      {
        class: button,
        click: (event) => {
          event.preventDefault();

          const x = Math.floor(Math.random() * 250);
          const y = Math.floor(Math.random() * 500);

          // if (Math.random() >= 0.5) {
          bezierCurve = canvasApp.createCubicBezier(
            x,
            y,
            x + 150,
            y + 150,
            x + 50,
            y + 50,
            x + 75,
            y + 75
          );
          // } else {
          // bezierCurve = createQuadraticBezier(
          //   canvas as unknown as INodeComponent<NodeInfo>,
          //   pathHiddenElement,
          //   this.elements,
          //   x,
          //   y,
          //   x + 150,
          //   y + 150,
          //   x + 50,
          //   y + 50
          // );
          // }
          return false;
        },
      },
      menubarElement.domElement,
      'Add bezier curve'
    );

    createElement(
      'button',
      {
        class: button,
        click: (event) => {
          event.preventDefault();

          createMarkupElement(
            '<div><h2>TITLE</h2><p>subtitle</p></div>',
            canvasApp.canvas.domElement,
            canvasApp.elements
          );
          return false;
        },
      },
      menubarElement.domElement,
      'Add markup element'
    );

    createElement(
      'button',
      {
        class: button,
        click: (event) => {
          event.preventDefault();
          this.canvasApp?.centerCamera();
          return false;
        },
      },
      menubarElement.domElement,
      'center'
    );
    createElement(
      'button',
      {
        class: button,
        click: (event) => {
          event.preventDefault();
          setVisibility(!getVisbility());
          return false;
        },
      },
      menubarElement.domElement,
      'switch visibility'
    );

    const selectedNode = createElement(
      'div',
      {
        id: 'selectedNode',
        class: 'text-white',
      },
      menubarElement.domElement
    );

    // transform-origin: top left;
    // const canvas = createElement(
    //   'div',
    //   {
    //     id: 'canvas',
    //     class:
    //       'w-full h-full bg-slate-800 flex-auto relative z-10 origin-top-left transition-none',
    //   },
    //   rootElement
    // );

    const textAreaContainer = createElement(
      'div',
      {
        id: 'textAreaContainer',
        class:
          'fixed w-1/2 h-full top-0 right-0 left-auto z-50 p-2 bg-slate-400 hidden',
      },
      rootElement
    );

    let raf = -1;
    let inputTimeout = -1;

    const textArea = createElement(
      'textarea',
      {
        id: 'textAreaCode',
        class: 'w-full h-full p-2 outline-none',
        input: (event: InputEvent) => {
          const text =
            (event?.target as unknown as HTMLTextAreaElement)?.value ?? '';

          if (inputTimeout !== -1) {
            clearTimeout(inputTimeout);
            inputTimeout = -1;
          }
          inputTimeout = setTimeout(() => {
            if (raf !== -1) {
              window.cancelAnimationFrame(raf);
              raf = -1;
            }

            console.log('oninput', text);
            registerCustomBlock('frameUpdate');
            const compiledExpressionInfo = compileExpressionAsInfo(text);
            try {
              const compiledExpression = (
                new Function(
                  'payload',
                  `${compiledExpressionInfo.script}`
                ) as unknown as (payload?: any) => any
              ).bind(compiledExpressionInfo.bindings);
              const result = compiledExpression();

              // TODO : have this done by the compiler:
              if (result && result.frameUpdate) {
                result.frameUpdate = result.frameUpdate.bind(
                  compiledExpressionInfo.bindings
                );

                /*
                    test code:

                    let a = 1;
                    frameUpdate {
                      setStartPoint(1,a);
                      a=a+1;
                    }

                    TODO : implement deltaTime
                    TODO : implement custom log function
                */

                const rafCallback = (deltaTime: number) => {
                  result.frameUpdate(deltaTime);
                  if (raf !== -1) {
                    raf = window.requestAnimationFrame(rafCallback);
                  }
                };
                raf = window.requestAnimationFrame(rafCallback);
              }
            } catch (error) {
              console.error('error compiling', error);
            }
          }, 100) as unknown as number;
        },
      },
      textAreaContainer.domElement
    );

    createEffect(() => {
      const nodeElementId = getSelectedNode();
      console.log('selected nodeElement', nodeElementId);
      if (nodeElementId) {
        selectedNode.domElement.textContent = `${nodeElementId}`;
      } else {
        selectedNode.domElement.textContent = '';
      }
    });

    createMarkupElement(
      `
      <div class="bg-black" >
        <div>
          <div>
            <div style="background: white;" class="p-2">
              <h2>TITLE</h2>
              <p>subtitle</p>
              <div class="bg-red-300">
                <i style="color:blue;">lorem ipsummm<br></br></i>
                {20 + 30}
              </div>
            </div>
          </div>
        </div>
      </div>
      `,
      canvasApp.canvas.domElement,
      canvasApp.elements
    );

    setupMarkupElement(
      `
      function Test() {
        return <div class="bg-black"><div class="p-4">test{2*3}</div></div>;
      }  
      return Test();  
    `,
      rootElement
    );

    const element = TestApp();
    console.log('element', element);
    rootElement.append(element as unknown as Node);

    registerCustomFunction('setStartPoint', [], (x: number, y: number) => {
      console.log('setStartPoint', x, y);
      if (bezierCurve) {
        bezierCurve.setStartPoint(x, y);
      }
    });
    registerCustomFunction('setControlPoint1', [], (x: number, y: number) => {
      console.log('setControlPoint1', x, y);
      if (bezierCurve) {
        bezierCurve.setControlPoint1(x, y);
      }
    });
    registerCustomFunction('setControlPoint2', [], (x: number, y: number) => {
      console.log('setControlPoint2', x, y);
      if (bezierCurve) {
        bezierCurve.setControlPoint2(x, y);
      }
    });
    registerCustomFunction('setEndPoint', [], (x: number, y: number) => {
      console.log('setEndPoint', x, y);
      if (bezierCurve) {
        bezierCurve.setEndPoint(x, y);
      }
    });
    registerCustomFunction('log', [], (message: any) => {
      console.log('log', message);
    });
  }
}
customElements.define('vps-web-root', AppElement);

/*const [getCount, setCount] = createSignal(0);
const [getValue, setValue] = createSignal('test');
createEffect(() => console.log('effect', getCount(), getValue()));
setCount(1);
setCount(2);
setValue('test2');
setCount(3);
*/
/*setInterval(() => {
  setCount(getCount() + 1);
}, 1000);
*/
