import {
  compileExpressionAsInfo,
  runExpression,
} from '@devhelpr/expression-compiler';

export const replaceExpressionScript = (
  content: string,
  payload: Record<string, string> = {},
  _keepUnknownFields = false
) => {
  let resultContent = content;
  try {
    const matches = resultContent.match(/{{[\s\S]+?}}/gm);
    if (matches) {
      matches.map((match) => {
        const expression = match.slice(2, -2);
        const info = compileExpressionAsInfo(expression);
        const expressionFunction = (
          new Function('payload', `${info.script}`) as unknown as (
            payload?: object
          ) => any
        ).bind(info.bindings);
        try {
          const result = runExpression(
            expressionFunction,
            payload,
            true,
            info.payloadProperties
          );
          if (result !== false && result !== undefined) {
            const value = result.toString();
            // if (!!keepUnknownFields && value === undefined) {
            //   value = match;
            // }
            if (match.substring(0, 2) == '{{') {
              resultContent = resultContent.replace(match, value);
            } else {
              const allOccurancesOfMatchRegex = new RegExp(match, 'gm');
              resultContent = resultContent.replace(
                allOccurancesOfMatchRegex,
                value
              );
            }
          } else {
            if (match.substring(0, 2) == '{{') {
              resultContent = resultContent.replace(match, '');
            } else {
              const allOccurancesOfMatchRegex = new RegExp(match, 'gm');
              resultContent = resultContent.replace(
                allOccurancesOfMatchRegex,
                ''
              );
            }
          }
        } catch (error) {
          console.error('replaceExpressionScript error', error);

          if (match.substring(0, 2) == '{{') {
            resultContent = resultContent.replace(match, '');
          } else {
            const allOccurancesOfMatchRegex = new RegExp(match, 'gm');
            resultContent = resultContent.replace(
              allOccurancesOfMatchRegex,
              ''
            );
          }
        }
      });
    }
  } catch (error) {
    console.error('replaceExpressionScript error', error);
  }
  return resultContent;
};

/*

*/
/**
 * Creates structured expressions markup by replacing expressions in the content with unique identifiers.
 * @param content - The content string containing expressions to be replaced.
 * @returns An object containing the expressions and the updated markup.
 */
export const createStructuredExpressionsMarkup = (content: string) => {
  let resultContent = content;
  const scriptList: Record<string, object> = {};
  try {
    const matches = resultContent.match(/{{[\s\S]+?}}/gm);
    if (matches) {
      matches.map((match) => {
        const expression = match.slice(2, -2);
        const info = compileExpressionAsInfo(expression);
        const expressionFunction = (
          new Function('payload', `${info.script}`) as unknown as (
            payload?: object
          ) => any
        ).bind(info.bindings);
        try {
          const value = crypto.randomUUID();
          if (match.substring(0, 2) == '{{') {
            resultContent = resultContent.replace(match, `[${value}]`);
          } else {
            const allOccurancesOfMatchRegex = new RegExp(match, 'gm');
            resultContent = resultContent.replace(
              allOccurancesOfMatchRegex,
              `[${value}]`
            );
          }
          scriptList[value] = {
            script: expression,
            expressionFunction,
          };
        } catch (error) {
          console.error('replaceExpressionScript error', error);

          if (match.substring(0, 2) == '{{') {
            resultContent = resultContent.replace(match, '');
          } else {
            const allOccurancesOfMatchRegex = new RegExp(match, 'gm');
            resultContent = resultContent.replace(
              allOccurancesOfMatchRegex,
              ''
            );
          }
        }
      });
    }
  } catch (error) {
    console.error('replaceExpressionScript error', error);
  }
  return {
    expressions: scriptList,
    markup: resultContent,
  };
};
