
import zomes from "./lib/zomes.js";

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

function addJson(obj, el = $(`#chat-text`)) {
  if (typeof obj === `string`) {
    obj = JSON.parse(obj);
  }

}



function addCall(pro) {
  let id = `fn-${Date.now()}`;
  $(`<p>`).attr({id}).addClass(`fn-call`)
    .append($(`<div>`).addClass(`function`))
    .append(
      $(`<div>`).addClass(`args`).append($(`<span>`).text(`argument`).addClass(`arg-label`))
    )
    .append(
      $(`<div>`).addClass(`return`).append($(`<span>`).text(`=>`).addClass(`ret-label`))
    )
  .appendTo(`#chat-text`);
  let argVal;
  let retVal;

  pro.done((result) => {
    retVal = result;
    addJson(result, $(`p#${id} .return`));
  }).fail((e) => {
    retVal = e;
    $(`p#${id} .ret-label`).addClass(`panic`).text(`FAILED: ${e}`);
    panic(e);
  });

  return {
    name(n) {
      $(`p#${id} .function`).text(n);
      return this;
    },
    args(obj) {
      argVal = obj;
      addJson(obj, $(`p#${id} .args`));
      return this;
    }
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

function hijackZome(name, zome) {
  function hijack(fnName) {
    const fn = zome[fnName];

    function hijacked(arg) {
      addCall(fn(arg)).name(`${name}.${fnName}`).args(arg);
    }
    hijacked.revert = () => zome[fnName] = fn;

    zome[fnName] = hijacked;
  }

  for (let fn of Object.keys(zome)) hijack(fn);
}

for (let zome of Object.keys(zomes)) {
  hijackZome(zome, zomes[zome]);
}

export {agents, events, resources} from zomes;
export {send}
