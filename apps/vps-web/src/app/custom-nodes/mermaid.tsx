import {
  createJSXElement,
  FormField,
  IComputeResult,
  InitialValues,
  NodeTask,
  Rect,
  ThumbConnectionType,
  ThumbType,
  visualNodeFactory,
} from '@devhelpr/visual-programming-system';
import { NodeInfo } from '@devhelpr/web-flow-executor';
import mermaid from 'mermaid';

const MermaidImage = ({
  render,
}: {
  render: (element: HTMLElement) => void;
}) => {
  mermaid.initialize({
    startOnLoad: true,
  });

  return (
    <div
      class="mermaid w-min h-min p-4 border-4 border-slate-400 border-solid rounded"
      getElement={(element: HTMLElement) => {
        render(element);
      }}
    ></div>
  );
};

const fieldName = 'mermaid-input';
const nodeTitle = 'Mermaid diagram';
export const mermaidNodeName = 'mermaid-node';
const familyName = 'flow-canvas';
const thumbs = [
  {
    thumbType: ThumbType.StartConnectorCenter,
    thumbIndex: 0,
    connectionType: ThumbConnectionType.start,
    color: 'white',
    label: ' ',
    name: 'output',
    maxConnections: -1,
  },
  {
    thumbType: ThumbType.EndConnectorCenter,
    thumbIndex: 0,
    connectionType: ThumbConnectionType.end,
    color: 'white',
    label: ' ',
    name: 'input',
    maxConnections: 1,
  },
];

export const getMermaidNode =
  () =>
  // (): NodeTaskFactory<NodeInfo> =>
  (_updated: () => void): NodeTask<NodeInfo> => {
    //let node: IRectNodeComponent<NodeInfo>;
    let rect: Rect<NodeInfo> | undefined;

    let nodeRenderElement: HTMLElement | undefined = undefined;
    const initializeCompute = () => {
      return;
    };
    const computeAsync = (
      input: string,
      _loopIndex?: number,
      _payload?: any
    ) => {
      return new Promise<IComputeResult>((resolve) => {
        if (nodeRenderElement && input) {
          const mermaidDefintion = input
            .replaceAll('```mermaid', '')
            .replaceAll('```', '')
            .trim();
          mermaid
            .render('dynamic', mermaidDefintion)
            .then((renderResult) => {
              if (nodeRenderElement) {
                nodeRenderElement.innerHTML = renderResult.svg;
              }
              if (rect && rect.resize) {
                rect.resize(undefined, true, '.mermaid');
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
    const onRender = (element: HTMLElement) => {
      nodeRenderElement = element;
      const resizeObserver = new ResizeObserver(() => {
        if (rect && rect.resize) {
          rect.resize(undefined, true, '.mermaid');
        }
      });
      resizeObserver.observe(element);
    };
    return visualNodeFactory(
      mermaidNodeName,
      nodeTitle,
      familyName,
      fieldName,
      computeAsync,
      initializeCompute,
      false,
      200,
      100,
      thumbs,
      (_values?: InitialValues): FormField[] => {
        return [];
      },
      (nodeInstance) => {
        rect = nodeInstance.rect;
        //node = nodeInstance.node as IRectNodeComponent<NodeInfo>;
        if (rect && rect.resize) {
          rect.resize();
        }
      },
      {
        category: 'Diagrams',
        hasStaticWidthHeight: true,
        hasCustomStyling: true,
        customClassName: 'mermaid-node',
      },
      <MermaidImage render={onRender} />,
      true
    );
  };
