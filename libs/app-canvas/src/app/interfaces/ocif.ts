export interface OCIFRelataionData {
  type: string;
}

export interface OCIFEdgeRelationExtension extends OCIFRelataionData {
  type: '@ocwg/rel/edge';
  node: string;
  start: string;
  end: string;
  rel: string;
}

export interface OCIFRelation {
  id: string;
  data: Array<OCIFRelataionData>;
}

// export interface OCIFEdgeRelation {
//   id: string;

//   type: '@ocwg/rel/edge';
//   start: string;
//   end: string;
//   rel: string;
//   node: string;
// }

export interface OCIFExtension {
  type: string;
}

export interface OCIFNode {
  id: string;
  position?: number[];
  size?: number[];
  data?: OCIFExtension[];
}
