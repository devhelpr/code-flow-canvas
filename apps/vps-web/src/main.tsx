const url = new URL(window.location.href);
import './userWorker';
import { RegisterNodeFactoryFunction } from '@devhelpr/web-flow-executor';
import { runFlow } from './app/run-flow';
import { ocwgPage } from './app/pages/ocwg';
import { pythonPage } from './app/pages/python';
import { examplePage } from './app/pages/example';
import { setupCustomEditor } from '@devhelpr/visual-programming-system';
import * as monaco from 'monaco-editor';

if (url.pathname === '/run-flow') {
  runFlow();
} else if (url.pathname === '/example') {
  examplePage();
} else if (url.pathname === '/gl') {
  import('./app/gl-app.element').then((module) => {
    new module.GLAppElement('#app-root');
  });
} else if (url.pathname === '/ocwg') {
  ocwgPage();
} else if (url.pathname === '/python') {
  pythonPage();
} else {
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
            if (!container) return;

            const resizeObserver = new ResizeObserver((_entries) => {
              if (editorInstance) {
                editorInstance.layout();
              }
            });

            resizeObserver.observe(container);
            const editor = monaco.editor.create(container, {
              fixedOverflowWidgets: true,
              value: (formField.value ?? '').toString(),
              language: editorLanguage ?? 'html',
              scrollBeyondLastLine: false,
              scrollbar: {
                alwaysConsumeMouseWheel: false,
              },
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

  import('./app/flow-app.element').then(async (module) => {
    new module.FlowAppElement(
      '#app-root',
      undefined,
      false,
      100,
      32,
      undefined,
      (_registerNodeFactory: RegisterNodeFactoryFunction) => {
        //registerNodeFactory('test-external-node', getExternalTestNode());
      },
      undefined,
      undefined,
      API_URL_ROOT
    ); //, 100, 32);
  });
}
