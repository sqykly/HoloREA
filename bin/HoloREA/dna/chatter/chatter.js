/**
 * An intentionally silly and featureless chat.
 * @author David Hand
 */

// --Callbacks--

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

// --Zome private code--

function cleanMessage(msg) {
  var text = msg.text || "",
    time = msg.time || Date.now();

  return {
    text: text.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;").replace(/[\r\n]/, "&br;"),
    time: time
  };
}

// --Zome public code--

function createMessage(msg) {
  return JSON.stringify(cleanMessage(msg));
}

function postMessage(msg) {
  var hDirty = makeHash("Message", msg),
    hClean = makeHash("Message", cleanMessage(msg));

  if (hDirty === hClean) {
    return commit("Message", msg);
  } else {
    return JSON.stringify(cleanMessage(msg));
  }

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
    }).sort(function (a, b) {
      return b.time - a.time;
    });

  return JSON.stringify({
    messages: wanted.map(function (entry) {
      return (entry.text || "").replace("&br;", "<br/>");
    }),
    last: wanted.length && wanted[wanted.length - 1].time || after
  });
}
