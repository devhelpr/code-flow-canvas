import './app.element.css';
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import styles from '../styles.css?inline';
import { createElement, createNSElement } from './utils/create-element';
import { createNodeElement } from './components/node-element';
import { createSVGElement } from './components/svg-element';
import {
  ElementNodeMap,
  IElementNode,
  INodeComponent,
  INodeComponentRelation,
  NodeComponentRelationType,
} from './interfaces/element';
import { createMarkupElement } from './components/markup-element';
import {
  createEffect,
  getSelectedNode,
  getVisbility,
  setSelectNode,
  setVisibility,
} from './reactivity';
import {
  getCurrentInteractionState,
  InteractionEvent,
  interactionEventState,
  InteractionState,
} from './interaction-state-machine';
import { setupMarkupElement } from './utils/create-markup';
import { createConnectionSVGElement } from './components/connection-svg-element';
import { createConnectionsSVGCanvasElement } from './components/connections-canvas-svg';
import { createCubicBezier, createQuadraticBezier } from './components/bezier';
import {
  compileExpression,
  compileExpressionAsInfo,
  registerCustomBlock,
  registerCustomFunction,
} from '@devhelpr/expression-compiler';
import { createRect } from './components/rect';
import { NodeInfo } from './interfaces/nodeInfo';
import { createElementMap } from './utils/create-element-map';
import flowData from '../example-data/tiltest.json';
//import { count } from 'console';

const template = document.createElement('template');
template.innerHTML = `
  <style>${styles}</style>
  <div class="h-screen w-100 bg-slate-800 overflow-hidden" id="root" >
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

  clearElement = (element: IElementNode<NodeInfo>) => {
    element.domElement.remove();
    element.elements.forEach((element: IElementNode<NodeInfo>) => {
      this.clearElement(element as unknown as IElementNode<NodeInfo>);
    });
    element.elements = [];
  };

  clearCanvas = () => {
    this.elements.forEach((element) => {
      element.domElement.remove();
      this.clearElement(element as unknown as IElementNode<NodeInfo>);
    });
    this.elements.clear();
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
        click: () => {
          createNodeElement('div', canvas.domElement, this.elements);
        },
      },
      menubarElement.domElement,
      'Add element'
    );

    createElement(
      'button',
      {
        class: button,
        click: () => {
          this.clearCanvas();
          flowData.forEach((flowNode) => {
            if (flowNode.shapeType !== 'connection') {
              const rect = createRect(
                canvas as unknown as INodeComponent<NodeInfo>,
                pathHiddenElement,
                this.elements,
                flowNode.x ?? 0,
                flowNode.y ?? 0,
                200,
                300
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
        },
      },
      menubarElement.domElement,
      'clear canvas'
    );

    createElement(
      'button',
      {
        class: button,
        click: () => {
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
        },
      },
      menubarElement.domElement,
      'Add rect'
    );

    createElement(
      'button',
      {
        class: button,
        click: () => {
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
        },
      },
      menubarElement.domElement,
      'Add bezier curve'
    );

    createElement(
      'button',
      {
        class: button,
        click: () => {
          createMarkupElement(
            '<div><h2>TITLE</h2><p>subtitle</p></div>',
            canvas.domElement,
            this.elements
          );
        },
      },
      menubarElement.domElement,
      'Add markup element'
    );

    createElement(
      'button',
      {
        class: button,
        click: () => {
          setVisibility(!getVisbility());
        },
      },
      menubarElement.domElement,
      'switch visibility'
    );

    const selectedNode = createElement(
      'div',
      {
        id: 'selectedNode',
      },
      menubarElement.domElement
    );

    let isClicking = false;
    let isMoving = false;

    // transform-origin: top left;
    const canvas = createElement(
      'div',
      {
        id: 'canvas',
        class:
          'w-100 bg-slate-800 flex-auto relative z-10 origin-top-left transition-none',
        pointerdown: (event: PointerEvent) => {
          isClicking = true;
          isMoving = false;
        },
        pointermove: (event: PointerEvent) => {
          //const canvasRect = canvas.domElement.getBoundingClientRect();
          isMoving = true;
          const currentState = getCurrentInteractionState();
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
              const canvasRect = (
                canvas.domElement as unknown as HTMLElement | SVGElement
              ).getBoundingClientRect();
              currentState.target.pointerMove(
                event.clientX - canvasRect.x,
                event.clientY - canvasRect.y,
                currentState.element,
                canvas.domElement,
                currentState.target.interactionInfo
              );
            }
          }
        },
        pointerup: (event: PointerEvent) => {
          const currentState = getCurrentInteractionState();
          if (
            currentState.state === InteractionState.Moving &&
            currentState.element &&
            currentState.target
          ) {
            if (
              interactionEventState(
                InteractionEvent.PointerUp,
                currentState.target,
                currentState.element,
                true
              )
            ) {
              const canvasRect = (
                canvas.domElement as unknown as HTMLElement | SVGElement
              ).getBoundingClientRect();

              currentState.target.pointerUp(
                event.clientX - canvasRect.x,
                event.clientY - canvasRect.y,
                currentState.element,
                canvas.domElement,
                currentState.target.interactionInfo
              );
            }
          } else {
            if (!isMoving && isClicking) {
              console.log('click canvas');
              setSelectNode(undefined);
            }
          }
          isMoving = false;
          isClicking = false;
        },
        pointerleave: (event: PointerEvent) => {
          console.log('pointerleave canvas', event);

          isMoving = false;
          isClicking = false;

          const currentState = getCurrentInteractionState();
          if (
            currentState.state === InteractionState.Moving &&
            currentState.element &&
            currentState.target
          ) {
            if (
              interactionEventState(
                InteractionEvent.PointerLeave,
                currentState.target,
                currentState.element
              )
            ) {
              const canvasRect = (
                canvas.domElement as unknown as HTMLElement | SVGElement
              ).getBoundingClientRect();

              currentState.target.pointerUp(
                event.clientX - canvasRect.x,
                event.clientY - canvasRect.y,
                currentState.element,
                canvas.domElement,
                currentState.target.interactionInfo
              );
            }
          }
        },
      },
      rootElement
    );

    rootElement.addEventListener('wheel', (e: WheelEvent) => {
      e.preventDefault();
      const scaleBy = 1.025; //1.13;
      if (canvas.domElement) {
        const mousePointTo = {
          x: e.clientX / this.scale - this.x / this.scale,
          y: e.clientY / this.scale - this.y / this.scale,
        };

        this.scale = e.deltaY > 0 ? this.scale * scaleBy : this.scale / scaleBy;
        if (this.scale < 0.15) {
          this.scale = 0.15;
        } else if (this.scale > 3) {
          this.scale = 3;
        }

        const newPos = {
          x: -(mousePointTo.x - e.clientX / this.scale) * this.scale,
          y: -(mousePointTo.y - e.clientY / this.scale) * this.scale,
        };

        this.x = newPos.x;
        this.y = newPos.y;

        (canvas.domElement as unknown as HTMLElement).style.transform =
          'translate(' +
          newPos.x +
          'px,' +
          newPos.y +
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
      const nodeElement = getSelectedNode();
      console.log('nodeElement', nodeElement);
      if (nodeElement) {
        selectedNode.domElement.textContent = `${nodeElement.id} => ${nodeElement.x}, ${nodeElement.y}`;
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
