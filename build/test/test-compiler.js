/**
 * A node module that exposes a synchronous API for creating asynchronous Holochain
 * tests.  Untested and unused for now.
 * @author David Hand (sqykly@gmail.com)
 */

const fs = require('fs'),
  path = require('path'),
  process = require('process'),
  PATH = process.env.path;

const projPath = path.relative('', '/HoloREA'),
  testPath = path.resolve([projPath, 'bin', 'HoloREA', 'test']);

var time = 0;

class Role {
  constructor(name, scenario) {
    this.name = name;
    this.scenario = scenario;
  }
  get path() {
    return path.resolve([this.scenario.path, this.name]);
  }
  test(description) {
    return this.scenario.test(description, this);
  }
  when(desc, fn) {
    return this.test(description).when(fn);
  }
}

class Test {
  constructor(description, scenario, role, time) {
    this.description = description;
    this.scenario = scenario;
    this.role = role;
    this.time = time;
    this.setup = '';
    this.assertions = 'true';
    this.teardown = '';
    this.error = null;
  }

  static body(fn) {
    if (typeof fn == 'string') {
      return fn;
    } else {
      // regex should find the first function head ('function (...) {' or '(...) => {')
      // and capture everything from there until the final '}'
      return /^(?:(?:function)?[^\(]*\([^\)]*\)[^\{]*\{)([^]*)\}\s*$/.exec(fn.toString())[1];
    }
  }

  when(fn) {
    this.setup = `${this.setup}${this.setup && ';'}${Test.body(fn)}`;
    return this;
  }

  assert(fn) {
    fn = Test.body(fn);
    if (this.assertions) {
      this.assertions = `${this.assertions}&&${fn}`;
    }
  }

  json() {
    return JSON.stringify({
      Convey: this.description,
      Zome: this.scenario.zome,
      FnName: '',
      Repeat: 0,
      Raw: true,
      Input: this.setup,
      Output: this.assertions,
      Time: this.time
    });
  }
}

class Scenario {
  constructor(zome, name, interval = 1000) {
    this.zome = zome;
    this.name = name;
    this.time = 0;
    this.interval = interval;
    this.roles = new Map();
  }

  get path() {
    return path.resolve([testPath, this.name]);
  }

  role(name) {
    if (typeof name == 'string') {

      if (this.roles.has(name)) return this.roles.get(name);

      let r = new Role(name, this);
      this.roles.set(name, r);
      return r;

    } else {

      let r = name;
      name = r.name;

      if (this.roles.has(name)) return this.roles.get(name);

      this.roles.set(name, r);
      return r;

    }
  }

  test(description, role, interval = this.interval) {
    let r = new Test(description, this, role, this.time + interval);
    this.time += interval;
    return r;
  }

}
