
import $ from "https://code.jquery.com/jquery-3.3.1.min.js";

const output = $(`#output`);
const input = $(`#input`);

function el(str) {
  const digest = /^<?([-_a-zA-Z]+)((?:\.[-_a-zA-Z0-9]+)*)(#[-_a-zA-Z0-9]*)?>?$/.exec(str);

  if (!digest) throw new TypeError(`invalid HTML element gist: ${str}`);

  let [dontCare, tag, classes, id] = digest;
  const attr = {};
  if (classes) {
    let them = classes.split('.');
    ([dontCare, ...them] = them);
    attr["class"] = them.join(' ');
  }
  if (id) {
    ([dontCare, id] = /^#(.*)$/.exec(id));
    attr.id = id;
  }
  return $(`<${tag}>`, attr);
}

function putJson(json) {
  if (json instanceof Array) {
    const ol = el(`<ol.array>`);
    for (let item of json) {
      el(`<li.item>`).append(putJson(item)).appendTo(ol);
    }
    return ol;
  } else if (typeof json === `object`) {
    const ul = el(`<ul.object>`);
    for (key of Object.keys(json)) {
      const li = el(`<li.property>`).appendTo(ul);
      el(`<span.key>`).text(`${key}: `).appendTo(li);
      li.append(putJson(json[key]));
    }
    return ul;
  } else if (typeof json === `string` && json.includes('<')) {
    return el(`<span.value>`).html(json);
  } else if (typeof json === `function`) {
    if (json.isHelp) {
      let it = el(`<p.help>`).text(json());
      if (json.details) {
        let deets = $(`<div>`).appendTo(it);
        json.details.forEach((det) => {
          $(`<a>`).appendTo(deets).text(det).attr({href: '#'}).click(function (ev) {
            ev.preventDefault();
            $(this).closest(`p.help`).after(putJson(json[det]));
          }).after($(`<span>`).text(` | `));
        });
      }
      return it;
    } else if (json.help) {
      return putJson(json.help);
    }
    return el(`<span.code>`).text(`${json.name || `function `}()`);
  } else {
    return el(`<span.value>`).text(JSON.stringify(json));
  }
}

function repl(code) {
  const div = el(`<p.command>`);
  output.children().first().before(div);
  const codeDiv = el(`<a.user>`)
    .append($(`<kbd>`).text(''+code))
    .attr({href: '#'})
    .click((ev) => {
      ev.preventDefault();
      input.val(code);
    })
  .appendTo(div);

  // tried to not eval with new Function, but that's eval anyway, just more complicated.
  let fn;
  if (typeof code === `string`) try {
    fn = () => eval(code);
  } catch (e) {
    codeDiv.addClass(`error`);
    div.addClass(`failed`);
    el(`<div.client.error-message>`)
      .append( el(`<div.client>`).text(`Failed to execute:`) )
      .append( el(`<div.js.error>`).text(''+e) )
    .appendTo(div);
    return false;
  } else if (typeof code === `function`) {
    fn = code;
  } else {
    fn = () => code;
  }

  let result;
  try {
    result = fn();
  } catch (e) {
    div.addClass(`fail`);
    codeDiv.addClass(`error`);
    el(`<div.client.error-message>`)
      .append( el(`<div.client>`).text(`While executing:`) )
      .append( el(`<div.js.error>`).text(''+e) )
    .appendTo(div);
    return false;
  }

  if (!result || !result.then) {
    el(`<div.client.response>`).append(putJson(result)).appendTo(div);
    return false;
  }

  const waiting = el(`<div.client.waiting>`).text(`Waiting for response...`).appendTo(div);
  div.addClass(`pending`);

  result.then((response) => {
    div.removeClass(`pending`).addClass(`complete`);

    if (typeof response === `string`) {
      response = JSON.parse(response);
    }

    const out = el(`<div.server.response>`).replaceAll(waiting);
    let tail;

    if (response && `error` in response) {

      let crud = response;
      tail = el(`<div.server.status-message.head>`).text(msg);
      if (!response.error) {
        tail.addClass(`ok`);
        div.addClass(`success`);
        tail.text(`ok`);
      } else {
        tail.addClass(`error`);
        div.addClass(`fail`);
        tail.append(
          el(`<div>`).text(`${response.error.name}: ${response.error.message}`)
        ).append(
          el(`<div>`).text(response.error.stack)
        );
      }
    }

    out.append(putJson(response));
    if (tail) out.append(tail);

  }, (e) => {
    div.removeClass(`pending`).addClass(`fail`);

    el(`<div.server.response.error>`).text(`Server error: ${e}`).replaceAll(waiting);
  });

  return false;
}

function deepAssign(dest, src, ...more) {
  for (let p of Object.keys(src)) {
    let v;
    if (typeof src[p] == `object`) {
      v = deepAssign(dest[p] || {}, src[p]);
    } else {
      v = src[p];
    }
    dest[p] = v;
  }

  if (more.length) {
    let [u, ...rest] = more;
    return deepAssign(dest, u, ...rest);
  } else {
    return dest;
  }
}

function h(val, details) {
  function help () {
    return val;
  }
  delete help.name;
  if (details) {
    deepAssign(help, details);
    help.details = Object.keys(details);
  }

  help.isHelp = true;
  return help;
}

const help = {};

/*
function Zome(name, fnTypes) {
  function send(fnName, data) {
    return new Promise((yes, no) => {
      const xhr = new XMLHttpRequest();
      xhr.open(`POST`, `fn/${name}/${fnName}`);
      xhr.responseType = `json`;
      xhr.overrideMimeType(`application/json`);
      xhr.onreadystatechange = () => {
        if (xhr.readyState !== 4) return;
        if (xhr.status !== 200) {
          no(`${xhr.status} ${xhr.statusText}`);
        } else {
          yes(xhr.response);
        }
      };
      xhr.send(JSON.stringify(data));
    });
  }

  for (let fn of fnTypes) {
    this[fn] = (arg) => send(fn, arg);
    this[fn].help = help[fn];
  }
}
*/
/*
const allMethods = [
  `createObject`, `createRepo`, `dump`, `createQuery`, `link`, `removeObject`,
  `removeLink`, `tags`, `hashes`, `data`, `removeAllQuery`, `reciprocal`,
  `predicate`, `singular`, `wtf`
];
const zome = new Zome(`repo`, allMethods);


const repoMethods = [
  `link`, `removeLink`, `createQuery`, `reciprocal`, `predicate`, `singular`,
  `dump`
];
zome.repo = new Zome(`repo`, repoMethods);

const queryMethods = [
  `removeAllQuery`, `tags`, `hashes`, `data`, `dump`
];
zome.query = new Zome(`repo`, queryMethods);

const globalMethods = [
  `createObject`, `createRepo`, `dump`, `createQuery`, `link`, `removeObject`,
  `removeLink`
];
zome.global = new Zome(`repo`, globalMethods);
*/

function helpOn(methods) {
  let obj = {};
  for (let key of methods) {
    obj[key] = help[key];
  }
  return obj;
}
/*
zome.global.help = h(`global has all the functions that either do not require an
  object to exist to work, or that can be applied to any object no matter what it
  is.`, helpOn(globalMethods));

zome.repo.help = h(`repo has the functions that would be a LinkRepo's own methods
  if you were on the server side.  You're missing out.`, helpOn(repoMethods));

zome.query.help = h(`query has functions that mirror those of LinkSets on the
  server.  LinkSets are the results of queries through a LinkRepo.`, helpOn(queryMethods));

zome.help = h(`All zome modules and functions have a .help.  All .help also have
  additional details about topics in the method or zome summary.

  There are 3 classes on the server to play with, and each has their own slightly
  overlapping module of this zome object.`,
  {
    help: h(`A method foo like foo(bar) => baz will have details for arguments (foo.help.bar())
      and returns (foo.help.baz()).
      All help details are also helps, so if baz is an object with aProperty,
      foo.help.baz.aProperty() would tell you about it.
    `),
    global: zome.global.help,
    repo: zome.repo.help,
    query: zome.query.help
  }
);

window.zome = zome;
*/

window.repl = repl;
