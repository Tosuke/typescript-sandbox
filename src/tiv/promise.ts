import { inj, prj, Functor, mapSymbol } from './'

interface PromiseImpl extends Functor<typeof PromiseImpl> {
  _C: PromiseConstructor
}

export const PromiseImpl: PromiseImpl = {
  _C: Promise,
  [mapSymbol]: f => val => inj(PromiseImpl, prj(val).then(f)),
}

declare module './index' {
  // @ts-ignore
  function inj<A>(impl: PromiseImpl, value: Promise<A>): App<PromiseImpl, A>
  // @ts-ignore
  function prj<A>(value: App<PromiseImpl, A>): Promise<A>
}
