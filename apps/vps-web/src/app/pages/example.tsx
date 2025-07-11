import { Flow } from '@devhelpr/visual-programming-system';
import { NodeInfo } from '@devhelpr/web-flow-executor';
import flowData from './counter.json';
import { registerNodes } from '../custom-nodes/register-nodes';

export function examplePage() {
  const appElement = document.getElementById('app-root')!;
  const pageElement = document.getElementById('page-root')!;

  import('../flow-app.element').then((module) => {
    const storageProvider = {
      getFlow: async (_flowId: string) => {
        return new Promise<{ flow: Flow<NodeInfo>; didNotExist: boolean }>(
          (resolve, _reject) => {
            resolve({ flow: flowData as Flow<NodeInfo>, didNotExist: false });
          }
        );
      },
      saveFlow: async (_flowId: string, _flow: any) => {
        return Promise.resolve();
      },
      getCurrentFlow: () => {
        return flowData as Flow<NodeInfo>;
      },
      doesFlowExist: async (_flowId: string) => {
        return Promise.resolve(true);
      },
    };
    appElement.classList.add('hidden');
    pageElement.classList.remove('hidden');
    new module.FlowAppElement(
      '#page-app-root',
      storageProvider,
      false,
      20,
      32,
      undefined,
      registerNodes
    );
    //result.destroy();
  });
}
