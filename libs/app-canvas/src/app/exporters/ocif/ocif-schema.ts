import { ocifRelationEdge, ocifRelationGroup } from '../../consts/ocif';

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
export type OCIFFile = {
  ocif: string;
  nodes: OCIFNode[];
  relations: OCIFRelation[];
  resources: any[];
  schemas: any[];
};
