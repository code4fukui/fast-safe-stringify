import * as t from "https://deno.land/std/testing/asserts.ts";
import fss from "./index.js";
const s = JSON.stringify

Deno.test('circular reference to root', function (assert) {
  const fixture = { name: 'Tywin Lannister' }
  fixture.circle = fixture
  const expected = s({ name: 'Tywin Lannister', circle: '[Circular]' })
  const actual = fss(fixture)
  t.assertEquals(actual, expected)
})
