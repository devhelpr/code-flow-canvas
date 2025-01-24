export type OCWGNode = {
  id: string;
  position?: number[];
  size?: number[];
  data?: {
    [key: string]: any;
  }[];
  resource?: string;
};

export type OCWGEdge = {
  type: '@ocwg/rel/edge';
  id: string;
  directed?: boolean;
  from: string;
  to: string;
};
export type OCWGRelation = OCWGGroup | OCWGEdge;

export type OCWGGroup = {
  type: '@ocwg/rel/group';
  members: Array<string>;
  id: string;
};
export type OCWGFile = {
  ocif: string;
  nodes: OCWGNode[];
  relations: OCWGRelation[];
  resources: any[];
  schemas: any[];
};
