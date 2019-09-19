// Type Indexed Value の基本定義
export class App<C, A> {
  private _A!: A
  constructor(readonly impl: C, readonly value: unknown) {}
}

export function inj(impl: never, value: any): App<unknown, unknown> {
  return new App(impl, value)
}

export function prj(value: App<never, never>): unknown {
  return value.value
}

// Functor の定義
export const mapSymbol = Symbol()
export interface Functor<F = any> {
  readonly [mapSymbol]: <A, B>(f: (x: A) => B) => (value: App<F, A>) => App<F, B>
}
export function fmap<A, B>(f: (x: A) => B): <F extends Functor>(value: App<F, A>) => App<F, B> {
  return value => value.impl[mapSymbol](f)(value)
}

