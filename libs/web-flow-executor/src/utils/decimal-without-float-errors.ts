export function toDecimalWithoutFloatErrors(value: number) {
  return parseFloat(value.toFixed(15));
}
