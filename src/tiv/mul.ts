import { Monoid, zeroSymbol, appendSymbol, inj, prj } from './index'

interface MulMonoid extends Monoid<typeof MulMonoid, number> {}
export const MulMonoid: MulMonoid = {
  [zeroSymbol]: () => inj(MulMonoid, 1),
  [appendSymbol]: (v1, v2) => inj(MulMonoid, prj(v1) * prj(v2))
}

declare module './' {
  // @ts-ignore
  function inj<I extends MulMonoid>(impl: I, val: number): App<I, number>
  // @ts-ignore
  function prj<I extends MulMonoid>(val: App<I, number>): number
}