import { ocifRelationEdge, ocifRelationGroup } from '../../consts/ocif';

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
  id: string;
  data: {
    type: typeof ocifRelationEdge;
    directed?: boolean;
    start: string;
    end: string;
  }[];
};
export type OCWGRelation = OCWGGroup | OCWGEdge;

export type OCWGGroup = {
  id: string;
  data: {
    type: typeof ocifRelationGroup;
    members: Array<string>;
  }[];
};
export type OCWGFile = {
  ocif: string;
  nodes: OCWGNode[];
  relations: OCWGRelation[];
  resources: any[];
  schemas: any[];
};
