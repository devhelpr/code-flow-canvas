// colors will be a mix between mainly css class names and hex values
// css class names will be used for the html elements and hex values for the svg elements if they
// need them directly

export interface Theme {
  name: string;
  background: string;
  backgroundAsHexColor: string; // used for background for the tranparent-path of connections to make them "transparent" when overlapping other connections
  nodeBackground: string;
  nodeText: string;
  nodeInversedBackground: string;
  nodeInversedText: string;
  nodeTitleBarBackground: string;
  nodeTitleBarText: string;
  compositionBackground: string;
  compositionText: string;
  connectionColor: string;
  arrowColor: string;
  thumbColor: string;
  selectNodeBorderColor: string;
  selectConnectionColor: string;
  selectThumbColor: string;
  compositionThumbInputNodeBackground: string;
  compositionThumbInputNodeText: string;
  compositionThumbOutputNodeBackground: string;
  compositionThumbOutputNodeText: string;
}
