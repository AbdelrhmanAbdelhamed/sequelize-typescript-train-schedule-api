
   export default (all: any, objectKeys: any) => {
    const mapped: any = {};
    let objectKey;
    for (const obj of all) {
        if (!mapped[obj.id]) {
          for(let i = 0; i < objectKeys.length; i++) {
            objectKey = objectKeys[i];
            if (!(obj[objectKey] instanceof Array)) {
              obj[objectKey] = [
                obj[objectKey]
              ];
            }
          }
          mapped[obj.id] = obj;
          continue;
        }
        for(let j = 0; j < objectKeys.length; j++) {
            objectKey = objectKeys[j];
            if(mapped[obj.id][objectKey].findIndex(item => item.id == obj[objectKey].id) == -1) {
              mapped[obj.id][objectKey].push(obj[objectKey]);
            }
          }
  }
    return Object.values(mapped);
  };
