export default (str: string) => str.trim().replace(
  /([-_][a-z])/g,
  (group) => group.toUpperCase()
                  .replace('-', '')
                  .replace('_', '')
);
