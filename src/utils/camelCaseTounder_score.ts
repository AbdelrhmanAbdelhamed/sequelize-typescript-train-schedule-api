export default (str: string) => str.trim().split(/(?=[A-Z])/).join('_').toLowerCase();
