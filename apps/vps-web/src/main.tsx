const url = new URL(window.location.href);
import './userWorker';
import { runFlow } from './app/run-flow';
import { ocwgPage } from './app/pages/ocwg';
import { pythonPage } from './app/pages/python';
import { examplePage } from './app/pages/example';
import {
  BaseNodeInfo,
  ElementNodeMap,
  Flow,
  IComputeResult,
  IConnectionNodeComponent,
  IFlowCanvasBase,
  IRectNodeComponent,
  setupCustomEditor,
} from '@devhelpr/visual-programming-system';
import * as monaco from 'monaco-editor';
import { registerNodes } from './app/custom-nodes/register-nodes';
import {
  ComputeAsync,
  NodeInfo,
  RunCounter,
  llmApiKeys,
} from '@devhelpr/web-flow-executor';
/* @ts-expect-error:will-fix-later */
import AIFlowEngineWorker from './app/ai-flow-engine-worker/ai-flow-engine-worker?worker';
import {
  AIWorkerWorker,
  OffscreenCanvasNodes,
} from './app/ai-flow-engine-worker/ai-flow-engine-worker-message';
import { CanvasNode } from './app/custom-nodes/classes/canvas-node-class';

/* @ts-expect-error:will-fix-later */
const API_URL_ROOT = import.meta.env.VITE_API_URL;

setupCustomEditor(() => {
  let editorInstance: monaco.editor.IStandaloneCodeEditor | null = null;
  const resizeObserver: ResizeObserver | undefined = undefined;
  let container: HTMLElement | null = null;
  return {
    unmount: () => {
      if (editorInstance) {
        editorInstance.dispose();
      }
      if (resizeObserver && container) {
        (resizeObserver as any).unobserve(container);
      }
    },
    onAfterRender: (
      formComponent,
      formField,
      formId,
      editorLanguage?: string
    ) => {
      setTimeout(() => {
        try {
          container = document.getElementById(
            `${formId}_${formField.fieldName}__html`
          );
          const popupContainer = document.querySelector(
            `[id='${formId}_${formField.fieldName}'].code-editor`
          );
          if (!container || !popupContainer) return;

          // with a node that contains a button below the editor in the node-type, the new grid css setup
          // ... this works when going to fullscreen but not when going back to normal size
          const resizeObserver = new ResizeObserver((_entries) => {
            console.log('resizeObserver');
            if (editorInstance) {
              editorInstance.layout();
            }
          });

          resizeObserver.observe(popupContainer);
          console.log('INIT MONACO EDITOR', popupContainer, container);
          // const containerObserver = new MutationObserver((_entries) => {
          //   console.log('resizeObserver');
          //   if (editorInstance) {
          //     editorInstance.layout();
          //   }
          // });
          // containerObserver.observe(popupContainer, {
          //   childList: true,
          //   subtree: true,
          // });

          const editor = monaco.editor.create(container, {
            fixedOverflowWidgets: true,
            value: (formField.value ?? '').toString(),
            language: editorLanguage ?? 'html',
            scrollBeyondLastLine: false,
            scrollbar: {
              alwaysConsumeMouseWheel: false,
            },
            //automaticLayout: true, // this doesn't work for this use-case !??
          });
          if (editor) {
            editorInstance = editor;
            editor.getModel()?.onDidChangeContent((_event) => {
              if (formField.onChange && formField.fieldType === 'TextArea') {
                formField.onChange(editor.getValue(), formComponent);
              }
            });
          }
        } catch (e) {
          console.error('monaco.editor.create', e);
        }
      }, 0);
    },
  };
});

