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
  function inj<A, I extends ArrayImpl>(impl: I, value: Array<A>): App<I, A>
  // @ts-ignore
  function prj<A, I extends ArrayImpl>(value: App<I, A>): Array<A>
}
