import { IFlowCanvasBase } from '@devhelpr/visual-programming-system';
import { NodeInfo } from '../../types/node-info';

export const parseInput = (input: string, inputType: string) => {
  if (inputType === 'number') {
    return parseFloat(input) || 0;
  } else if (inputType === 'integer') {
    return parseInt(input) || 0;
  } else if (inputType === 'boolean') {
    return input === 'true' || input === '1' || Boolean(input) ? true : false;
  } else if (inputType === 'array') {
    return Array.isArray(input) ? input : [];
  } else {
    return (input ?? '').toString();
  }
};

export const getVariablePayloadInputUtils = (
  input: string,
  payload: any,
  inputType: string,
  currentValue: number,
  executionRunCounter: number,
  scopeId: string | undefined,
  canvasAppInstance: IFlowCanvasBase<NodeInfo> | undefined
) => {
  let inputAsString =
    typeof input === 'object' ? '' : parseInput(input, inputType);
  let inputAsObject = {};
  if (Array.isArray(input)) {
    if (inputType === 'array') {
      inputAsString = input;
    } else {
      inputAsString = input.map((item) =>
        parseInput(item, inputType)
      ) as unknown as string; // dirty hack
    }
  } else if (typeof input === 'object') {
    inputAsObject = input;
  }

  const payloadForExpression = {
    input: Array.isArray(input) ? input : inputAsString,
    currentValue: currentValue,
    value: currentValue,
    array: input,
    current: currentValue,
    last: currentValue,
    index: executionRunCounter ?? 0,
    runIteration: executionRunCounter ?? 0,
    random: Math.round(Math.random() * 100),
    ...payload,
    ...inputAsObject,
  };
  canvasAppInstance?.getVariableNames(scopeId).forEach((variableName) => {
    Object.defineProperties(payloadForExpression, {
      [variableName]: {
        get: () => {
          const getResult = canvasAppInstance?.getVariable(
            variableName,
            undefined,
            scopeId
          );
          return getResult;
        },
        set: (value) => {
          canvasAppInstance?.setVariable(variableName, value, scopeId);
        },
      },
    });
  });
  return payloadForExpression;
};
