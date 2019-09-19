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
export const pureSymbol = Symbol()
export const mapSymbol = Symbol()
export interface Functor<F = any> {
  readonly [pureSymbol]: <A>(value: A) => App<F, A>
  readonly [mapSymbol]: <A, B>(f: (x: A) => B) => (value: App<F, A>) => App<F, B>
}

export function pure<F extends Functor, A>(impl: F, value: A): App<F, A> {
  return impl[pureSymbol](value)
}

export function fmap<A, B>(f: (x: A) => B): <F extends Functor>(value: App<F, A>) => App<F, B> {
  return value => value.impl[mapSymbol](f)(value)
}

