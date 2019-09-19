import { App, inj, prj, Functor, mapSymbol } from './'

interface ArrayImpl extends Functor<typeof ArrayImpl> {
  _C: ArrayConstructor
}

export const ArrayImpl: ArrayImpl = {
  _C: Array,
  [mapSymbol]: f => val => inj(ArrayImpl, prj(val).map(f)),
}

declare module './index' {
  // @ts-ignore
  function inj<A>(impl: ArrayImpl, value: Array<A>): App<ArrayImpl, A>
  // @ts-ignore
  function prj<A>(value: App<ArrayImpl, A>): Array<A>
}
