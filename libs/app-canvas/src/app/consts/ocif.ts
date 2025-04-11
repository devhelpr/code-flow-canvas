export const ocifSchema = 'https://canvasprotocol.org/ocif/';
export const ocifVersion = '0.4';
export const ocifRelationEdge = '@ocif/rel/edge';
export const ocifRelationGroup = '@ocif/rel/group';

export const ocifArrow = '@ocif/node/arrow';

export const ocifToCodeFlowCanvas: Record<string, string> = {
  '@ocif/node/rect': 'rect-node',
  '@ocif/node/oval': 'oval-node',
};

export const codeFlowCanvasToOcif: Record<string, string> = {
  'rect-node': '@ocif/node/rect',
  'oval-node': '@ocif/node/oval',
};
