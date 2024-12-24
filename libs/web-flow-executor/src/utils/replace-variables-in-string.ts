export const replaceVariablesInString = (
  content: string,
  payload: Record<string, string> = {}
) => {
  let resultContent = content;
  try {
    const matches = resultContent.match(/{{[\s\S]+?}}/gm);
    if (matches) {
      matches.map((match) => {
        const variableName = match.slice(2, -2);
        const info = payload[variableName];
        if (info) {
          resultContent = resultContent.replace(match, info);
        }
      });
    }
  } catch (error) {
    console.error('replaceVariablesInString error', error);
  }
  return resultContent;
};
