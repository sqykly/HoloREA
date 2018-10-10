
// we're going to use jQuery as $
// This can be ES6 at least.

function zome(name, fns) {

  function send(fnName, data) {
    // all HC functions take and return the same type: either string or json.
    let t;
    switch (typeof data) {

      case "string":
        t = "text";
      break;

      case "object":
        t = "json";
      break;

      default:
      t = "json";
      data = JSON.stringify(data);

    }

    return $.post(`fn/${name}/${fnName}`, data, undefined, t);
  }

  const zomeObj = {};

  for (let fn of fns) {
    zomeObj[fn] = (arg) => send(fn, arg);
  }

  return zomeObj;
}

const chatter = zome(`chatter`, [`createMessage`, `postMessage`, `receiveMessages`]);

let lastBeat = 0,
  heartbeatTime = 1000,
  heartbeatHandle;


function stop() {
  if (heartbeatHandle !== undefined) {
    clearTimeout(heartbeatHandle);
    heartbeatHandle = undefined;
  }
}

function start() {
  stop();
  heartbeatHandle = setTimeout(heartbeat, heartbeatTime);
}

function panic(e) {
  $(`<p>`).text(``+e).addClass(`panic`).appendTo(`#chat-text`);
  stop();
  $(`#send-button`).remove();
}

function pause(waitFor) {

  let r;

  if (typeof waitFor == `function`) {

    stop();
    try {
      r = waitFor();
      start();
    } catch (e) {
      panic(e);
      r = e;
    }

  } else {

    stop();
    r = waitFor.then(start, panic);

  }

  return r;

}

function addMessages(messages) {
  for (let message of messages) {
    $(`<p>`).addClass(`message`).text(message).appendTo(`#chat-text`);
  }
}

function update() {
  return chatter.receiveMessages({after: lastBeat})
    .done( ({messages, last}) => {
      addMessages(messages);
      lastBeat = last;
    });
}

function heartbeat() {
  try {
    pause(update());
  } catch (e) {
    panic(e);
  }
}

function send() {
  const textInput = $(`#text-input`),
    text = textInput.val();

  textInput.val(``);

  pause(
    chatter.createMessage({text})
    .then((msg) => chatter.postMessage(msg))
    .then(update)
  );
}
