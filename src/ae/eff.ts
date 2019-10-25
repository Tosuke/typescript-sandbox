declare const Return: unique symbol

export interface Effect<K extends string, A, B> {
  readonly kind: K
  readonly value: A
  [Return]: B
}
export type AnyEffect = Effect<string, any, any>

export type Eff<E extends AnyEffect, A> = Generator<E, A, unknown>

const identity = <A>(x: A): A => x

function makeFilter<E extends AnyEffect>(
  filter: (e: AnyEffect) => e is E,
): <IE extends AnyEffect>(e: IE) => e is Extract<IE, E> {
  return filter as (<IE extends AnyEffect>(e: IE) => e is Extract<IE, E>)
}

type EffectWithCont<E extends AnyEffect, B> = E extends any
  ? Readonly<{ kind: E['kind']; value: E['value']; k: (x: E[typeof Return]) => B }>
  : never

const createHandler = <A, B, C = B, IE extends AnyEffect = AnyEffect, E extends AnyEffect = AnyEffect>(
  pure: (x: A) => B,
  filter: (e: IE) => e is Extract<IE, E>,
  handle: (e: EffectWithCont<E, B>) => B,
  finally_: (x: B) => C,
) => (eff: Eff<E, A>): C => {
  const _loop = (val?: unknown): B => {
    const r = eff.next(val)
    if (r.done) {
      return pure(r.value)
    }
    const e = r.value
    const ewc = {
      kind: e.kind,
      value: e.value,
      k: _loop,
    } as EffectWithCont<E, B>
    return handle(ewc)
  }
  return finally_(_loop())
}

type EffectsFromEff<E extends Eff<AnyEffect, any>> = E extends Eff<infer F, any> ? F : never
type ResultsFromEff<E extends Eff<AnyEffect, any>> = E extends Eff<any, infer R> ? R : never
type UnionToIntersection<A> = (A extends any ? (x: A) => any : never) extends (x: infer B) => any ? B : never

const edo = <E extends Eff<AnyEffect, any>, A>(
  gen: () => Generator<E, A, UnionToIntersection<ResultsFromEff<E>>>,
): Eff<EffectsFromEff<E>, A> => {
  function* f(): Eff<EffectsFromEff<E>, A> {
    const iter = gen()
    let val: any = undefined
    while (true) {
      const r = iter.next(val)
      if (r.done) {
        return r.value
      }
      const iiter = r.value
      while (true) {
        const r2 = iiter.next()
      }
    }
  }
  return f()
}

const liftEff = <AS extends any[], E extends AnyEffect>(
  f: (...args: AS) => E,
): ((...args: AS) => Eff<E, E[typeof Return]>) =>
  function*(...args: AS) {
    const r: E[typeof Return] = yield f(...args)
    return r
  }

type LogEff = Effect<'Log', unknown, void>

type GetEff = Effect<'Get', void, number>
type SetEff = Effect<'Set', number, void>

const getEff = liftEff(() => ({ kind: 'Get' } as GetEff))
const setEff = liftEff((value: number) => ({ kind: 'Set', value } as SetEff))

type StateEff = GetEff | SetEff

type State<A> = (s: number) => [A, number]

const handleState = (initial: number) =>
  createHandler(
    <A>(x: A): State<A> => s => [x, s],
    makeFilter((e): e is StateEff => e.kind === 'Get' || e.kind === 'Set'),
    e => {
      if (e.kind === 'Get') {
        return s => e.k(s)(s)
      } else {
        return _ => e.k()(e.value)
      }
    },
    <A>(x: State<A>) => x(initial)[0],
  )

const handleLog = createHandler(
  identity,
  makeFilter((e): e is LogEff => e.kind === 'Log'),
  e => {
    console.log(e.value)
    return e.k()
  },
  identity,
)

const inc = () =>
  edo(function*() {
    const v: number = yield getEff()
    yield setEff(v + 1)
  })

const main = () =>
  edo(function*() {
    const a: number = yield getEff()
    yield setEff(a + 1)
    const b: number = yield getEff()
    return [b, b + 1]
  })

const handled = handleState(0)(
  edo(function*() {
    const a: number = yield getEff()
    return a
  }),
)
console.log(handled)
