export type OCWGNode = {
  id: string;
  position?: number[];
  size?: number[];
  data?: {
    [key: string]: any;
  }[];
};

export type OCWGEdge = {
  type: '@ocwg/rel/edge';
  id: string;
  directed?: boolean;
  from: string;
  to: string;
};
export type OCWGRelation = OCWGSet | OCWGEdge;

export type OCWGSet = {
  type: '@ocwg/set';
  members: Array<string>;
  id: string;
};
export type OCWGFile = {
  ocif: string;
  nodes: OCWGNode[];
  relations: OCWGRelation[];
  resources: any[];
  schemas: {
    [key: string]: any;
  };
};
