/**
 * An intentionally silly and featureless chat.
 * @author David Hand
 */

function genesis() {
  // YAGNI
  return true;
}

function validateCommit(entryType, entry, header, pkg, sources) {
  // check against schema: YAGNI
  return entryType === "Message";
}

function validatePut(entryType, entry, header, pkg, sources) {
  // check for data sanity: YAGNI
  return validateCommit(entryType, entry, header, pkg, sources);
}

function validateMod(entryType, entry, header, replaces, pkg, sources) {
  // messages are immutable for now.
  return false;
}

function validateDel(entryType, hash, pkg, sources) {
  // messages are permanent for now
  return false;
}

function validateLink(entryType, hash, links, pkg, sources) {
  // there is no linking messages
  return false;
}

function validatePutPkg(entryType) {
  // don't care.
  return null;
}

function validateModPkg(entryType) {
  // can't happen, don't care
  return null;
}

function validateDelPkg(entryType) {
  // can't happen, don't care
  return null;
}

function validateLinkPkg(entryType) {
  // can't happen, don't care
  return null;
}

function createMessage(msg) {
  var text = msg.text || "";
  return {
    text: text.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;").replace(/[\r\n]/, "&br;"),
    time: Date.now()
  };
}

function postMessage(msg) {
  return commit("Message", msg);
}

function receiveMessages(params) {
  var after = params && params.after || 0,
    all = query({
      EntryTypes: ["Message"],
      Return: {
        Entries: true
      }
    }),
    wanted = all.filter(function (entry) {
      return entry.time > after;
    });

  return wanted.map(function (entry) {
    return (entry.text || "").replace("&br;", "<br/>");
  });
}
