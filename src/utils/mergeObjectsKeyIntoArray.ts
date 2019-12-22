
   export default (all: any, objectKey: any) => {
    const mapped: any = {};
    for (const obj of all) {
        if (!mapped[obj.id]) {
          if (!(obj[objectKey] instanceof Array)) {
            obj[objectKey] = [
              obj[objectKey]
            ];
          }
          mapped[obj.id] = obj;
          continue;
        }
        mapped[obj.id][objectKey].push(obj[objectKey]);
    }
    return Object.values(mapped);
  };
