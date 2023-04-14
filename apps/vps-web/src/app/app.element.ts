import './app.element.css';
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import styles from '../styles.css?inline';
import {
  createElement,
  createNSElement,
  createNodeElement,
  ElementNodeMap,
  IElementNode,
  INodeComponent,
  INodeComponentRelation,
  NodeComponentRelationType,
  createMarkupElement,
  createEffect,
  getSelectedNode,
  getVisbility,
  setSelectNode,
  setVisibility,
  getCurrentInteractionState,
  InteractionEvent,
  interactionEventState,
  InteractionState,
  setupMarkupElement,
  createCubicBezier,
  createRect,
  NodeInfo,
  createElementMap,
  setCamera,
  transformToCamera,
  CLICK_MOVEMENT_THRESHOLD,
} from '@devhelpr/visual-programming-system';

import {
  compileExpressionAsInfo,
  registerCustomBlock,
  registerCustomFunction,
} from '@devhelpr/expression-compiler';
import flowData from '../example-data/tiltest.json';

const template = document.createElement('template');
template.innerHTML = `
  <style>${styles}</style>
  <div class="h-screen w-full bg-slate-800 overflow-hidden" id="root" >
  </div>
`; // flex flex-col

const button =
  'rounded-md bg-slate-500 text-white p-2 m-2 hover:bg-slate-600 select-none';
