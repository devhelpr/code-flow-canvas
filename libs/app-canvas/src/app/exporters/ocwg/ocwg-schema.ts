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

export type OCWGRelation = {
  id: string;
  schema: string;
  schema_version: string;
  name: string;
  properties?: {
    [key: string]: any;
  };
};
export type OCWGFile = {
  schema_version: string;
  nodes: Record<string, OCWGNode>;
  relations: Record<string, OCWGRelation>;
  schemas: {
    [key: string]: any;
  };
};
