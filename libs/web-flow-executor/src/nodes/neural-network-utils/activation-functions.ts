function reluDeriviate(x: number) {
  return x > 0 ? 1 : 0;
}
function sigmoidDeriviate(x: number) {
  return x * (1 - x);
}

function softmax(logits: number[]): number[] {
  const maxLogit = Math.max(...logits);
  const expValues = logits.map((x) => Math.exp(x - maxLogit));
  const sumExp = expValues.reduce((a, b) => a + b, 0);
  return expValues.map((v) => v / sumExp);
}

function categoricalCrossentropy(yTrue: number[], yPred: number[]): number {
  const epsilon = 1e-9;
  return -yTrue.reduce(
    (sum, yi, i) => sum + yi * Math.log(yPred[i] + epsilon),
    0
  );
}

function categoricalCrossentropyDerivative(
  yTrue: number[],
  yPred: number[]
): number[] {
  return yPred.map((yp, i) => yp - yTrue[i]);
}

export type ActivationFunctionType = 'relu' | 'sigmoid' | 'softmax';
export function deriviateActivationFunction(
  activationType: ActivationFunctionType,
  x: number
) {
  if (activationType === 'relu') {
    return reluDeriviate(x);
  }
  if (activationType === 'softmax') {
    return x;
  }
  return sigmoidDeriviate(x);
}

function sigmoid(x: number) {
  return 1 / (1 + Math.exp(-x));
}

function relu(x: number) {
  return Math.max(0, x);
}
export function activationFunction(
  activationType: ActivationFunctionType,
  x: number,
  values: number[],
  outputIndex: number
) {
  if (activationType === 'relu') {
    return relu(x);
  }
  if (activationType === 'softmax') {
    return softmax(values)[outputIndex];
  }
  return sigmoid(x);
}
