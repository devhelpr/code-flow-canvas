function reluDeriviate(x: number) {
  return x > 0 ? 1 : 0;
}
function sigmoidDeriviate(x: number) {
  return x * (1 - x);
}

export type ActivationFunctionType = 'relu' | 'sigmoid';
export function deriviateActivationFunction(
  activationType: ActivationFunctionType,
  x: number
) {
  if (activationType === 'relu') {
    return reluDeriviate(x);
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
  x: number
) {
  if (activationType === 'relu') {
    return relu(x);
  }
  return sigmoid(x);
}
