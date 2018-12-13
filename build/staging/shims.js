/**
 * I guess typescript can't honor my ES5 target here?!  Ok...
 * It really only needs to implement the functions I use: constructor, get, set, add, has
 * And the key types I use: just string, I think.
 */

var Set = (function (_super) {

  function Set(items) {
    this._keys = {};
    var len;
    if (items && items.length) {
      len = items.length;
      for (var i = 0; i < len; i++) {
        this.add(items[i]);
      }
    }
  }

  var proto = Set.prototype = Object.create(_super.prototype);
  proto.add = function (item) {
    this._keys[''+item] = true;
    return this;
  };
  proto.delete = function (item) {
    delete this._keys[''+item];
    return this;
  };
  proto.has = function (item) {
    return this._keys.hasOwnProperty(''+item);
  };

  proto.keys = proto.values = function () {
    var keys = this._keys;
    return Object.keys(keys).filter(function (key) {
      return keys[key] === true;
    });
  }

  proto.forEach = function (cb, thisVal) {
    thisVal = thisVal || this;
    var keys = this.keys();
    var i = keys.length;
    while (i--) {
      cb.call(thisVal, keys[i], this);
    }
  }

  return Set;
})(Object);

var Map = (function (_super) {

  function Map(items) {
    this._entries = this._keys = {};
    var len = items && items.length;
    for (i = 0; i < len; i++) {
      this.set(items[0], items[1]);
    }
  }

  var proto = Map.prototype = Object.create(_super.prototype);
  proto.add = null;
  proto.set = function (what, to) {
    this._entries[''+what] = to;
    return this;
  }
  proto.get = function (what) {
    return this._entries[''+what];
  }

  proto.keys = function () {
    return Object.keys(this._entries);
  }
  proto.values = function () {
    return this.keys().map(function (key) {
      return this._entries[key];
    });
  }
  proto.entries = function () {
    var entries = this._entries;
    return this.keys().map(function (key) {
      return [key, entries[key]];
    });
  }
  proto.forEach = function (cb, that) {
    var entries = this._entries;
    var me = this;
    that = that || this;
    this.keys.forEach(function (key) {
      cb.call(that, entries[key], key, me);
    });
  }

  return Map;
})(Set)

/**
 * It also doesn't know about Object.assign.....
 */

Object.assign = function (dest, src) {
  if (!dest || typeof dest !== "object" && typeof dest !== "function") throw new TypeError("Can't assign to non-object");
  if (src && typeof src === "object") {

    var keys = Object.keys(src);
    var i = keys.length;
    var key;

    while (i--) {
      key = keys[i];
      dest[key] = src[key];
    }

  }
  if (arguments.length > 2) {
    var more = [].slice.call(arguments, 2);
    Object.assign(dest, more);
  }
  return dest;
};

/**
 * Man, I really forgot what it was like to ES5
 */
(function (sp) {
  sp.bold = function () {
    return "<b>" + this + "</b>";
  }
  sp.italics = function () {
    return "<i>" + this + "</i>";
  }
  sp.fixed = function () {
    return "<tt>" + this + "</tt>";
  }
})(String.prototype);
