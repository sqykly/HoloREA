function Zome(name, fnTypes) {
  function send(fnName, data) {
    // all HC functions take and return the same type: either string or json.
    return new Promise( (resolve, reject) => {
      let xhr = new XMLHttpRequest();
      xhr.open(`POST`, `fn/${name}/${fnName}`);
      xhr.responseType = `json`;
      xhr.overrideMimeType(`application/json`);

      xhr.onreadystatechange = () => {
        if (xhr.readyState === 4) {
          if (xhr.status === 200) {
            resolve(xhr.response);
          } else {
            reject(xhr.statusText);
          }
        }
      };

      xhr.send(data);
    });
  }

  for (let fn of fnTypes) {
    this[fn] = (arg) => send(fn, arg);
  }
}

const agents = new Zome(`agents`, [
  `createAgent`, `getOwnedResources`, `readAgents`
]);

const resources = new Zome(`resources`, [
  `createResourceClassification`, `createResource`, `getFixtures`,
  `getResourcesInClass`, `getAffectingEvents`, `affect`, `readResourceClasses`,
  `readResources`
]);

const events = new Zome(`events`, [
  `createEvent`, `createAction`, `createTransfer`, `createTransferClass`,
  `getFixtures`, `traceEvents`, `trackEvents`, `traceTransfers`, `trackTransfers`,
  `eventSubtotals`, `eventsStartedAfter`, `eventsStartedBefore`, `eventsEndedAfter`,
  `eventsEndedBefore`, `sortEvents`, `resourceCreationEvent`, `readEvents`,
  `readTransfers`, `readActions`, `readTransferClasses`
]);

export default {agents, resources, events};
