export const addSlashes = (str: string) => {
  return str
  .replace(/\\/g, '\\\\')
  .replace(/'/g, '\\\'')
  .replace(/"/g, '\\"')
  .replace(/`/g, '\\`');
};