if (url.pathname === '/run-flow') {
  runFlow();
} else if (url.pathname === '/example') {
  examplePage();
} else if (url.pathname === '/gl') {
  import('./app/gl-app.element').then((module) => {
    new module.GLAppElement('#app-root');
  });
} else if (url.pathname === '/ocwg' || url.pathname === '/ocif') {
  ocwgPage();
} else if (url.pathname === '/python') {
  pythonPage();
} else if (url.pathname === '/ai-canvas') {
  const llmApiKeyValue: Record<string, string> = {};
  llmApiKeys.forEach((apiKeyName) => {
    const apiKeyValue = sessionStorage.getItem(apiKeyName) ?? '';
    llmApiKeyValue[apiKeyName] = apiKeyValue;
  });

  let canvasAppInstance: IFlowCanvasBase<NodeInfo> | undefined = undefined;
  let worker: AIWorkerWorker;
  const startWorker = (
    flow: Flow<BaseNodeInfo> | undefined,
    nodes: ElementNodeMap<NodeInfo>,
    _input?: string,
    runCounter?: RunCounter,
    onFinishRun?: (input: string | any[]) => void
  ) => {
    if (!flow) {
      return;
    }
    const offscreenCanvases: OffscreenCanvasNodes = [];
    nodes.forEach((node) => {
      if (node) {
        if (node.nodeInfo?.taskType === CanvasNode.nodeTypeName) {
          if (node.domElement) {
            const canvas = (
              node.domElement as unknown as HTMLDivElement
            ).querySelector('canvas');
            if (canvas) {
              const offscreenCanvas = canvas.transferControlToOffscreen();
              offscreenCanvases.push({
                id: node.id,
                offscreenCanvas,
              });
            }
          }
        }
      }
    });

    worker = new AIFlowEngineWorker() as unknown as AIWorkerWorker;
    worker.postMessage(
      { message: 'start', flow, offscreenCanvases, llmApiKeys: llmApiKeyValue },
      offscreenCanvases.map(
        (offscreenCanvas) => offscreenCanvas.offscreenCanvas
      )
    );
    worker.addEventListener('message', (event) => {
      if (event.data.message === 'node-update') {
        //console.log('Worker response:', event.data);
        const nodeId = event.data.result.result;
        //console.log('nodeId', nodeId, event.data.result.output);
        if (canvasAppInstance) {
          const nodeInfo = canvasAppInstance.elements.get(nodeId)?.nodeInfo;
          //console.log('nodeInfo', nodeInfo);
          if (nodeInfo) {
            nodeInfo.updateVisual?.(event.data.result.output);
          }
        }
      } else {
        runCounter?.callRunCounterResetHandler('done');
        console.log('Worker response:', event.data);
        onFinishRun?.('done');
      }
    });
  };

  import('./app/flow-app.element').then(async (module) => {
    const flowApp = new module.FlowAppElement(
      '#app-root',
      undefined,
      false,
      100,
      32,
      undefined,
      registerNodes,
      'ai-flow',
      false,
      API_URL_ROOT,
      true,
      undefined,
      {
        run: (
          flow: Flow<BaseNodeInfo> | undefined,
          nodes: ElementNodeMap<NodeInfo>,
          _canvasApp: IFlowCanvasBase<NodeInfo>,
          onFinishRun?: (input: string | any[]) => void,
          input?: string,
          _offsetX?: number,
          _offsetY?: number,
          runCounter?: RunCounter,
          _shouldResetConnectionSlider?: boolean,
          _computeAsync?: ComputeAsync
        ) => {
          console.log('run flow startWorker', flow, nodes);
          startWorker(flow, nodes, input, runCounter, onFinishRun);

          // runCounter?.callRunCounterResetHandler('done');
          // onFinishRun?.('done');
          return true;
        },
        runNode: (
          flow: Flow<BaseNodeInfo> | undefined,
          node: IRectNodeComponent<NodeInfo>,
          _canvasApp: IFlowCanvasBase<NodeInfo>,
          _onStopped?: (input: string | any[], scopeId?: string) => void,
          input?: string,
          _offsetX?: number,
          _offsetY?: number,
          _loopIndex?: number,
          _connection?: IConnectionNodeComponent<NodeInfo>,
          _scopeId?: string,
          runCounter?: RunCounter,
          _shouldResetConnectionSlider?: boolean,
          inputPayload?: any
        ) => {
          if (!flowApp?.canvas?.elements) {
            throw new Error('FlowApp has no nodes or is not created');
          }
          if (flow) {
            console.log('run node and restart flow', node);
            startWorker(flow, flowApp.canvas.elements, input, runCounter);
          } else {
            //console.log('run node', node);
            worker?.postMessage({
              message: 'start-node',
              nodeId: node.id,
              input,
              inputPayload,
              llmApiKeys: llmApiKeyValue,
            });
          }
        },
        runNodeFromThumb: () => {
          console.log('run node from thumb');
        },
        computeAsync: (
          node: IRectNodeComponent<NodeInfo>,
          input: string | any[],
          loopIndex?: number,
          payload?: any,
          thumbName?: string,
          scopeId?: string,
          runCounter?: RunCounter,
          connection?: IConnectionNodeComponent<NodeInfo>
        ) => {
          console.log(
            'custom computeAsync',
            node,
            input,
            loopIndex,
            payload,
            thumbName,
            scopeId,
            runCounter,
            connection
          );
          return new Promise<IComputeResult>((resolve) => {
            resolve({
              result: input,
              output: input,
              followPath: undefined,
            });
          });
        },
        sendOutputToNode: (data, node) => {
          if (
            node &&
            node.nodeInfo &&
            node.nodeInfo.updateVisual &&
            node.nodeInfo.updatesVisualAfterCompute
          ) {
            node.nodeInfo.updateVisual(data);
          }
        },
      },
      (canvasApp) => {
        canvasAppInstance = canvasApp;
      }
    );
  });
} else {
  import('./app/flow-app.element').then(async (module) => {
    new module.FlowAppElement(
      '#app-root',
      undefined,
      false,
      100,
      32,
      undefined,
      registerNodes,
      undefined,
      undefined,
      API_URL_ROOT,
      undefined,
      undefined,
      {
        sendOutputToNode: (data, node) => {
          if (
            node &&
            node.nodeInfo &&
            node.nodeInfo.updateVisual &&
            node.nodeInfo.updatesVisualAfterCompute
          ) {
            node.nodeInfo.updateVisual(data);
          }
        },
      }
    ); //, 100, 32);
  });
}
