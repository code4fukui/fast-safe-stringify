# fast-safe-stringify

> 日本語のREADMEはこちらです: [README.ja.md](README.ja.md)

A safe and fast drop-in replacement for `JSON.stringify`.

This library gracefully handles circular structures and other edge cases without throwing errors. It also provides a deterministic ("stable") version for consistent output.

## Features

-   **Circular Reference Handling**: Prevents `TypeError: Converting circular structure to JSON` by replacing circular references with the string `"[Circular]"`.
-   **High Performance**: Significantly faster than other safe stringify alternatives. See [Benchmarks](#benchmarks).
-   **Stable Output**: An optional `stableStringify` function ensures that the output is deterministic by sorting object keys.
-   **Familiar API**: Mimics the standard `JSON.stringify` signature, including support for `replacer` and `space` arguments.
-   **Recursion Control**: Use `depthLimit` and `edgesLimit` options to prevent issues with deeply nested objects.

## Usage

The API is the same as the standard `JSON.stringify`.

`stringify(value[, replacer[, space[, options]]])`

### Basic Example

```js
import safeStringify from "https://code4fukui.github.io/fast-safe-stringify/index.js";

const obj = { a: 1 };
obj.b = obj; // Create a circular reference

// Safely stringifies the object
console.log(safeStringify(obj));
// '{"a":1,"b":"[Circular]"}'

// Standard JSON.stringify throws an error
try {
  JSON.stringify(obj);
} catch (e) {
  console.log(e.message);
  // TypeError: Converting circular structure to JSON
}
```

### Stable (Deterministic) Stringify

For consistent output, use `stableStringify`. It sorts object keys before serialization.

```js
import { stableStringify } from "https://code4fukui.github.io/fast-safe-stringify/index.js";

const obj = { c: 3, b: 2, a: 1 };
obj.o = obj;

console.log(stableStringify(obj));
// '{"a":1,"b":2,"c":3,"o":"[Circular]"}'
```

### Using Replacer and Options

You can use a `replacer` function and an `options` object to control the serialization.

```js
import safeStringify from "https://code4fukui.github.io/fast-safe-stringify/index.js";

const obj = { a: 1 };
obj.o = obj;

function replacer(key, value) {
  // The replacer receives '[Circular]' for circular references
  if (value === '[Circular]') {
    return; // Remove the circular key from the output
  }
  return value;
}

// Set recursion limits (defaults are Number.MAX_SAFE_INTEGER)
const options = {
  depthLimit: 10,
  edgesLimit: 1000
};

const serialized = safeStringify(obj, replacer, 2, options);

console.log(serialized);
// {
//   "a": 1
// }
```

### Replacement Strings

-   `[Circular]` - Used when a circular reference is detected.
-   `[...]` - Used when `depthLimit` or `edgesLimit` is reached.

## Differences from `JSON.stringify`

While the API is compatible, there are a few key differences in behavior, especially when using `toJSON` or a `replacer` function.

### `safeStringify` (Regular)

-   You cannot manipulate a circular part of the input value from within a `toJSON` or `replacer` function.
-   When a circular structure is detected, the `replacer` function receives the string `"[Circular]"` as the value, not the object reference itself.

### `stableStringify` (Deterministic)

-   Manipulating the input object from within a `toJSON` or `replacer` function will have no effect on the output. The output is based entirely on the object's state when it was passed to the function.
-   Like the regular version, the `replacer` receives `"[Circular]"` for circular references.

A faster, side-effect-free variation without these limitations is available in the [`safe-stable-stringify`][] module, which is considered experimental.

## Benchmarks

Performance compared to `util.inspect` and `json-stringify-safe`.

*(Results from a Lenovo T450s with an i7-5600U CPU using Node.js 8.9.4)*

```md
fast-safe-stringify:   simple object x 1,121,497 ops/sec ±0.75% (97 runs sampled)
fast-safe-stringify:   circular      x 560,126 ops/sec ±0.64% (96 runs sampled)
fast-safe-stringify:   deep          x 32,472 ops/sec ±0.57% (95 runs sampled)
fast-safe-stringify:   deep circular x 32,513 ops/sec ±0.80% (92 runs sampled)

util.inspect:          simple object x 272,837 ops/sec ±1.48% (90 runs sampled)
util.inspect:          circular      x 116,896 ops/sec ±1.19% (95 runs sampled)
util.inspect:          deep          x 19,382 ops/sec ±0.66% (92 runs sampled)
util.inspect:          deep circular x 18,717 ops/sec ±0.63% (96 runs sampled)

json-stringify-safe:   simple object x 233,621 ops/sec ±0.97% (94 runs sampled)
json-stringify-safe:   circular      x 110,409 ops/sec ±1.85% (95 runs sampled)
json-stringify-safe:   deep          x 8,705 ops/sec ±0.87% (96 runs sampled)
json-stringify-safe:   deep circular x 8,336 ops/sec ±2.20% (93 runs sampled)
```

For stable stringify comparisons, see the performance benchmarks in the [`safe-stable-stringify`][] readme.

## Protip

For deeply nested objects that are not expected to have circular references, you can get the best of both worlds by trying the native `JSON.stringify` first and falling back to `fast-safe-stringify`.

```js
import safeStringify from "https://code4fukui.github.io/fast-safe-stringify/index.js";

function tryJSONStringify(obj) {
  try {
    return JSON.stringify(obj);
  } catch (_) {
    return null;
  }
}

const serializedString = tryJSONStringify(deepObject) || safeStringify(deepObject);
```

## Acknowledgements

Sponsored by [nearForm](http://nearform.com).

## License

MIT

[`replacer`]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/JSON/stringify#The%20replacer%20parameter
[`safe-stable-stringify`]: https://github.com/BridgeAR/safe-stable-stringify
[`space`]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/JSON/stringify#The%20space%20argument
[`toJSON`]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/JSON/stringify#toJSON()_behavior
[JSON.stringify]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/JSON/stringify