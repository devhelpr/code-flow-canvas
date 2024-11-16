export const getFormattedValue = (
  value: any,
  decimalCount: number,
  append: string
) => {
  const appendText = `${append ? ` ${append}` : ''}`;
  if (typeof value === 'number') {
    return `${(value as number).toFixed(decimalCount)}${appendText}`;
  } else if (typeof value === 'string') {
    const helper = parseFloat(value);
    if (!isNaN(helper)) {
      return `${helper.toFixed(decimalCount)}${appendText}`;
    }
  } else {
    return `${(value as any).toString()}${appendText}`;
  }
  return '-';
};

export const getFormattedVariableValue = (
  value: any,
  decimalCount: number,
  append: string
) => {
  const appendText = `${append ? ` ${append}` : ''}`;
  if (typeof value === 'number') {
    return `${(value as number).toFixed(decimalCount)}${appendText}`;
  } else if (typeof value === 'string') {
    return `${value}${appendText}`;
  } else {
    return `${(value as any).toString()}${appendText}`;
  }
  return '-';
};
