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
  function inj<A, I extends PromiseImpl>(impl: I, value: Promise<A>): App<I, A>
  // @ts-ignore
  function prj<A, I extends PromiseImpl>(value: App<I, A>): Promise<A>
}
