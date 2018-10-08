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
  return entryType === "Message" || entryType === "Cleaned";
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
    time = msg.time,
    hash;

  if (typeof time == "string") {
    time = parseInt(time);
  } else if (!time) {
    time = Date.now();
  }

  msg = {
    text: text.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;").replace(/[\r\n]/, "&br;"),
    time: time
  };

  hash = makeHash("Message", msg);
  commit("Cleaned", hash);
  return msg;
}

// --Zome public code--

function createMessage(msg) {
  // Did the documentation lie to me?  I don't need to stringify?
  return cleanMessage(msg);
  //JSON.stringify(cleanMessage(msg));
}

function postMessage(msg) {
  var hash = makeHash("Message", msg);

  // Cleaned hashes are stored as hashes of hashes.
  if (get(makeHash("Cleaned", hash)) !== HC.HashNotFound) {
    return commit("Message", msg);
  }

}

function receiveMessages(params) {
  var after = params && params.after || 0,
    all = query({
      Constrain: {EntryTypes: ["Message"]},
      Return: {
        Entries: true
      }
    }),
    wanted = all.filter(function (entry) {
      return entry.time > after;
    }).sort(function (a, b) {
      return b.time - a.time;
    });

  return {
    messages: wanted.map(function (entry) {
      return (entry.text || "").replace("&br;", "<br/>");
    }),
    last: wanted.length && wanted[wanted.length - 1].time || after
  };
}
