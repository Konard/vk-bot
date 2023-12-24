const _ = require('lodash');

// Object.prototype.set = function () { return this; };

describe('set function', () => {
  test.each([
    [{}],
  ])('set for object "%s"', (object) => {
    _.set(object, ['foo', 'bar'], 1);
    expect(object.foo.bar).toBe(1);
  });
});