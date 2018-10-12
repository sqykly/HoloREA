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
  return true;
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
  return true;
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
    text: text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/[\r\n]/g, "&br;"),
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

// Apparently query() doesn't query the public DHT, so we need a list of links
// All the links are stored under the key of the App DNA hash, since that is
// the only hash scoped to the whole app.  In the future, will need to change
// it so that the links entries represent a room.
// This function gives a warning message during tests: DHT query with no peers in routing table
function postMessage(msg) {
  // which of these is failing...
  var msgHash = makeHash("Message", msg), // Changing this one unsurprisingly causes "unclean post"
    cleanedHash = makeHash("Cleaned", msgHash),
    posted = {hash: msgHash};

  // Cleaned hashes are stored as hashes of hashes.
  if (get(cleanedHash) === HC.HashNotFound) {
    posted.error = "unclean post";
  } else if (commit("Message", msg) !== msgHash) {
    posted.error = "Message validation failed";
  } else if (typeof commit("Posted", {Links: [{Base: App.DNA.Hash, Link: msgHash, Tag: "posted"}]}) != "string") {
    posted.error = "Posted validation failed";
  }

  return posted;

}

function receiveMessages(params) {
  var after = params && params.after,
    all = getLinks(App.DNA.Hash, "posted", {Load: true}).map(function (link) {
      return link.Entry;
    }),
    wanted;

  if (!after) {
    after = 0;
  } else if (typeof after == "string") {
    after = parseInt(after) || 0;
  }

  wanted = all.filter(function (entry) {
    return entry.time > after;
  });
  wanted.sort(function (a, b) {
    return b.time - a.time;
  });

  return {
    messages: wanted.map(function (entry) {
      // fixed the argument of replace; it has to be a regex in order to replace more that one match
      return (entry.text || "").replace(/&br;/g, "<br/>");
    }),
    // empty is a bool I'll use to avoid regex in tests.
    empty: !wanted.length,
    last: wanted.length && wanted[wanted.length - 1].time || after
  };
}

// --hacks-- (remove after testing)

// checks out the Cleaned status on a message
function isClean(msg) {
  var msgHash = makeHash("Message", msg),
    cleanHash = makeHash("Cleaned", msgHash);

  return {
    message: {
      hash: msgHash,
      value: msg
    },
    cleaned: {
      hash: cleanHash,
      value: get(cleanHash)
    }
  };
}

// check out all the links
function allPosted(dontCare) {
  return getLinks(App.DNA.Hash, "posted", {Load: true});
}
