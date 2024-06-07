/*
  tldraw format notes:
  - big list of objects
  - each object has a type and typename
  - nodes need a parent (can be page:page or a parentId pointing to another node)
  - custom data can be added to the meta property
  - the node id has to include the type .. "shape:...."

*/
export interface TLDrawNodeCore {
  id: string;
  typeName: string;
}

export type TLDrawNode = TLDrawNodeCore & Record<string, any>;

export type TLDrawShapeNode = TLDrawNode & {
  parentId: string;
  meta: any;
  props: any;
  x: number;
  y: number;
  index: string;
};
export type TLDrawGroupNode = TLDrawNode & {
  x: number;
  y: number;
  index: string;
};

export interface TlDrawFile {
  tldrawFileFormatVersion: number;
  schema: object;
  records: TLDrawNode[];
}
