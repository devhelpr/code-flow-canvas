import { IThumb } from '@devhelpr/visual-programming-system';
import {
  InitialValues,
  NodeTask,
  NodeTaskFactory,
} from '../node-task-registry';
import { visualNodeFactory } from '../node-task-registry/createRectNode';
import { GLNodeInfo } from '../types/gl-node-info';
import { NodeInfo } from '../types/node-info';

const familyName = 'flow-canvas';

export const getCreateCompositionNode =
  (
    thumbs: IThumb[],
    compositionId: string,
    name: string,
    _getNodeFactory: (name: string) => NodeTaskFactory<NodeInfo>
  ): NodeTaskFactory<NodeInfo> =>
  (_updated: () => void): NodeTask<NodeInfo> => {
    const fieldName = 'composition';
    const labelName = `Composition ${name}`;
    const nodeName = `composition-${compositionId}`;
    //let canvasApp: CanvasAppInstance<NodeInfo> | undefined = undefined;
    // let nodes: FlowNode<NodeInfo>[] = [];
    // let compositionThumbs: IThumb[] = [];
    //let composition: Composition<NodeInfo> | undefined = undefined;

    const initializeCompute = () => {
      console.log('initializeCompute composition');
      //composition = undefined;
      return;
    };
    const compute = (input: string) => {
      return {
        result: input,
        output: input,
        followPath: undefined,
      };
    };

    return visualNodeFactory(
      nodeName,
      labelName,
      familyName,
      fieldName,
      compute,
      initializeCompute,
      false,
      200,
      100,
      thumbs,
      (_values?: InitialValues) => {
        return [];
      },
      (nodeInstance) => {
        //canvasApp = nodeInstance.contextInstance;
        if (nodeInstance.node?.nodeInfo) {
          (nodeInstance.node.nodeInfo as GLNodeInfo).isComposition = true;
          (nodeInstance.node.nodeInfo as GLNodeInfo).compositionId =
            compositionId;
        }
      },
      {
        hasTitlebar: false,
        hideTitle: true,
        category: 'Compositions',
        backgroundColorClassName: 'bg-purple-500',
        textColorClassName: 'text-black',
      }
    );
  };
