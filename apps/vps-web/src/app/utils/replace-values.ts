export const replaceValues = (
  content: string,
  payload: any,
  keepUnknownFields = false
) => {
  let resultContent = content;
  const matches = resultContent.match(/{.+?}/g);
  if (matches) {
    matches.map((match) => {
      const matchValue = match.slice(1, -1);
      const splittedValues = matchValue.split(':');
      const variableName = splittedValues[0];
      let value = payload[variableName];
      if (!!keepUnknownFields && value === undefined) {
        value = match;
      }
      const allOccurancesOfMatchRegex = new RegExp(match, 'g');
      resultContent = resultContent.replace(allOccurancesOfMatchRegex, value);
    });
  }
  return resultContent;
};