const menubar = 'fixed z-20 flex flex-row items-center justify-start';

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

  elements: ElementNodeMap<NodeInfo> = createElementMap<NodeInfo>();
  scale = 1;
  x = 0;
  y = 0;
  canvas?: IElementNode<NodeInfo> = undefined;

  clearElement = (element: IElementNode<NodeInfo>) => {
    element.domElement.remove();
    element.elements.forEach((element: IElementNode<NodeInfo>) => {
      this.clearElement(element as unknown as IElementNode<NodeInfo>);
    });
    element.elements = createElementMap<NodeInfo>();
  };

  clearCanvas = () => {
    this.elements.forEach((element) => {
      element.domElement.remove();
      this.clearElement(element as unknown as IElementNode<NodeInfo>);
    });
    this.elements.clear();
  };

  startDragX = 0;
  startDragY = 0;

  startClientDragX = 0;
  startClientDragY = 0;

  setCameraPosition = (x: number, y: number) => {
    if (this.canvas?.domElement) {
      const diffX = x - this.startClientDragX;
      const diffY = y - this.startClientDragY;

      this.x = this.startDragX + diffX;
      this.y = this.startDragY + diffY;

      setCamera(this.x, this.y, this.scale);

      (this.canvas.domElement as unknown as HTMLElement).style.transform =
        'translate(' +
        this.x +
        'px,' +
        this.y +
        'px) ' +
        'scale(' +
        this.scale +
        ',' +
        this.scale +
        ') ';
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
          createNodeElement('div', canvas.domElement, this.elements);
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
          this.clearCanvas();
          flowData.forEach((flowNode) => {
            if (flowNode.shapeType !== 'Line') {
              const rect = createRect(
                canvas as unknown as INodeComponent<NodeInfo>,
                pathHiddenElement,
                this.elements,
                flowNode.x ?? 0,
                flowNode.y ?? 0,
                200,
                300,
                flowNode.taskType
              );
              rect.nodeComponent.nodeInfo = flowNode;
            }
          });
          const elementList = Array.from(this.elements);
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

              const curve = createCubicBezier(
                canvas as unknown as INodeComponent<NodeInfo>,
                pathHiddenElement,
                this.elements,
                start?.x ?? 0,
                start?.y ?? 0,
                end?.x ?? 0,
                end?.y ?? 0,
                (start?.x ?? 0) + 100,
                (start?.y ?? 0) + 150,
                (end?.x ?? 0) + 100,
                (end?.y ?? 0) + 150,
                true
              );

              // (canvas.domElement as HTMLElement).prepend(
              //   curve.nodeComponent.domElement
              // );

              if (start && curve.nodeComponent) {
                curve.nodeComponent.components.push({
                  type: NodeComponentRelationType.start,
                  component: start,
                } as unknown as INodeComponentRelation<NodeInfo>);

                curve.nodeComponent.startNode = start;
              }

              if (end && curve.nodeComponent) {
                curve.nodeComponent.components.push({
                  type: NodeComponentRelationType.end,
                  component: end,
                } as unknown as INodeComponentRelation<NodeInfo>);

                curve.nodeComponent.endNode = end;
              }
              if (curve.nodeComponent.update) {
                curve.nodeComponent.update();
              }
            }
          });
          return false;
        },
      },
      menubarElement.domElement,
      'clear canvas'
    );

    createElement(
      'button',
      {
        class: button,
        click: (event) => {
          event.preventDefault();
          const startX = Math.floor(Math.random() * 250);
          const startY = Math.floor(Math.random() * 500);

          const start = createRect(
            canvas as unknown as INodeComponent<NodeInfo>,
            pathHiddenElement,
            this.elements,
            startX,
            startY,
            100,
            100
          );

          // const endX = Math.floor(Math.random() * 250);
          // const endY = Math.floor(Math.random() * 500);

          // const end = createRect(
          //   canvas as unknown as INodeComponent,
          //   pathHiddenElement,
          //   this.elements,
          //   endX,
          //   endY,
          //   100,
          //   100
          // );

          // bezierCurve = createCubicBezier(
          //   canvas as unknown as INodeComponent,
          //   pathHiddenElement,
          //   this.elements,
          //   startX + 100,
          //   startY + 50,
          //   endX,
          //   endY + 50,
          //   startX + 100 + 150,
          //   startY + 50,
          //   endX - 150,
          //   endY + 50,
          //   true
          // );

          // if (bezierCurve.nodeComponent) {
          //   bezierCurve.nodeComponent.components.push({
          //     type: NodeComponentRelationType.start,
          //     component: start.nodeComponent,
          //   } as unknown as INodeComponentRelation);

          //   bezierCurve.nodeComponent.components.push({
          //     type: NodeComponentRelationType.end,
          //     component: end.nodeComponent,
          //   } as unknown as INodeComponentRelation);
          // }

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
          bezierCurve = createCubicBezier(
            canvas as unknown as INodeComponent<NodeInfo>,
            pathHiddenElement,
            this.elements,
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
            canvas.domElement,
            this.elements
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

    let isClicking = false;
    let isMoving = false;
    let startTime = 0;

    // transform-origin: top left;
    const canvas = createElement(
      'div',
      {
        id: 'canvas',
        class:
          'w-full h-full bg-slate-800 flex-auto relative z-10 origin-top-left transition-none',
      },
      rootElement
    );
    this.canvas = canvas;

    rootElement.addEventListener('pointerdown', (event: PointerEvent) => {
      isClicking = true;
      isMoving = false;
      startTime = Date.now();
    });

    rootElement.addEventListener('pointermove', (event: PointerEvent) => {
      //const canvasRect = canvas.domElement.getBoundingClientRect();
      if (isClicking) {
        isMoving = true;
      }
      if (Date.now() - startTime < CLICK_MOVEMENT_THRESHOLD) {
        //return;
      }
      let currentState = getCurrentInteractionState();

      if (currentState.state === InteractionState.Idle && isClicking) {
        this.startClientDragX = event.clientX;
        this.startClientDragY = event.clientY;
        this.startDragX = this.x;
        this.startDragY = this.y;

        interactionEventState(
          InteractionEvent.PointerDown,
          {
            id: canvas.id,
            type: 'Canvas',
            interactionInfo: {
              xOffsetWithinElementOnFirstClick: 0,
              yOffsetWithinElementOnFirstClick: 0,
            },
          },
          canvas as unknown as INodeComponent<NodeInfo>
        );
        currentState = getCurrentInteractionState();
      }
      if (
        currentState.state === InteractionState.Moving &&
        currentState.element &&
        currentState.target
      ) {
        const interactionState = interactionEventState(
          InteractionEvent.PointerMove,
          currentState.target,
          currentState.element
        );
        if (interactionState) {
          if (interactionState.target?.id === canvas.id) {
            this.setCameraPosition(event.clientX, event.clientY);
          } else {
            const canvasRect = (
              canvas.domElement as unknown as HTMLElement | SVGElement
            ).getBoundingClientRect();

            const { x, y } = transformToCamera(
              event.clientX, //- canvasRect.x,
              event.clientY //- canvasRect.y
            );

            currentState.target.pointerMove &&
              currentState.target.pointerMove(
                x,
                y,
                currentState.element,
                canvas.domElement,
                currentState.target.interactionInfo
              );
          }
        }
      }
    });
    rootElement.addEventListener('pointerup', (event: PointerEvent) => {
      const currentState = getCurrentInteractionState();
      if (
        currentState.state === InteractionState.Moving &&
        currentState.element &&
        currentState.target
      ) {
        const interactionState = interactionEventState(
          InteractionEvent.PointerUp,
          currentState.target,
          currentState.element,
          true
        );
        if (interactionState) {
          if (currentState.target?.id === canvas.id) {
            this.setCameraPosition(event.clientX, event.clientY);

            interactionEventState(
              InteractionEvent.PointerUp,
              currentState.target,
              currentState.element
            );

            setSelectNode(undefined);
          } else {
            const canvasRect = (
              canvas.domElement as unknown as HTMLElement | SVGElement
            ).getBoundingClientRect();
            const { x, y } = transformToCamera(
              event.clientX, //- canvasRect.x,
              event.clientY //- canvasRect.y
            );

            currentState.target.pointerUp &&
              currentState.target.pointerUp(
                x,
                y,
                currentState.element,
                canvas.domElement,
                currentState.target.interactionInfo
              );
          }
        }
      } else {
        if (
          !isMoving &&
          isClicking
          // ||
          // (isClicking &&
          //   isMoving &&
          //   Date.now() - startTime < CLICK_MOVEMENT_THRESHOLD)
        ) {
          console.log('click canvas', isMoving, Date.now() - startTime);
          setSelectNode(undefined);
        }
      }
      isMoving = false;
      isClicking = false;
    });
    rootElement.addEventListener('pointerleave', (event: PointerEvent) => {
      console.log('pointerleave canvas', event);

      isMoving = false;
      isClicking = false;

      const currentState = getCurrentInteractionState();
      if (
        currentState.state === InteractionState.Moving &&
        currentState.element &&
        currentState.target
      ) {
        const interactionState = interactionEventState(
          InteractionEvent.PointerLeave,
          currentState.target,
          currentState.element
        );

        if (interactionState) {
          if (currentState.target?.id === canvas.id) {
            //
          } else {
            const canvasRect = (
              canvas.domElement as unknown as HTMLElement | SVGElement
            ).getBoundingClientRect();
            const { x, y } = transformToCamera(
              event.clientX - canvasRect.x,
              event.clientY - canvasRect.y
            );

            currentState.target.pointerUp &&
              currentState.target.pointerUp(
                x,
                y,
                currentState.element,
                canvas.domElement,
                currentState.target.interactionInfo
              );
          }
        }
      }
    });

    let wheelTime = -1;
    rootElement.addEventListener('wheel', (event: WheelEvent) => {
      event.preventDefault();

      if (wheelTime === -1) {
        wheelTime = event.timeStamp;
      }
      let timeDiff = event.timeStamp - wheelTime;
      if (event.shiftKey) {
        timeDiff = timeDiff * 16;
      }
      //const delta = result.pixelY; // / timeDiff;
      const delta = Math.max(
        -1,
        Math.min(1, (event as unknown as any).wheelDelta || -event.detail)
      );

      // Determine the scale factor for the zoom
      const scaleFactor = 1 + delta * 0.1;

      const scaleBy = scaleFactor;
      // if (scaleBy < 0.95) {
      //   scaleBy = 0.95;
      // } else if (scaleBy > 1.05) {
      //   scaleBy = 1.05;
      // }

      if (canvas.domElement) {
        const mousePointTo = {
          x: event.clientX / this.scale - this.x / this.scale,
          y: event.clientY / this.scale - this.y / this.scale,
        };

        this.scale = this.scale * scaleBy;
        //result.pixelY > 0 ? this.scale * scaleBy : this.scale / scaleBy;
        if (this.scale < 0.15) {
          this.scale = 0.15;
        } else if (this.scale > 3) {
          this.scale = 3;
        }

        const newPos = {
          x: -(mousePointTo.x - event.clientX / this.scale) * this.scale,
          y: -(mousePointTo.y - event.clientY / this.scale) * this.scale,
        };

        this.x = newPos.x;
        this.y = newPos.y;

        setCamera(this.x, this.y, this.scale);

        (canvas.domElement as unknown as HTMLElement).style.transform =
          'translate(' +
          this.x +
          'px,' +
          this.y +
          'px) ' +
          'scale(' +
          this.scale +
          ',' +
          this.scale +
          ') ';
      }
      return false;
    });

    const hiddenSVG = createNSElement(
      'svg',
      {
        width: 0,
        height: 0,
        style: {
          visibility: 'hidden',
          position: 'absolute',
        },
      },
      canvas.domElement
    );

    const pathHiddenElement = createNSElement(
      'path',
      {
        class: 'cursor-pointer pointer-events-auto',
      },
      hiddenSVG.domElement
    );

    const textAreaContainer = createElement(
      'div',
      {
        id: 'textAreaContainer',
        class:
          'fixed w-1/2 h-full top-0 right-0 left-auto z-50 p-2 bg-slate-400',
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
      canvas.domElement,
      this.elements
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
