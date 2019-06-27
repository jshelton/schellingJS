(function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
// A library of seedable RNGs implemented in Javascript.
//
// Usage:
//
// var seedrandom = require('seedrandom');
// var random = seedrandom(1); // or any seed.
// var x = random();       // 0 <= x < 1.  Every bit is random.
// var x = random.quick(); // 0 <= x < 1.  32 bits of randomness.

// alea, a 53-bit multiply-with-carry generator by Johannes Baagøe.
// Period: ~2^116
// Reported to pass all BigCrush tests.
var alea = require('./lib/alea');

// xor128, a pure xor-shift generator by George Marsaglia.
// Period: 2^128-1.
// Reported to fail: MatrixRank and LinearComp.
var xor128 = require('./lib/xor128');

// xorwow, George Marsaglia's 160-bit xor-shift combined plus weyl.
// Period: 2^192-2^32
// Reported to fail: CollisionOver, SimpPoker, and LinearComp.
var xorwow = require('./lib/xorwow');

// xorshift7, by François Panneton and Pierre L'ecuyer, takes
// a different approach: it adds robustness by allowing more shifts
// than Marsaglia's original three.  It is a 7-shift generator
// with 256 bits, that passes BigCrush with no systmatic failures.
// Period 2^256-1.
// No systematic BigCrush failures reported.
var xorshift7 = require('./lib/xorshift7');

// xor4096, by Richard Brent, is a 4096-bit xor-shift with a
// very long period that also adds a Weyl generator. It also passes
// BigCrush with no systematic failures.  Its long period may
// be useful if you have many generators and need to avoid
// collisions.
// Period: 2^4128-2^32.
// No systematic BigCrush failures reported.
var xor4096 = require('./lib/xor4096');

// Tyche-i, by Samuel Neves and Filipe Araujo, is a bit-shifting random
// number generator derived from ChaCha, a modern stream cipher.
// https://eden.dei.uc.pt/~sneves/pubs/2011-snfa2.pdf
// Period: ~2^127
// No systematic BigCrush failures reported.
var tychei = require('./lib/tychei');

// The original ARC4-based prng included in this library.
// Period: ~2^1600
var sr = require('./seedrandom');

sr.alea = alea;
sr.xor128 = xor128;
sr.xorwow = xorwow;
sr.xorshift7 = xorshift7;
sr.xor4096 = xor4096;
sr.tychei = tychei;

module.exports = sr;

},{"./lib/alea":2,"./lib/tychei":3,"./lib/xor128":4,"./lib/xor4096":5,"./lib/xorshift7":6,"./lib/xorwow":7,"./seedrandom":8}],2:[function(require,module,exports){
// A port of an algorithm by Johannes Baagøe <baagoe@baagoe.com>, 2010
// http://baagoe.com/en/RandomMusings/javascript/
// https://github.com/nquinlan/better-random-numbers-for-javascript-mirror
// Original work is under MIT license -

// Copyright (C) 2010 by Johannes Baagøe <baagoe@baagoe.org>
//
// Permission is hereby granted, free of charge, to any person obtaining a copy
// of this software and associated documentation files (the "Software"), to deal
// in the Software without restriction, including without limitation the rights
// to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
// copies of the Software, and to permit persons to whom the Software is
// furnished to do so, subject to the following conditions:
//
// The above copyright notice and this permission notice shall be included in
// all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
// IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
// FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
// AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
// LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
// OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
// THE SOFTWARE.



(function(global, module, define) {

function Alea(seed) {
  var me = this, mash = Mash();

  me.next = function() {
    var t = 2091639 * me.s0 + me.c * 2.3283064365386963e-10; // 2^-32
    me.s0 = me.s1;
    me.s1 = me.s2;
    return me.s2 = t - (me.c = t | 0);
  };

  // Apply the seeding algorithm from Baagoe.
  me.c = 1;
  me.s0 = mash(' ');
  me.s1 = mash(' ');
  me.s2 = mash(' ');
  me.s0 -= mash(seed);
  if (me.s0 < 0) { me.s0 += 1; }
  me.s1 -= mash(seed);
  if (me.s1 < 0) { me.s1 += 1; }
  me.s2 -= mash(seed);
  if (me.s2 < 0) { me.s2 += 1; }
  mash = null;
}

function copy(f, t) {
  t.c = f.c;
  t.s0 = f.s0;
  t.s1 = f.s1;
  t.s2 = f.s2;
  return t;
}

function impl(seed, opts) {
  var xg = new Alea(seed),
      state = opts && opts.state,
      prng = xg.next;
  prng.int32 = function() { return (xg.next() * 0x100000000) | 0; }
  prng.double = function() {
    return prng() + (prng() * 0x200000 | 0) * 1.1102230246251565e-16; // 2^-53
  };
  prng.quick = prng;
  if (state) {
    if (typeof(state) == 'object') copy(state, xg);
    prng.state = function() { return copy(xg, {}); }
  }
  return prng;
}

function Mash() {
  var n = 0xefc8249d;

  var mash = function(data) {
    data = String(data);
    for (var i = 0; i < data.length; i++) {
      n += data.charCodeAt(i);
      var h = 0.02519603282416938 * n;
      n = h >>> 0;
      h -= n;
      h *= n;
      n = h >>> 0;
      h -= n;
      n += h * 0x100000000; // 2^32
    }
    return (n >>> 0) * 2.3283064365386963e-10; // 2^-32
  };

  return mash;
}


if (module && module.exports) {
  module.exports = impl;
} else if (define && define.amd) {
  define(function() { return impl; });
} else {
  this.alea = impl;
}

})(
  this,
  (typeof module) == 'object' && module,    // present in node.js
  (typeof define) == 'function' && define   // present with an AMD loader
);



},{}],3:[function(require,module,exports){
// A Javascript implementaion of the "Tyche-i" prng algorithm by
// Samuel Neves and Filipe Araujo.
// See https://eden.dei.uc.pt/~sneves/pubs/2011-snfa2.pdf

(function(global, module, define) {

function XorGen(seed) {
  var me = this, strseed = '';

  // Set up generator function.
  me.next = function() {
    var b = me.b, c = me.c, d = me.d, a = me.a;
    b = (b << 25) ^ (b >>> 7) ^ c;
    c = (c - d) | 0;
    d = (d << 24) ^ (d >>> 8) ^ a;
    a = (a - b) | 0;
    me.b = b = (b << 20) ^ (b >>> 12) ^ c;
    me.c = c = (c - d) | 0;
    me.d = (d << 16) ^ (c >>> 16) ^ a;
    return me.a = (a - b) | 0;
  };

  /* The following is non-inverted tyche, which has better internal
   * bit diffusion, but which is about 25% slower than tyche-i in JS.
  me.next = function() {
    var a = me.a, b = me.b, c = me.c, d = me.d;
    a = (me.a + me.b | 0) >>> 0;
    d = me.d ^ a; d = d << 16 ^ d >>> 16;
    c = me.c + d | 0;
    b = me.b ^ c; b = b << 12 ^ d >>> 20;
    me.a = a = a + b | 0;
    d = d ^ a; me.d = d = d << 8 ^ d >>> 24;
    me.c = c = c + d | 0;
    b = b ^ c;
    return me.b = (b << 7 ^ b >>> 25);
  }
  */

  me.a = 0;
  me.b = 0;
  me.c = 2654435769 | 0;
  me.d = 1367130551;

  if (seed === Math.floor(seed)) {
    // Integer seed.
    me.a = (seed / 0x100000000) | 0;
    me.b = seed | 0;
  } else {
    // String seed.
    strseed += seed;
  }

  // Mix in string seed, then discard an initial batch of 64 values.
  for (var k = 0; k < strseed.length + 20; k++) {
    me.b ^= strseed.charCodeAt(k) | 0;
    me.next();
  }
}

function copy(f, t) {
  t.a = f.a;
  t.b = f.b;
  t.c = f.c;
  t.d = f.d;
  return t;
};

function impl(seed, opts) {
  var xg = new XorGen(seed),
      state = opts && opts.state,
      prng = function() { return (xg.next() >>> 0) / 0x100000000; };
  prng.double = function() {
    do {
      var top = xg.next() >>> 11,
          bot = (xg.next() >>> 0) / 0x100000000,
          result = (top + bot) / (1 << 21);
    } while (result === 0);
    return result;
  };
  prng.int32 = xg.next;
  prng.quick = prng;
  if (state) {
    if (typeof(state) == 'object') copy(state, xg);
    prng.state = function() { return copy(xg, {}); }
  }
  return prng;
}

if (module && module.exports) {
  module.exports = impl;
} else if (define && define.amd) {
  define(function() { return impl; });
} else {
  this.tychei = impl;
}

})(
  this,
  (typeof module) == 'object' && module,    // present in node.js
  (typeof define) == 'function' && define   // present with an AMD loader
);



},{}],4:[function(require,module,exports){
// A Javascript implementaion of the "xor128" prng algorithm by
// George Marsaglia.  See http://www.jstatsoft.org/v08/i14/paper

(function(global, module, define) {

function XorGen(seed) {
  var me = this, strseed = '';

  me.x = 0;
  me.y = 0;
  me.z = 0;
  me.w = 0;

  // Set up generator function.
  me.next = function() {
    var t = me.x ^ (me.x << 11);
    me.x = me.y;
    me.y = me.z;
    me.z = me.w;
    return me.w ^= (me.w >>> 19) ^ t ^ (t >>> 8);
  };

  if (seed === (seed | 0)) {
    // Integer seed.
    me.x = seed;
  } else {
    // String seed.
    strseed += seed;
  }

  // Mix in string seed, then discard an initial batch of 64 values.
  for (var k = 0; k < strseed.length + 64; k++) {
    me.x ^= strseed.charCodeAt(k) | 0;
    me.next();
  }
}

function copy(f, t) {
  t.x = f.x;
  t.y = f.y;
  t.z = f.z;
  t.w = f.w;
  return t;
}

function impl(seed, opts) {
  var xg = new XorGen(seed),
      state = opts && opts.state,
      prng = function() { return (xg.next() >>> 0) / 0x100000000; };
  prng.double = function() {
    do {
      var top = xg.next() >>> 11,
          bot = (xg.next() >>> 0) / 0x100000000,
          result = (top + bot) / (1 << 21);
    } while (result === 0);
    return result;
  };
  prng.int32 = xg.next;
  prng.quick = prng;
  if (state) {
    if (typeof(state) == 'object') copy(state, xg);
    prng.state = function() { return copy(xg, {}); }
  }
  return prng;
}

if (module && module.exports) {
  module.exports = impl;
} else if (define && define.amd) {
  define(function() { return impl; });
} else {
  this.xor128 = impl;
}

})(
  this,
  (typeof module) == 'object' && module,    // present in node.js
  (typeof define) == 'function' && define   // present with an AMD loader
);



},{}],5:[function(require,module,exports){
// A Javascript implementaion of Richard Brent's Xorgens xor4096 algorithm.
//
// This fast non-cryptographic random number generator is designed for
// use in Monte-Carlo algorithms. It combines a long-period xorshift
// generator with a Weyl generator, and it passes all common batteries
// of stasticial tests for randomness while consuming only a few nanoseconds
// for each prng generated.  For background on the generator, see Brent's
// paper: "Some long-period random number generators using shifts and xors."
// http://arxiv.org/pdf/1004.3115v1.pdf
//
// Usage:
//
// var xor4096 = require('xor4096');
// random = xor4096(1);                        // Seed with int32 or string.
// assert.equal(random(), 0.1520436450538547); // (0, 1) range, 53 bits.
// assert.equal(random.int32(), 1806534897);   // signed int32, 32 bits.
//
// For nonzero numeric keys, this impelementation provides a sequence
// identical to that by Brent's xorgens 3 implementaion in C.  This
// implementation also provides for initalizing the generator with
// string seeds, or for saving and restoring the state of the generator.
//
// On Chrome, this prng benchmarks about 2.1 times slower than
// Javascript's built-in Math.random().

(function(global, module, define) {

function XorGen(seed) {
  var me = this;

  // Set up generator function.
  me.next = function() {
    var w = me.w,
        X = me.X, i = me.i, t, v;
    // Update Weyl generator.
    me.w = w = (w + 0x61c88647) | 0;
    // Update xor generator.
    v = X[(i + 34) & 127];
    t = X[i = ((i + 1) & 127)];
    v ^= v << 13;
    t ^= t << 17;
    v ^= v >>> 15;
    t ^= t >>> 12;
    // Update Xor generator array state.
    v = X[i] = v ^ t;
    me.i = i;
    // Result is the combination.
    return (v + (w ^ (w >>> 16))) | 0;
  };

  function init(me, seed) {
    var t, v, i, j, w, X = [], limit = 128;
    if (seed === (seed | 0)) {
      // Numeric seeds initialize v, which is used to generates X.
      v = seed;
      seed = null;
    } else {
      // String seeds are mixed into v and X one character at a time.
      seed = seed + '\0';
      v = 0;
      limit = Math.max(limit, seed.length);
    }
    // Initialize circular array and weyl value.
    for (i = 0, j = -32; j < limit; ++j) {
      // Put the unicode characters into the array, and shuffle them.
      if (seed) v ^= seed.charCodeAt((j + 32) % seed.length);
      // After 32 shuffles, take v as the starting w value.
      if (j === 0) w = v;
      v ^= v << 10;
      v ^= v >>> 15;
      v ^= v << 4;
      v ^= v >>> 13;
      if (j >= 0) {
        w = (w + 0x61c88647) | 0;     // Weyl.
        t = (X[j & 127] ^= (v + w));  // Combine xor and weyl to init array.
        i = (0 == t) ? i + 1 : 0;     // Count zeroes.
      }
    }
    // We have detected all zeroes; make the key nonzero.
    if (i >= 128) {
      X[(seed && seed.length || 0) & 127] = -1;
    }
    // Run the generator 512 times to further mix the state before using it.
    // Factoring this as a function slows the main generator, so it is just
    // unrolled here.  The weyl generator is not advanced while warming up.
    i = 127;
    for (j = 4 * 128; j > 0; --j) {
      v = X[(i + 34) & 127];
      t = X[i = ((i + 1) & 127)];
      v ^= v << 13;
      t ^= t << 17;
      v ^= v >>> 15;
      t ^= t >>> 12;
      X[i] = v ^ t;
    }
    // Storing state as object members is faster than using closure variables.
    me.w = w;
    me.X = X;
    me.i = i;
  }

  init(me, seed);
}

function copy(f, t) {
  t.i = f.i;
  t.w = f.w;
  t.X = f.X.slice();
  return t;
};

function impl(seed, opts) {
  if (seed == null) seed = +(new Date);
  var xg = new XorGen(seed),
      state = opts && opts.state,
      prng = function() { return (xg.next() >>> 0) / 0x100000000; };
  prng.double = function() {
    do {
      var top = xg.next() >>> 11,
          bot = (xg.next() >>> 0) / 0x100000000,
          result = (top + bot) / (1 << 21);
    } while (result === 0);
    return result;
  };
  prng.int32 = xg.next;
  prng.quick = prng;
  if (state) {
    if (state.X) copy(state, xg);
    prng.state = function() { return copy(xg, {}); }
  }
  return prng;
}

if (module && module.exports) {
  module.exports = impl;
} else if (define && define.amd) {
  define(function() { return impl; });
} else {
  this.xor4096 = impl;
}

})(
  this,                                     // window object or global
  (typeof module) == 'object' && module,    // present in node.js
  (typeof define) == 'function' && define   // present with an AMD loader
);

},{}],6:[function(require,module,exports){
// A Javascript implementaion of the "xorshift7" algorithm by
// François Panneton and Pierre L'ecuyer:
// "On the Xorgshift Random Number Generators"
// http://saluc.engr.uconn.edu/refs/crypto/rng/panneton05onthexorshift.pdf

(function(global, module, define) {

function XorGen(seed) {
  var me = this;

  // Set up generator function.
  me.next = function() {
    // Update xor generator.
    var X = me.x, i = me.i, t, v, w;
    t = X[i]; t ^= (t >>> 7); v = t ^ (t << 24);
    t = X[(i + 1) & 7]; v ^= t ^ (t >>> 10);
    t = X[(i + 3) & 7]; v ^= t ^ (t >>> 3);
    t = X[(i + 4) & 7]; v ^= t ^ (t << 7);
    t = X[(i + 7) & 7]; t = t ^ (t << 13); v ^= t ^ (t << 9);
    X[i] = v;
    me.i = (i + 1) & 7;
    return v;
  };

  function init(me, seed) {
    var j, w, X = [];

    if (seed === (seed | 0)) {
      // Seed state array using a 32-bit integer.
      w = X[0] = seed;
    } else {
      // Seed state using a string.
      seed = '' + seed;
      for (j = 0; j < seed.length; ++j) {
        X[j & 7] = (X[j & 7] << 15) ^
            (seed.charCodeAt(j) + X[(j + 1) & 7] << 13);
      }
    }
    // Enforce an array length of 8, not all zeroes.
    while (X.length < 8) X.push(0);
    for (j = 0; j < 8 && X[j] === 0; ++j);
    if (j == 8) w = X[7] = -1; else w = X[j];

    me.x = X;
    me.i = 0;

    // Discard an initial 256 values.
    for (j = 256; j > 0; --j) {
      me.next();
    }
  }

  init(me, seed);
}

function copy(f, t) {
  t.x = f.x.slice();
  t.i = f.i;
  return t;
}

function impl(seed, opts) {
  if (seed == null) seed = +(new Date);
  var xg = new XorGen(seed),
      state = opts && opts.state,
      prng = function() { return (xg.next() >>> 0) / 0x100000000; };
  prng.double = function() {
    do {
      var top = xg.next() >>> 11,
          bot = (xg.next() >>> 0) / 0x100000000,
          result = (top + bot) / (1 << 21);
    } while (result === 0);
    return result;
  };
  prng.int32 = xg.next;
  prng.quick = prng;
  if (state) {
    if (state.x) copy(state, xg);
    prng.state = function() { return copy(xg, {}); }
  }
  return prng;
}

if (module && module.exports) {
  module.exports = impl;
} else if (define && define.amd) {
  define(function() { return impl; });
} else {
  this.xorshift7 = impl;
}

})(
  this,
  (typeof module) == 'object' && module,    // present in node.js
  (typeof define) == 'function' && define   // present with an AMD loader
);


},{}],7:[function(require,module,exports){
// A Javascript implementaion of the "xorwow" prng algorithm by
// George Marsaglia.  See http://www.jstatsoft.org/v08/i14/paper

(function(global, module, define) {

function XorGen(seed) {
  var me = this, strseed = '';

  // Set up generator function.
  me.next = function() {
    var t = (me.x ^ (me.x >>> 2));
    me.x = me.y; me.y = me.z; me.z = me.w; me.w = me.v;
    return (me.d = (me.d + 362437 | 0)) +
       (me.v = (me.v ^ (me.v << 4)) ^ (t ^ (t << 1))) | 0;
  };

  me.x = 0;
  me.y = 0;
  me.z = 0;
  me.w = 0;
  me.v = 0;

  if (seed === (seed | 0)) {
    // Integer seed.
    me.x = seed;
  } else {
    // String seed.
    strseed += seed;
  }

  // Mix in string seed, then discard an initial batch of 64 values.
  for (var k = 0; k < strseed.length + 64; k++) {
    me.x ^= strseed.charCodeAt(k) | 0;
    if (k == strseed.length) {
      me.d = me.x << 10 ^ me.x >>> 4;
    }
    me.next();
  }
}

function copy(f, t) {
  t.x = f.x;
  t.y = f.y;
  t.z = f.z;
  t.w = f.w;
  t.v = f.v;
  t.d = f.d;
  return t;
}

function impl(seed, opts) {
  var xg = new XorGen(seed),
      state = opts && opts.state,
      prng = function() { return (xg.next() >>> 0) / 0x100000000; };
  prng.double = function() {
    do {
      var top = xg.next() >>> 11,
          bot = (xg.next() >>> 0) / 0x100000000,
          result = (top + bot) / (1 << 21);
    } while (result === 0);
    return result;
  };
  prng.int32 = xg.next;
  prng.quick = prng;
  if (state) {
    if (typeof(state) == 'object') copy(state, xg);
    prng.state = function() { return copy(xg, {}); }
  }
  return prng;
}

if (module && module.exports) {
  module.exports = impl;
} else if (define && define.amd) {
  define(function() { return impl; });
} else {
  this.xorwow = impl;
}

})(
  this,
  (typeof module) == 'object' && module,    // present in node.js
  (typeof define) == 'function' && define   // present with an AMD loader
);



},{}],8:[function(require,module,exports){
/*
Copyright 2014 David Bau.

Permission is hereby granted, free of charge, to any person obtaining
a copy of this software and associated documentation files (the
"Software"), to deal in the Software without restriction, including
without limitation the rights to use, copy, modify, merge, publish,
distribute, sublicense, and/or sell copies of the Software, and to
permit persons to whom the Software is furnished to do so, subject to
the following conditions:

The above copyright notice and this permission notice shall be
included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT.
IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY
CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT,
TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE
SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

*/

(function (pool, math) {
//
// The following constants are related to IEEE 754 limits.
//

// Detect the global object, even if operating in strict mode.
// http://stackoverflow.com/a/14387057/265298
var global = (0, eval)('this'),
    width = 256,        // each RC4 output is 0 <= x < 256
    chunks = 6,         // at least six RC4 outputs for each double
    digits = 52,        // there are 52 significant digits in a double
    rngname = 'random', // rngname: name for Math.random and Math.seedrandom
    startdenom = math.pow(width, chunks),
    significance = math.pow(2, digits),
    overflow = significance * 2,
    mask = width - 1,
    nodecrypto;         // node.js crypto module, initialized at the bottom.

//
// seedrandom()
// This is the seedrandom function described above.
//
function seedrandom(seed, options, callback) {
  var key = [];
  options = (options == true) ? { entropy: true } : (options || {});

  // Flatten the seed string or build one from local entropy if needed.
  var shortseed = mixkey(flatten(
    options.entropy ? [seed, tostring(pool)] :
    (seed == null) ? autoseed() : seed, 3), key);

  // Use the seed to initialize an ARC4 generator.
  var arc4 = new ARC4(key);

  // This function returns a random double in [0, 1) that contains
  // randomness in every bit of the mantissa of the IEEE 754 value.
  var prng = function() {
    var n = arc4.g(chunks),             // Start with a numerator n < 2 ^ 48
        d = startdenom,                 //   and denominator d = 2 ^ 48.
        x = 0;                          //   and no 'extra last byte'.
    while (n < significance) {          // Fill up all significant digits by
      n = (n + x) * width;              //   shifting numerator and
      d *= width;                       //   denominator and generating a
      x = arc4.g(1);                    //   new least-significant-byte.
    }
    while (n >= overflow) {             // To avoid rounding up, before adding
      n /= 2;                           //   last byte, shift everything
      d /= 2;                           //   right using integer math until
      x >>>= 1;                         //   we have exactly the desired bits.
    }
    return (n + x) / d;                 // Form the number within [0, 1).
  };

  prng.int32 = function() { return arc4.g(4) | 0; }
  prng.quick = function() { return arc4.g(4) / 0x100000000; }
  prng.double = prng;

  // Mix the randomness into accumulated entropy.
  mixkey(tostring(arc4.S), pool);

  // Calling convention: what to return as a function of prng, seed, is_math.
  return (options.pass || callback ||
      function(prng, seed, is_math_call, state) {
        if (state) {
          // Load the arc4 state from the given state if it has an S array.
          if (state.S) { copy(state, arc4); }
          // Only provide the .state method if requested via options.state.
          prng.state = function() { return copy(arc4, {}); }
        }

        // If called as a method of Math (Math.seedrandom()), mutate
        // Math.random because that is how seedrandom.js has worked since v1.0.
        if (is_math_call) { math[rngname] = prng; return seed; }

        // Otherwise, it is a newer calling convention, so return the
        // prng directly.
        else return prng;
      })(
  prng,
  shortseed,
  'global' in options ? options.global : (this == math),
  options.state);
}

//
// ARC4
//
// An ARC4 implementation.  The constructor takes a key in the form of
// an array of at most (width) integers that should be 0 <= x < (width).
//
// The g(count) method returns a pseudorandom integer that concatenates
// the next (count) outputs from ARC4.  Its return value is a number x
// that is in the range 0 <= x < (width ^ count).
//
function ARC4(key) {
  var t, keylen = key.length,
      me = this, i = 0, j = me.i = me.j = 0, s = me.S = [];

  // The empty key [] is treated as [0].
  if (!keylen) { key = [keylen++]; }

  // Set up S using the standard key scheduling algorithm.
  while (i < width) {
    s[i] = i++;
  }
  for (i = 0; i < width; i++) {
    s[i] = s[j = mask & (j + key[i % keylen] + (t = s[i]))];
    s[j] = t;
  }

  // The "g" method returns the next (count) outputs as one number.
  (me.g = function(count) {
    // Using instance members instead of closure state nearly doubles speed.
    var t, r = 0,
        i = me.i, j = me.j, s = me.S;
    while (count--) {
      t = s[i = mask & (i + 1)];
      r = r * width + s[mask & ((s[i] = s[j = mask & (j + t)]) + (s[j] = t))];
    }
    me.i = i; me.j = j;
    return r;
    // For robust unpredictability, the function call below automatically
    // discards an initial batch of values.  This is called RC4-drop[256].
    // See http://google.com/search?q=rsa+fluhrer+response&btnI
  })(width);
}

//
// copy()
// Copies internal state of ARC4 to or from a plain object.
//
function copy(f, t) {
  t.i = f.i;
  t.j = f.j;
  t.S = f.S.slice();
  return t;
};

//
// flatten()
// Converts an object tree to nested arrays of strings.
//
function flatten(obj, depth) {
  var result = [], typ = (typeof obj), prop;
  if (depth && typ == 'object') {
    for (prop in obj) {
      try { result.push(flatten(obj[prop], depth - 1)); } catch (e) {}
    }
  }
  return (result.length ? result : typ == 'string' ? obj : obj + '\0');
}

//
// mixkey()
// Mixes a string seed into a key that is an array of integers, and
// returns a shortened string seed that is equivalent to the result key.
//
function mixkey(seed, key) {
  var stringseed = seed + '', smear, j = 0;
  while (j < stringseed.length) {
    key[mask & j] =
      mask & ((smear ^= key[mask & j] * 19) + stringseed.charCodeAt(j++));
  }
  return tostring(key);
}

//
// autoseed()
// Returns an object for autoseeding, using window.crypto and Node crypto
// module if available.
//
function autoseed() {
  try {
    var out;
    if (nodecrypto && (out = nodecrypto.randomBytes)) {
      // The use of 'out' to remember randomBytes makes tight minified code.
      out = out(width);
    } else {
      out = new Uint8Array(width);
      (global.crypto || global.msCrypto).getRandomValues(out);
    }
    return tostring(out);
  } catch (e) {
    var browser = global.navigator,
        plugins = browser && browser.plugins;
    return [+new Date, global, plugins, global.screen, tostring(pool)];
  }
}

//
// tostring()
// Converts an array of charcodes to a string
//
function tostring(a) {
  return String.fromCharCode.apply(0, a);
}

//
// When seedrandom.js is loaded, we immediately mix a few bits
// from the built-in RNG into the entropy pool.  Because we do
// not want to interfere with deterministic PRNG state later,
// seedrandom will not call math.random on its own again after
// initialization.
//
mixkey(math.random(), pool);

//
// Nodejs and AMD support: export the implementation as a module using
// either convention.
//
if ((typeof module) == 'object' && module.exports) {
  module.exports = seedrandom;
  // When in node.js, try using crypto package for autoseeding.
  try {
    nodecrypto = require('crypto');
  } catch (ex) {}
} else if ((typeof define) == 'function' && define.amd) {
  define(function() { return seedrandom; });
} else {
  // When included as a plain script, set up Math.seedrandom global.
  math['seed' + rngname] = seedrandom;
}


// End anonymous scope, and pass initial values.
})(
  [],     // pool: entropy pool starts empty
  Math    // math: package containing random, pow, and seedrandom
);

},{"crypto":10}],9:[function(require,module,exports){
// const math = require("mathjs");
// const readline = require('readline')
// const seed = require("./node_modules/seedrandom/seedrandom.min.js");
const seedrandom = require("seedrandom");
//import * from "seedrandom");

Reset = "\x1b[0m";
Bright = "\x1b[1m";
Dim = "\x1b[2m";
Underscore = "\x1b[4m";
Blink = "\x1b[5m";
Reverse = "\x1b[7m";
Hidden = "\x1b[8m";

FgBlack = "\x1b[30m";
FgRed = "\x1b[31m";
FgGreen = "\x1b[32m";
FgYellow = "\x1b[33m";
FgBlue = "\x1b[34m";
FgMagenta = "\x1b[35m";
FgCyan = "\x1b[36m";
FgWhite = "\x1b[37m";

BgBlack = "\x1b[40m";
BgRed = "\x1b[41m";
BgGreen = "\x1b[42m";
BgYellow = "\x1b[43m";
BgBlue = "\x1b[44m";
BgMagenta = "\x1b[45m";
BgCyan = "\x1b[46m";
BgWhite = "\x1b[47m";

function rangeClosedOpen(min, max) {
  return Math.floor(Math.random() * (max - min)) + min;
}

function ranBetween(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function printMat(mat, params) {
  var { segmentRatio } = params;
  //   mat.forEach(e => {
  //     console.log(e);
  //   });
  console.log("[");
  for (var i = 0; i < mat.length; i++) {
    var line = " ";
    for (var j = 0; j < mat[0].length; j++) {
      if (unconfortable(mat, i, j, mat[i][j], params)) {
        line += FgRed + mat[i][j] + Reset + " ,";
      } else line += FgGreen + mat[i][j] + Reset + " ,";
    }
    console.log("[" + line + "],");
    line = "";
  }
  console.log("]");
}

function validProportions(populationProportions) {
  var total = 0.0;
  var positive = true;

  populationProportions.forEach(number => {
    positive = positive && 0 <= number;
  });

  if (positive)
    populationProportions.forEach(fraction => {
      total += fraction;
    });

  return positive && total <= 1;
}

exports.printMat = printMat;

// Assumes that only the first square is populated
function getInitialPopulation(params) {
  return params.cityHeight * params.cityWidth * params.occupancy;
}

// verify total populationProportions are smaller than total vacancy
function populate(cityMat, params) {
  var { cityHeight, cityWidth, populationProportions } = params;
  var populationSize = getInitialPopulation(params);

  for (var j = 0; j < populationProportions.length; j++) {
    if (j == Segment.none) continue;
    for (
      var i = 0;
      i < Math.floor(populationSize * populationProportions[j]);
      i++
    ) {
      var m, n;

      do {
        m = rangeClosedOpen(0, cityHeight);
        n = rangeClosedOpen(0, cityWidth);
      } while (cityMat[m][n] != Segment.none);
      cityMat[m][n] = j;
    }
  }
  return cityMat;
}

exports.populate = populate;

function searchForArray(haystack, needle) {
  var i, j, current;
  for (i = 0; i < haystack.length; ++i) {
    if (needle.length === haystack[i].length) {
      current = haystack[i];
      for (j = 0; j < needle.length && needle[j] === current[j]; ++j);
      if (j === needle.length) return i;
    }
  }
  return -1;
}

function printMatUpdated(mat, updatedResidencies, params) {
  // mat.forEach(e => {
  //   console.log(e);
  // });
  var { segmentRatio } = params;
  console.log("[");
  for (var i = 0; i < mat.length; i++) {
    var line = " ";
    for (var j = 0; j < mat[0].length; j++) {
      var u = unconfortable(mat, i, j, mat[i][j], params);
      var s = searchForArray(updatedResidencies, [i, j]) >= 0;
      if (u && s) {
        line += FgMagenta + mat[i][j] + Reset + " ,";
        sleep(1000);
      } else if (u) {
        line += FgRed + mat[i][j] + Reset + " ,";
      } else if (s) {
        line += FgCyan + mat[i][j] + Reset + " ,";
      } else {
        line += FgGreen + mat[i][j] + Reset + " ,";
      }
    }
    console.log("[" + line + "],");
    line = "";
  }
  console.log("]");
}

exports.printMatUpdated = printMatUpdated;

function segmented(mat, x, y, seg) {
  if (seg == Segment.none) return false;
  var counter = Array(Object.keys(Segment).length).fill(0);

  for (var i = 0; i < 3; i++) {
    for (var j = 0; j < 3; j++) {
      var newX = x - i + 1;
      var newY = y - j + 1;

      if (
        newX >= 0 &&
        newX < mat[0].length &&
        newY >= 0 &&
        newY < mat.length &&
        !(i == 1 && j == 1)
      ) {
        counter[mat[newY][newX]]++;
      }
    }
  }

  return (
    counter.filter(
      (value, index, arr) => index != Segment.none && index != seg
    ) == 0
  );
}

function unconfortable(mat, i, j, seg, params) {
  var { segmentRatio } = params;

  if (seg === Segment.none) return false;

  var counter = Array(Object.keys(Segment).length).fill(0);

  for (var m = 0; m < 3; m++) {
    for (var n = 0; n < 3; n++) {
      var newI = i - m + 1;
      var newJ = j - n + 1;

      if (
        newI >= 0 &&
        newI < mat[0].length &&
        newJ >= 0 &&
        newJ < mat.length &&
        !(m == 1 && n == 1)
      ) {
        counter[mat[newI][newJ]]++;
      }
    }
  }

  var totalSurroundingPop = counter
    .filter((value, index, arr) => index != Segment.none)
    .reduce((a, b) => a + b, 0);

  // Debugging rituals
  //   console.log(
  //     "       Disconfort:",
  //     counter[seg] / totalSurroundingPop < segmentRatio,
  //     " i:",
  //     i,
  //     " j:",
  //     j,
  //     "seg:",
  //     seg,
  //     " totalSurroundingPop:",
  //     totalSurroundingPop,
  //     " counter:",
  //     counter
  //   );

  return counter[seg] / totalSurroundingPop < segmentRatio;
}

exports.unconfortable = unconfortable;

function countUnconfortable(mat, params) {
  var discomforted = 0;
  for (var i = 0; i < mat.length; i++) {
    for (var j = 0; j < mat[0].length; j++) {
      if (unconfortable(mat, i, j, mat[i][j], params)) discomforted++;
    }
  }
  return discomforted;
}

function countSegmented(mat, params) {
  var segmentedCount = 0;
  for (var i = 0; i < mat.length; i++) {
    for (var j = 0; j < mat[0].length; j++) {
      if (segmented(mat, i, j, mat[i][j], params)) segmentedCount++;
    }
  }
  return segmentedCount;
}

function shuffle(mat, params) {
  var movingNeighbors = Array();
  var updatedResidencies = Array(); //only for debug
  var newHouseFound = false;

  for (var i = 0; i < mat.length; i++) {
    for (var j = 0; j < mat[0].length; j++) {
      if (unconfortable(mat, i, j, mat[i][j], params))
        movingNeighbors.push([i, j]);
    }
  }

  for (var k = 0; k < movingNeighbors.length; k++) {
    var oldhomeM = movingNeighbors[k][0];
    var oldhomeN = movingNeighbors[k][1];

    // Perhaps the discomfort corrected itself, so let's check before moving
    if (
      unconfortable(mat, oldhomeM, oldhomeN, mat[oldhomeM][oldhomeN], params)
    ) {
      var potentialMoves = 0;

      var l = rangeClosedOpen(0, mat.length * mat[0].length);
      var lOrig = l;

      do {
        var m = Math.floor(l / mat.length);
        var n = l % mat[0].length;
        l = (l + 1) % (mat.length * mat[0].length);

        // Debugging, pay no attention
        // {
        // console.log(
        //   "Discomfort:",
        //   unconfortable(mat, m, n, mat[oldhomeM][oldhomeN], params),
        //   m,
        //   n,
        //   mat[oldhomeM][oldhomeN],
        //   params
        // );
        // }

        // If the cell is empty then see if it's a match
        if (mat[m][n] == Segment.none) {
          mat[m][n] = mat[oldhomeM][oldhomeN];
          mat[oldhomeM][oldhomeN] = Segment.none;

          // check if he will be confortable in the new location if not, keep searching
          //    Debugging, pay no attention

          //   console.log(
          //     "Discomfort:",
          //     unconfortable(mat, m, n, mat[m][n], params),
          //     m,
          //     n,
          //     mat[m][n],
          //     params
          //   );

          if (unconfortable(mat, m, n, mat[m][n], params)) {
            mat[oldhomeM][oldhomeN] = mat[m][n];
            mat[m][n] = Segment.none;
            newHouseFound = false;
          } else {
            // if we find a match then stay there!
            newHouseFound = true;
          }
        }
      } while (!newHouseFound && l != lOrig);

      updatedResidencies.push([m, n]);
      updatedResidencies.push([oldhomeM, oldhomeN]);
    }
    //printMatUpdated(mat, updatedResidencies, params);
    updatedResidencies = [];
  }
  // if we ran out of options then return false for failing
  return newHouseFound;
}

function sleep(miliseconds) {
  var currentTime = new Date().getTime();

  while (currentTime + miliseconds >= new Date().getTime()) {}
}

function shuffle2(mat, params, mat2, params2) {
  var movingNeighbors = Array();
  var updatedResidencies = Array(); //only for debug
  var updatedResidencies2 = Array();

  for (var i = 0; i < mat.length; i++) {
    for (var j = 0; j < mat[0].length; j++) {
      if (unconfortable(mat, i, j, mat[i][j], params))
        movingNeighbors.push([i, j]);
    }
  }

  for (var k = 0; k < movingNeighbors.length; k++) {
    var oldhomeM = movingNeighbors[k][0];
    var oldhomeN = movingNeighbors[k][1];
    newHouseFound = false;

    // Perhaps the discomfort corrected itself, so let's check before moving
    if (
      unconfortable(mat, oldhomeM, oldhomeN, mat[oldhomeM][oldhomeN], params)
    ) {
      // We chose a random number from the potential residencies including the new neighborhood
      var mat1Len = mat.length * mat[0].length;
      var mat2Len = mat2.length * mat2[0].length;

      // Each possible residency has a unique number so we chose a random number in this range
      // We will start sequentially looking for a free place that we can move into
      // this guarantees us that we looked everywhere if we end up at lorig
      var l = rangeClosedOpen(0, mat1Len + mat2Len);
      var lOrig = l;

      do {
        var citySource, cityDest;
        var location = l;
        var destParams;

        if (l < mat1Len) {
          citySource = cityDest = mat;
          destParams = params;
        } else {
          citySource = mat;
          cityDest = mat2;
          location -= mat1Len; // let's make l relative to the destination matrix
          destParams = params2;
        }
        // console.log(cityDest);

        // find row
        var m = Math.floor(location / cityDest.length);

        // find column
        var n = location % cityDest[0].length;
        // console.log(location, m, n);

        // We will start sequentially looking for a free place that we can move into
        // this guarantees us that we looked everywhere if we end up at lorig
        l = (l + 1) % (mat1Len + mat2Len);
        // console.log("Total", mat1Len, mat2Len);
        // Debugging, pay no atten

        // If the cell is empty then see if it's a match
        if (cityDest[m][n] == Segment.none) {
          // We can potentially move to this location, let's try
          cityDest[m][n] = citySource[oldhomeM][oldhomeN];
          citySource[oldhomeM][oldhomeN] = Segment.none;

          // check if he will be confortable in the new location if not, keep searching

          if (unconfortable(cityDest, m, n, cityDest[m][n], destParams)) {
            citySource[oldhomeM][oldhomeN] = cityDest[m][n];
            cityDest[m][n] = Segment.none;
            newHouseFound = false;
            // console.log("not confortable");
          } else {
            // if we find a match then stay there!
            newHouseFound = true;
            // console.log("found a confortable");
          }
        }
        // console.log("k", k, newHouseFound, l, lOrig);
      } while (!newHouseFound && l != lOrig);

      if (newHouseFound) {
        if (cityDest == citySource) updatedResidencies.push([m, n]);
        else updatedResidencies2.push([m, n]);

        updatedResidencies.push([oldhomeM, oldhomeN]);
      }
    }

    printMatUpdated(mat, updatedResidencies, params);
    updatedResidencies = [];

    printMatUpdated(mat2, updatedResidencies2, params2);
    updatedResidencies2 = [];
    // console.log(k, movingNeighbors.length, newHouseFound);
  }

  // if we ran out of options then return false for failing
  return k == movingNeighbors.length;
}

exports.shuffle2 = shuffle2;

function runShelling(mat, params) {
  var populationSize = getInitialPopulation(params);
  var prevDiscomforted = populationSize + 2;

  var discomforted = populationSize + 1;
  var segmentedCount = [];
  segmentedCount.push(countSegmented(mat, params));

  var iterationCount = 0;

  /// This iteration count is only supposed to make sure that the program does not go into infinite loop
  let cutoffIteration = 2000;

  while (discomforted != 0 && iterationCount < cutoffIteration) {
    iterationCount++;
    //console.log("Discomfort ", discomforted, ",iteration", iterationCount);
    prevDiscomforted = discomforted;

    if (!shuffle(mat, params)) {
      console.error("Error finding a new place for a neighbor");
      return [-1, segmentedCount, "Error finding a new place for a neighbor"];
    }

    discomforted = countUnconfortable(mat, params);

    segmentedCount.push(countSegmented(mat, params));

    // Debug Between shuffle iterations
    // {
    //   printMat(mat, params);
    //   console.log(
    //     "#Prev Discomfort: ",
    //     prevDiscomforted,
    //     "#Current Discomfort: ",
    //     discomforted
    //   );
    //   if (discomforted == prevDiscomforted) {
    //     sleep(500);
    //   }
    //console.log("Finished Iteration", iterationCount);
    // }
  }

  return [iterationCount, segmentedCount];
}

exports.runShelling = runShelling;

function runShelling2(mat, params, mat2, params2) {
  var populationSize = getInitialPopulation(params);
  var prevDiscomforted = populationSize + 2;

  var discomforted = populationSize + 1;
  var segmentedCount = [];
  segmentedCount.push(
    countSegmented(mat, params) + countSegmented(mat2, params2)
  );

  var iterationCount = 0;

  /// This iteration count is only supposed to make sure that the program does not go into infinite loop
  let cutoffIteration = 2000;

  while (discomforted != 0 && iterationCount < cutoffIteration) {
    iterationCount++;
    //console.log("Discomfort ", discomforted, ",iteration", iterationCount);
    prevDiscomforted = discomforted;

    if (
      !shuffle2(mat, params, mat2, params2) ||
      !shuffle2(mat2, params2, mat, params)
    ) {
      console.error("Error finding a new place for a neighbor");
      return [-1, segmentedCount, "Error finding a new place for a neighbor"];
    }

    discomforted =
      countUnconfortable(mat, params) + countUnconfortable(mat2, params2);

    segmentedCount.push(
      countSegmented(mat, params) + countSegmented(mat2, params2)
    );

    // Debug Between shuffle iterations
    // {
    //   printMat(mat, params);
    //   console.log(
    //     "#Prev Discomfort: ",
    //     prevDiscomforted,
    //     "#Current Discomfort: ",
    //     discomforted
    //   );
    //   if (discomforted == prevDiscomforted) {
    //     sleep(500);
    //   }
    //console.log("Finished Iteration", iterationCount);
    // }
  }

  return [iterationCount, segmentedCount];
}

exports.runShelling2 = runShelling2;

function printList(params) {
  var {
    runXtimes,
    segmentRatio,
    cityHeight,
    cityWidth,
    occupancy,
    populationProportions,
    seed
  } = params;
  list = [
    { runXtimes },
    { cityHeight },
    { cityWidth },
    { occupancy },
    { populationProportions },
    { segmentRatio },
    { seed }
  ];

  // Print the state of the parameters for reference
  const printVar = varObj =>
    console.log(Object.keys(varObj)[0] + ": " + Object.values(varObj)[0]);

  list.forEach(printVar);
}

function runXtimes(params) {
  var populationSize = getInitialPopulation(params);
  params.populationSize = populationSize;

  var histogram = [];

  if (!validProportions(params.populationProportions)) {
    console.log("invalid populationProportions list.");
    return;
  }

  //printList(params);

  // Run to build a histogram with different generated cities
  for (var i = 0; i < params.runXtimes; i++) {
    var cityMat = Array(params.cityHeight)
      .fill()
      .map(() => Array(params.cityWidth).fill(0));

    populate(cityMat, params);

    // Debug
    // printMat(cityMat, params);

    var [howLong, segmentedCount] = runShelling(cityMat, params);

    // Debug
    // printMat(cityMat, params.segmentRatio);

    var index = howLong.toString();
    if (histogram[index] == null) histogram[index] = 1;
    else histogram[index] = histogram[index] + 1;
  }
  return histogram;
}
exports.runXtimes = runXtimes;

function printSparseMat(a) {
  a.forEach((value, index) => console.log(index + ":" + value + " "));
}
exports.printSparseMat = printSparseMat;

var Segment = { none: 0, type1: 1, type2: 2 };
Object.freeze(Segment);
exports.Segment = Segment;

function test() {
  var params = {
    runXtimes: 1,
    cityHeight: 30,
    cityWidth: 30,
    occupancy: 0.9,
    populationProportions: [0, 0.6, 0.4],
    segmentRatio: 0.5,
    seed: "hello"
  };
  var params2 = {};

  Object.assign(params2, params);
  Object.assign(params2, { cityHeight: 10, cityWidth: 10 });

  function testRun0(params) {
    params.seed = "hello";
    Math.random = seedrandom(params.seed);

    var cityMat = Array(params.cityHeight)
      .fill()
      .map(() => Array(params.cityWidth).fill(0));

    populate(cityMat, params);

    printMat(cityMat, params);

    runShelling(cityMat, params);
    printMat(cityMat, params);
    printList(params);
  }

  function testRun1(params) {
    params.seed = "hello";
    Math.random = seedrandom(params.seed);
    var z = [
      [0, 0, 1, 0, 1, 0, 0],
      [1, 1, 2, 0, 0, 0, 0],
      [0, 1, 1, 0, 1, 0, 0],
      [0, 0, 1, 1, 1, 1, 0],
      [0, 0, 0, 0, 0, 2, 0],
      [0, 1, 1, 0, 1, 1, 0],
      [0, 0, 0, 0, 0, 0, 2]
    ];
    printMat(z, params);
    runShelling(z, params);
    printMat(z, params);
    printList(params);
  }

  function testRun2(params) {
    params.seed = "jh2df23dd23i";
    Math.random = seedrandom(params.seed);
    var histogram = runXtimes(params);
    printSparseMat(histogram);
  }

  function testRun3(params) {
    z = [
      [1, 2, 0, 0, 1, 0, 1],
      [0, 0, 0, 0, 1, 0, 0],
      [1, 1, 1, 0, 0, 1, 0],
      [0, 0, 1, 0, 2, 0, 0],
      [2, 1, 0, 0, 0, 0, 1],
      [0, 0, 0, 0, 1, 1, 0],
      [1, 0, 0, 1, 0, 0, 0]
    ];

    var i = 2,
      j = 0;

    return z[i][j] + ":" + unconfortable(z, i, j, z[i][j], params);
  }

  function testRun4(params) {
    var z = [
      [2, 0, 2, 0, 0, 0, 1],
      [0, 0, 1, 1, 1, 0, 0],
      [1, 0, 1, 0, 0, 0, 0],
      [0, 0, 0, 1, 1, 0, 1],
      [1, 1, 0, 0, 0, 0, 1],
      [0, 0, 0, 0, 0, 1, 0],
      [1, 0, 2, 0, 1, 0, 0]
    ];
    var b = [
      [2, 0, 2, 0, 0, 0, 1],
      [0, 0, 1, 1, 1, 0, 0],
      [1, 0, 1, 0, 0, 0, 0],
      [0, 0, 0, 1, 1, 0, 1],
      [1, 1, 0, 0, 0, 0, 1],
      [0, 0, 0, 0, 0, 1, 0],
      [1, 0, 2, 0, 1, 0, 0]
    ];
  }

  function testRun5(params, params2) {
    params.seed = "sfefe";
    Math.random = seedrandom(params.seed);
    params.occupancy = 1;
    params.populationProportions[1] = 0.1;
    params.populationProportions[2] = 0.9;

    params.cityWidth = params.cityHeight = 30;
    params2.cityWidth = params2.cityHeight = 10;

    var z = Array(params.cityHeight)
      .fill()
      .map(() => Array(params.cityWidth).fill(0));
    var b = Array(params2.cityHeight)
      .fill()
      .map(() => Array(params2.cityWidth).fill(0));

    populate(z, params);

    console.log(shuffle2(z, params, b, params2));
  }

  if (testRun3(params) === "1:false") console.log("passed testRun3");
  else console.log("failed testRun2");

  function testRun6(params, params2) {
    var params2 = {};

    Object.assign(params2, params);
    Object.assign(params2, { cityHeight: 10, cityWidth: 10 });

    params.seed = "sfefe";
    Math.random = seedrandom(params.seed);
    params.occupancy = 1;
    params.populationProportions[1] = 0.1;
    params.populationProportions[2] = 0.9;

    params.cityWidth = params.cityHeight = 10;
    params2.cityWidth = params2.cityHeight = 5;

    var z = Array(params.cityHeight)
      .fill()
      .map(() => Array(params.cityWidth).fill(0));
    var b = Array(params2.cityHeight)
      .fill()
      .map(() => Array(params2.cityWidth).fill(0));

    populate(z, params);

    runShelling2(z, params, b, params2);
    printMat(z, params);
    printMat(b, params2);
  }

  // testRun1(params);
  testRun6(params, params2);
}

test();

},{"seedrandom":1}],10:[function(require,module,exports){

},{}]},{},[9]);
