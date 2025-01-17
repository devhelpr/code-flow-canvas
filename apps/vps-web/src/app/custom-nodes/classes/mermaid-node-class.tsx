import {
  createJSXElement,
  IComputeResult,
} from '@devhelpr/visual-programming-system';
import mermaid from 'mermaid';

export class MermaidNode {
  nodeRenderElement: HTMLElement | undefined = undefined;
  constructor() {
    mermaid.initialize({
      startOnLoad: true,
    });
  }
  compute = (
    input: string,
    _loopIndex?: number,
    _payload?: any
  ): Promise<IComputeResult> => {
    return new Promise<IComputeResult>((resolve) => {
      if (this.nodeRenderElement && input) {
        const mermaidDefintion = input
          .replaceAll('```mermaid', '')
          .replaceAll('```', '')
          .trim();
        mermaid
          .render('dynamic', mermaidDefintion)
          .then((renderResult) => {
            if (this.nodeRenderElement) {
              this.nodeRenderElement.innerHTML = renderResult.svg;
            }
            // if (rect && rect.resize) {
            //   rect.resize(undefined, true, '.mermaid');
            // }
            resolve({
              result: input,
              output: input,
              followPath: undefined,
            });
          })
          .catch((error) => {
            console.error('Error rendering mermaid diagram', error);
            resolve({
              result: input,
              output: input,
              followPath: undefined,
            });
          });
      }
    });
  };

  render = () => {
    return (
      <div class="mermaid w-min h-min p-4 border-4 border-slate-400 border-solid rounded"></div>
    );
  };
}
