import {
  createJSXElement,
  IComputeResult,
} from '@devhelpr/visual-programming-system';
import mermaid from 'mermaid';

mermaid.initialize({
  startOnLoad: true,
});

export class MermaidNode {
  nodeRenderElement: HTMLElement | undefined = undefined;

  id: string;
  constructor(id: string) {
    this.id = id;
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
          .render(`_${this.id.replaceAll('-', '')}Mermaid`, mermaidDefintion)
          .then((renderResult) => {
            if (this.nodeRenderElement) {
              this.nodeRenderElement.innerHTML = renderResult.svg;
            }

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
      } else {
        mermaid
          .render(
            `_${this.id.replaceAll('-', '')}Mermaid`,
            `flowchart TD
    A[Hello] --> B[Mermaid]
`
          )
          .then((renderResult) => {
            if (this.nodeRenderElement) {
              this.nodeRenderElement.innerHTML = renderResult.svg;
            }

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
      <div class="mermaid  w-full h-full p-4 border-4 border-slate-400 border-solid rounded flex items-center justify-center"></div>
    ); //w-min h-min
  };
}
