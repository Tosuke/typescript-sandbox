// Type Indexed Value の基本定義
export class App<C, A> {
  private _A!: A
  constructor(readonly impl: C, readonly value: unknown) {}
}

interface Inj {
  (impl: never, value: unknown): App<unknown, unknown>
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

// Monoid
export const zeroSymbol = Symbol()
export const appendSymbol = Symbol()
export interface Monoid<M = any, A = any> {
  readonly [zeroSymbol]: () => App<M, A>
  readonly [appendSymbol]: (v1: App<M, A>, v2: App<M, A>) => App<M, A>
}

export function mzero<M extends Monoid, A>(impl: Monoid<M, A>): App<M, A> {
  return impl[zeroSymbol]()
}

export function mappend<M extends Monoid, A>(impl: Monoid<M, A>): (v1: App<M, A>, v2: App<M, A>) => App<M, A> {
  return impl[appendSymbol]
}

// モノイドべき乗
export function expo<M extends Monoid<M, A>, A>(base: App<M, A>, expo: number): App<M, A> {
  const impl = base.impl
  const zero = mzero(impl)
  const append = mappend(impl)
  let a = zero,
    b = base
  while (expo > 0) {
    if (expo & 1) a = append(a, b)
    b = append(b, b)
    expo >>= 1
  }
  return a
}
