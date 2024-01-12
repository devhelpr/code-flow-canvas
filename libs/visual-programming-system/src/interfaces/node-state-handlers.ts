export type GetNodeStatedHandler = () => {
  data: any;
  id: string;
};

export type SetNodeStatedHandler = (id: string, data: any) => void;
