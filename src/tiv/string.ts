import { Monoid, zeroSymbol, appendSymbol, prj, inj } from './'

interface StringMonoid extends Monoid<typeof StringMonoid> {}
export const StringMonoid: StringMonoid = {
  [zeroSymbol]: () => inj(StringMonoid, ''),
  [appendSymbol]: (v1, v2) => inj(StringMonoid, prj(v1) + prj(v2))
}

declare module './' {
  // @ts-ignore
  function inj<I extends StringMonoid>(impl: I, val: string): App<I, string>
  // @ts-ignore
  function prj<I extends StringMonoid>(val: App<I, string>): string
}