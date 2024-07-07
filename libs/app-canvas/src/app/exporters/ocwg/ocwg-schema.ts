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

export type OCWGSet = {
  schema: '@ocwg/set';
  schema_version: string;
  members: Array<string>;
  name: string;
};
export type OCWGFile = {
  schema_version: string;
  nodes: Record<string, OCWGNode>;
  relations: Record<string, OCWGSet>;
  schemas: {
    [key: string]: any;
  };
};
