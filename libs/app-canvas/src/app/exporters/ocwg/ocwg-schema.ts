export type OCWGNode = {
  id: string;
  schema: string;
  schema_version: string;
  x: number;
  y: number;
  z?: number;
  properties?: {
    [key: string]: any;
  };
  fallback?: string;
};

export type OCWGEdge = {
  id: string;
  name: string;
  schema: '@ocwg/edge';
  schema_version: '1.0';
  from: string;
  to: string;
};
export type OCWGRelation = OCWGSet | OCWGEdge;

export type OCWGSet = {
  schema: '@ocwg/set';
  schema_version: string;
  members: Array<string>;
  name: string;
};
export type OCWGFile = {
  schema_version: string;
  nodes: OCWGNode[];
  relations: OCWGRelation[];
  schemas: {
    [key: string]: any;
  };
};
