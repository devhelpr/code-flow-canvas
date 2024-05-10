import { IThumb } from '@devhelpr/visual-programming-system';

export interface ITasklistItem {
  label: string;
  nodeType: string;
  category: string;
  thumbs: IThumb[];
}
