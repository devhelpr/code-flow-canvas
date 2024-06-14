const glslRegistry: Record<string, string> = {};
export const registerGLSLFunction = (name: string, func: string) => {
  glslRegistry[name] = func;
};
export const getGLSLFunction = (name: string) => {
  return glslRegistry[name];
};
export const getGLSLFunctions = () => {
  return glslRegistry;
};
