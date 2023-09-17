export const replaceValues = (
  content: string,
  payload: any,
  keepUnknownFields = false
) => {
  let resultContent = content;
  const matches = resultContent.match(/{.+?}/g);
  if (matches) {
    matches.map((match) => {
      const variableName = match.slice(1, -1);
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
