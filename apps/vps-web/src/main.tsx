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
} from '@devhelpr/web-flow-executor';
import AIFlowEngineWorker from './app/ai-flow-engine-worker/ai-flow-engine-worker?worker';
import { AIWorkerWorker } from './app/ai-flow-engine-worker/ai-flow-engine-worker-message';

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
  let canvasAppInstance: IFlowCanvasBase<NodeInfo> | undefined = undefined;
  let worker: AIWorkerWorker;
  const startWorker = (
    flow: Flow<BaseNodeInfo> | undefined,
    input?: string,
    runCounter?: RunCounter,
    onFinishRun?: (input: string | any[]) => void
  ) => {
    if (!flow) {
      return;
    }
    worker = new AIFlowEngineWorker() as unknown as AIWorkerWorker;
    worker.postMessage({ message: 'start', flow });
    worker.addEventListener('message', (event) => {
      if (event.data.message === 'node-update') {
        console.log('Worker response:', event.data);
        const nodeId = event.data.result.result;
        console.log('nodeId', nodeId, event.data.result.output);
        if (canvasAppInstance) {
          const nodeInfo = canvasAppInstance.elements.get(nodeId)?.nodeInfo;
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
    new module.FlowAppElement(
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
          canvasApp: IFlowCanvasBase<NodeInfo>,
          onFinishRun?: (input: string | any[]) => void,
          input?: string,
          offsetX?: number,
          offsetY?: number,
          runCounter?: RunCounter,
          shouldResetConnectionSlider?: boolean,
          computeAsync?: ComputeAsync
        ) => {
          startWorker(flow, input, runCounter, onFinishRun);
          console.log('run flow', flow, computeAsync);
          // runCounter?.callRunCounterResetHandler('done');
          // onFinishRun?.('done');
          return true;
        },
        runNode: (
          flow: Flow<BaseNodeInfo> | undefined,
          node: IRectNodeComponent<NodeInfo>,
          canvasApp: IFlowCanvasBase<NodeInfo>,
          onStopped?: (input: string | any[], scopeId?: string) => void,
          input?: string,
          offsetX?: number,
          offsetY?: number,
          loopIndex?: number,
          connection?: IConnectionNodeComponent<NodeInfo>,
          scopeId?: string,
          runCounter?: RunCounter
        ) => {
          if (flow) {
            console.log('run node and restart flow', node);
            startWorker(flow, input, runCounter);
          } else {
            console.log('run node', node);
            worker?.postMessage({
              message: 'start-node',
              nodeId: node.id,
              input,
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
      undefined
    ); //, 100, 32);
  });
}
