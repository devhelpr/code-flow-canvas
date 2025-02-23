export interface OCIFRelataionData {
  type: string;
}

export interface OCIFRelation {
  id: string;
  data: Array<OCIFRelataionData>;
}

export interface OCIFEdgeRelation {
  id: string;

  type: '@ocwg/rel/edge';
  start: string;
  end: string;
  rel: string;
  node: string;
}
