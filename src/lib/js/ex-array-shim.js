
function ExArray() {
  Array.apply(this);
  this.push.apply(this, arguments);
}
ExArray.prototype = Object.create(Array.prototype);
