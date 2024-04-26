import { IRectNodeComponent } from '@devhelpr/visual-programming-system';
import { GLNodeInfo } from '../types/gl-node-info';
import { SerializedFlow } from '../storage/serialize-canvas';

export interface ShaderCompileHistory {
  type: 'shader' | 'value';
  shaderCode?: string;
  value?: number;
  valueUniformName?: string;
  nodes?: SerializedFlow;

  valueParameterUniform?: {
    uniform?: WebGLUniformLocation | null;
    id: string;
    uniformName: string;
    value: number;
    node: IRectNodeComponent<GLNodeInfo>;
  };

  valueParameterUniforms?: {
    uniform?: WebGLUniformLocation | null;
    id: string;
    uniformName: string;
    value: number;
    node: IRectNodeComponent<GLNodeInfo>;
  }[];
}
