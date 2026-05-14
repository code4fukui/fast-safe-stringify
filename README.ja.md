# fast-safe-stringify

`JSON.stringify`の安全で高速なドロップイン代替ライブラリです。

このライブラリは、エラーを投げることなく循環構造やその他のエッジケースを適切に処理します。また、一貫した出力のための決定的（"stable"）なバージョンも提供します。

## 特徴

- **循環参照の処理**: 循環参照を文字列`"[Circular]"`に置き換えることで、`TypeError: Converting circular structure to JSON`を防ぎます。
- **高いパフォーマンス**: 他の安全な文字列化の代替手段よりもはるかに高速です。[ベンチマーク](#benchmarks)を参照してください。
- **安定した出力**: オプションの`stableStringify`関数により、オブジェクトのキーをソートして決定的な出力を保証します。
- **馴染みのあるAPI**: `replacer`や`space`引数のサポートを含め、標準の`JSON.stringify`のシグネチャを模倣しています。
- **再帰の制御**: `depthLimit`および`edgesLimit`オプションを使用して、深くネストされたオブジェクトによる問題を防ぎます。

## 使い方

APIは標準の`JSON.stringify`と同じです。

`stringify(value[, replacer[, space[, options]]])`

### 基本的な例

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

### 安定した（決定的な）文字列化

一貫した出力が必要な場合は、`stableStringify`を使用します。シリアライズ前にオブジェクトのキーをソートします。

```js
import { stableStringify } from "https://code4fukui.github.io/fast-safe-stringify/index.js";

const obj = { c: 3, b: 2, a: 1 };
obj.o = obj;

console.log(stableStringify(obj));
// '{"a":1,"b":2,"c":3,"o":"[Circular]"}'
```

### Replacerとオプションの使用

`replacer`関数と`options`オブジェクトを使用してシリアライズを制御できます。

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

### 置換文字列

- `[Circular]` - 循環参照が検出されたときに使用されます。
- `[...]` - `depthLimit`または`edgesLimit`に達したときに使用されます。

## `JSON.stringify`との違い

APIには互換性がありますが、特に`toJSON`や`replacer`関数を使用する際の動作にいくつかの重要な違いがあります。

### `safeStringify`（通常版）

- `toJSON`や`replacer`関数内で、入力値の循環部分を操作することはできません。
- 循環構造が検出された場合、`replacer`関数はオブジェクトの参照そのものではなく、文字列`"[Circular]"`を値として受け取ります。

### `stableStringify`（決定的版）

- `toJSON`や`replacer`関数内で入力オブジェクトを操作しても、出力には影響しません。出力は、関数に渡された時点でのオブジェクトの状態に完全に基づきます。
- 通常版と同様に、`replacer`は循環参照に対して`"[Circular]"`を受け取ります。

これらの制限がない、より高速で副作用のないバリエーションが[`safe-stable-stringify`][]モジュールで利用可能ですが、これは実験的なものと見なされています。

## ベンチマーク

`util.inspect`および`json-stringify-safe`とのパフォーマンス比較。

*(Lenovo T450s、i7-5600U CPU、Node.js 8.9.4での結果)*

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

安定した文字列化の比較については、[`safe-stable-stringify`][]のREADMEにあるパフォーマンスベンチマークを参照してください。

## 役立つヒント

循環参照が含まれると予想されない深くネストされたオブジェクトの場合、最初にネイティブの`JSON.stringify`を試し、失敗した場合に`fast-safe-stringify`にフォールバックすることで、両方の利点を活かすことができます。

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

## 謝辞

[nearForm](http://nearform.com)によるスポンサード。

## ライセンス

MIT

[`replacer`]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/JSON/stringify#The%20replacer%20parameter
[`safe-stable-stringify`]: https://github.com/BridgeAR/safe-stable-stringify
[`space`]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/JSON/stringify#The%20space%20argument
[`toJSON`]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/JSON/stringify#toJSON()_behavior
[JSON.stringify]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/JSON/stringify
