export const ocif = () => {
  return true;
};

export const ocifSchema = 'https://canvasprotocol.org/ocif/';
export const ocifVersion = '0.3';
export const ocifRelationEdge = '@ocif/rel/edge';
export const ocifRelationGroup = '@ocif/rel/group';

export const ocifArrow = '@ocif/node/arrow';

export const ocifToCodeFlowCanvas: Record<string, string> = {
  '@ocif/node/rect': 'rect-node',
  '@ocif/node/oval': 'oval-node',
};

export type OCIFNode = {
  id: string;
  position?: number[];
  size?: number[];
  data?: {
    [key: string]: any;
  }[];
  resource?: string;
};

export type OCIFEdge = {
  id: string;
  data: {
    type: typeof ocifRelationEdge;
    directed?: boolean;
    start: string;
    end: string;
  }[];
};
export type OCIFRelation = OCIFGroup | OCIFEdge;

export type OCIFGroup = {
  id: string;
  data: {
    type: typeof ocifRelationGroup;
    members: Array<string>;
  }[];
};
export type OCWGFile = {
  ocif: string;
  nodes: OCIFNode[];
  relations: OCIFRelation[];
  resources: any[];
  schemas: any[];
};
