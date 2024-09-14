import {
  InitialValues,
  NodeTask,
  ThumbConnectionType,
  ThumbType,
  visualNodeFactory,
  IConnectionNodeComponent,
  FormFieldType,
  createJSXElement,
  FlowCanvas,
} from '@devhelpr/visual-programming-system';
import { NodeInfo } from '../types/node-info';
import { IRectNodeComponent } from '../../../visual-programming-system/src';
import { RunCounter } from '../follow-path/run-counter';
import { getRunIndex, runNode } from '../flow-engine/flow-engine';

const fieldName = 'neural-bias-node';
const labelName = 'Neural bias Node';
export const nodeName = 'neural-bias-node';
const familyName = 'flow-canvas';
const thumbs = [
  {
    thumbType: ThumbType.Center,
    thumbIndex: 0,
    connectionType: ThumbConnectionType.start,
    color: 'white',
    label: ' ',
    maxConnections: 1,
  },
];

export const getNeuralBiasNode =
  (
    _createRunCounterContext: (
      isRunViaRunButton: boolean,
      shouldResetConnectionSlider: boolean
    ) => RunCounter
  ) =>
  (_updated: () => void): NodeTask<any> => {
    let nodeComponent: IRectNodeComponent<NodeInfo> | undefined = undefined;
    let canvasApp: FlowCanvas<NodeInfo> | undefined = undefined;
    let currentRunCounter: RunCounter | undefined;
    const initializeCompute = () => {
      //
    };

    const Text = () => <div class="neural-node-value">Bias</div>;

    const compute = (
      _input: string,
      _loopIndex?: number,
      _payload?: any,
      _thumbName?: string,
      _scopeId?: string,
      runCounter?: RunCounter,
      _inputConnection?: IConnectionNodeComponent<NodeInfo>
    ) => {
      currentRunCounter = runCounter;
      return {
        result: 1,
        output: 1,
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
      100,
      100,
      thumbs,
      (_values?: InitialValues) => {
        return [];
      },
      (nodeInstance) => {
        canvasApp = nodeInstance.contextInstance;
        nodeComponent = nodeInstance.node as IRectNodeComponent<NodeInfo>;
        nodeComponent.nodeInfo = nodeComponent.nodeInfo || {};
        nodeComponent.nodeInfo.isUINode = true;
        nodeComponent.nodeInfo.outputConnectionInfo = {
          text: 'Weight',
          fieldName: 'weight',
          form: [
            {
              fieldType: FormFieldType.Slider,
              fieldName: 'weight',
              label: 'Weight',
              value: 0,
              min: -1,
              max: 1,
              step: 0.01,
            },
          ],
          onChanged: () => {
            if (!nodeComponent || !canvasApp) {
              return;
            }
            runNode(
              nodeComponent,
              canvasApp,
              () => {
                //
              },
              '',
              undefined,
              undefined,
              getRunIndex(),
              undefined,
              undefined,
              currentRunCounter, //createRunCounterContext(false, false),
              false,
              {
                trigger: true,
              }
            );
          },
        };
        if (!nodeComponent.domElement) {
          return;
        }
      },
      {
        hasTitlebar: false,
        category: 'flow-control',
        hideTitle: true,
        isRectThumb: true,
        isCircleRectThumb: true,
        rectThumbWithStraightConnections: true,
        hasStaticWidthHeight: true,
        backgroundColorClassName: 'bg-slate-400',
        textColorClassName: 'text-black',
      },
      <Text />
    );
  };
