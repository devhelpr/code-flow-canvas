import {
  ThumbConnectionType,
  ThumbType,
} from '@devhelpr/visual-programming-system';
import {
  InitialValues,
  NodeTask,
  NodeTaskFactory,
} from '../node-task-registry';
import { visualNodeFactory } from '../node-task-registry/createRectNode';
import { GLNodeInfo } from '../types/gl-node-info';
import { registerGLSLFunction } from './custom-glsl-functions-registry';

const fieldName = 'palette';
const labelName = 'Palette';
const nodeName = 'palette';
const familyName = 'flow-canvas';
const thumbConstraint = 'value';
const thumbs = [
  {
    thumbType: ThumbType.StartConnectorCenter,
    thumbIndex: 0,
    connectionType: ThumbConnectionType.start,
    color: 'white',
    label: ' ',
    thumbConstraint: 'vec3',
    maxConnections: -1,
    prefixLabel: 'vector3',
  },
  {
    thumbType: ThumbType.EndConnectorLeft,
    thumbIndex: 0,
    connectionType: ThumbConnectionType.end,
    color: 'white',
    label: ' ',

    name: 'index',
    thumbConstraint: thumbConstraint,
    prefixLabel: 'index',
  },
  {
    thumbType: ThumbType.EndConnectorLeft,
    thumbIndex: 1,
    connectionType: ThumbConnectionType.end,
    color: 'white',
    label: ' ',

    name: 'palette',
    thumbConstraint: thumbConstraint,
    prefixLabel: 'palette',
  },
];

registerGLSLFunction(
  nodeName,
  `vec3 palete( in float t, in vec3 a, in vec3 b, in vec3 c, in vec3 d ){
    return a + b*cos( 6.28318*(c*t+d) );  
  }

  vec3 palete2(float t) {
    vec3 a = vec3(0.5, 0.5, 0.5);
    vec3 b = vec3(0.5, 0.5, 0.5);
    vec3 c = vec3(1.0, 1.0, 1.0);
    vec3 d = vec3(0.263,0.416,0.557);

    return a + b*cos( 6.28318*(c*t+d) );
  }

  vec3 chooseColor(float paleteOffset) {
    return palete(paleteOffset, vec3(0.5,0.5,0.5), vec3(0.5,0.5,0.5), vec3(2.0,1.0,0.0), vec3(0.5,0.20,0.25));
  }

  vec3 chooseColor2(float paleteOffset) {
    return palete(paleteOffset, vec3(0.5,0.5,0.5), vec3(0.5,0.5,0.5), vec3(1.0,1.0,1.0), vec3(0.0,0.33,0.67));
  }

  vec3 chooseColor3(float paleteOffset) {
    return palete(paleteOffset, vec3(0.5,0.5,0.5), vec3(0.5,0.5,0.5), vec3(1.0,1.0,1.0), vec3(0.0,0.1,0.2));
  }
  vec3 chooseColor4(float paleteOffset) {
    return palete(paleteOffset, vec3(0.5,0.5,0.5), vec3(0.5,0.5,0.5), vec3(1.0,1.0,1.0), vec3(0.3,0.2,0.2));
  }
  vec3 chooseColor5(float paleteOffset) {
    return palete(paleteOffset, vec3(0.5,0.5,0.5), vec3(0.5,0.5,0.5), vec3(1.0,1.0,0.5), vec3(0.8,0.9,0.3));
  }
  vec3 chooseColor6(float paleteOffset) {
    return palete(paleteOffset, vec3(0.5,0.5,0.5), vec3(0.5,0.5,0.5), vec3(1.0,0.7,0.4), vec3(0.0,0.15,0.2));
  }
  vec3 chooseColor7(float paleteOffset) {
    return palete(paleteOffset, vec3(0.8,0.5,0.4), vec3(0.2,0.4,0.2), vec3(2.0,1.0,1.0), vec3(0.0,0.25,0.25));
  }
  vec3 choosePalete(float paleteOffset , float paleteType) {
    if (paleteType == 1.0) {
      return chooseColor(paleteOffset);
    }
    if (paleteType == 2.0) {
      return chooseColor2(paleteOffset);
    }
    if (paleteType == 3.0) {
      return chooseColor3(paleteOffset);
    }
    if (paleteType == 4.0) {
      return chooseColor4(paleteOffset);
    }
    if (paleteType == 5.0) {
      return chooseColor5(paleteOffset);
    }
    if (paleteType == 6.0) {
      return chooseColor6(paleteOffset);
    }
    if (paleteType == 7.0) {
      return chooseColor7(paleteOffset);
    }
    return palete2(paleteOffset);

  }
  `
);

export const getPaletteNode: NodeTaskFactory<GLNodeInfo> = (
  _updated: () => void
): NodeTask<GLNodeInfo> => {
  const initializeCompute = () => {
    return;
  };
  const compute = (input: string, _loopIndex?: number, payload?: any) => {
    const value = payload?.['index'];
    const palete = payload?.['palette'];
    return {
      result: `choosePalete(${value},${palete})`,
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
    (_nodeInstance) => {
      //
    },
    {
      hasTitlebar: false,
    }
  );
};
