export interface NodeWeightsBias {
  weights: number[];
  bias: number;
  count: 0;
}

export type NeuralNetworkLayerTrainingSample = Record<
  string,
  NodeWeightsBias[]
>;
