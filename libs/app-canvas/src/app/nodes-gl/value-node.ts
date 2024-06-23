import {
  FormFieldType,
  IRectNodeComponent,
  InitialValues,
  NodeTask,
  ThumbConnectionType,
  ThumbType,
  visualNodeFactory,
} from '@devhelpr/visual-programming-system';
import { GLNodeInfo } from '../types/gl-node-info';

// TODO : add wrapper function for injecting "add to history" function

// (
//   _animatePath: AnimatePathFunction<NodeInfo>,
//   animatePathFromThumb: AnimatePathFromThumbFunction<NodeInfo>
// ) =>
// (updated: () => void): NodeTask<NodeInfo> =>

export const getValueNode =
  (updateUniformValue: (id: string, value: string) => void) =>
  (
    updated: (
      shouldClearExecutionHistory?: boolean,
      isStoreOnly?: boolean
    ) => void
  ): NodeTask<GLNodeInfo> => {
    let node: IRectNodeComponent<GLNodeInfo>;
    const initializeCompute = () => {
      return;
    };
    const compute = (
      input: string,
      _loopIndex?: number,
      payload?: any,
      _thumbName?: string,
      _thumbIdentifierWithinNode?: string,
      isInComposition?: boolean
    ) => {
      let value = isInComposition
        ? parseFloat(
            (node || payload)?.nodeInfo?.formValues?.['value'] ?? 0
          ).toString()
        : `value_${node.id.replace(/-/g, '')}`;

      if (isInComposition && value.indexOf('.') < 0) {
        value = `${value}.0`;
      }
      return {
        result: `${value}`,
        output: input,
        followPath: undefined,
      };
    };

    return visualNodeFactory(
      'value-node',
      'Value',
      'flow-canvas',
      'value',
      compute,
      initializeCompute,
      false,
      200,
      100,
      [
        {
          thumbType: ThumbType.StartConnectorCenter,
          thumbIndex: 0,
          connectionType: ThumbConnectionType.start,
          color: 'white',
          label: ' ',
          thumbConstraint: 'value',
          maxConnections: -1,
        },
      ],
      (values?: InitialValues) => {
        const formElements = [
          {
            fieldType: FormFieldType.Slider,
            fieldName: 'value',
            value: values?.['value'] ?? '',
            min: -1.0,
            max: 1.0,
            step: 0.01,
            settings: {
              showLabel: false,
            },
            onChange: (value: string) => {
              if (!node.nodeInfo) {
                return;
              }

              // in the requestAnimationFrame for each slider-value, in each frame
              // the values are read directly from the formValues of the node using a direct reference
              node.nodeInfo.formValues = {
                ...node.nodeInfo.formValues,
                ['value']: value,
              };

              // todo : figure how to explicitly check if a node is in a composition
              // .. although currently there are no uniforms created for nodes
              // in compositions... so the the below code doesn't do anything (uniform can not be found)
              updateUniformValue(node.id, value);
              if (updated) {
                updated(undefined, true);
              }
            },
          },
        ];
        return formElements;
      },
      (nodeInstance) => {
        node = nodeInstance.node as IRectNodeComponent<GLNodeInfo>;
      },
      {
        category: 'UI',
      }
    );
  };
