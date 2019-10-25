import { pure } from '../tiv'

/// Effect Def
declare const Return: unique symbol

abstract class Effect<A> {
  [Return]!: A
  constructor() {
    ;(this as any).k = () => {}
  }
}
type AnyEffect = Effect<any>

/// Eff Monad Def
export type Eff<E extends AnyEffect, A> = Pure<E, A> | Impure<E, A>

class Pure<E extends AnyEffect, A> {
  constructor(readonly value: A) {}

  map<B>(f: (x: A) => B): Eff<E, B> {
    return new Pure(f(this.value))
  }

  chain<E1 extends AnyEffect, B>(f: (x: A) => Eff<E1, B>): Eff<E | E1, B> {
    return f(this.value)
  }
}

class Impure<E extends AnyEffect, A> {
  constructor(readonly effect: E, readonly k: <R extends E[typeof Return]>(x: R) => Eff<E, A>) {}

  map<B>(f: (x: A) => B): Eff<E, B> {
    return this.chain(x => new Pure(f(x)))
  }

  chain<E1 extends AnyEffect, B>(f: (x: A) => Eff<E1, B>): Eff<E | E1, B> {
    return new Impure<E | E1, B>(this.effect, x => this.k(x).chain(f))
  }
}

/// Eff Utils
const pureEff = <E extends AnyEffect = never>() => <A>(x: A): Eff<E, A> => new Pure(x)
const liftEff = <AS extends any[], E extends Effect<any>>(effect: new (...args: AS) => E) => (
  ...args: AS
): Eff<E, E[typeof Return]> => new Impure(new effect(...args), pureEff())
const runEff = <A>(eff: Eff<never, A>): A => (eff as Pure<never, A>).value

type InferEffects<E extends Eff<AnyEffect, any>> = E extends Eff<infer F, any> ? F : never
const edo = <E extends Eff<AnyEffect, any>, A>(gen: () => Generator<E, A, any>): Eff<InferEffects<E>, A> => {
  const iter = gen()
  const loop = (val?: any): Eff<InferEffects<E>, A> => {
    const r = iter.next(val)
    if (r.done) {
      return pureEff()(r.value)
    } else {
      const eff = (r.value as any) as Eff<InferEffects<E>, any>
      return eff.chain(loop)
    }
  }
  return loop()
}

/// Handler
type EffectConstructor<E extends AnyEffect> = new (...args: any[]) => E
type RunnerFn<B, E extends AnyEffect> = (effect: E, k: (x: E[typeof Return]) => B) => B
type Runner<B, E extends AnyEffect> = [EffectConstructor<E>, RunnerFn<B, E>]
type InferRunnerEffect<R extends Runner<any, AnyEffect>> = R extends Runner<any, infer E> ? E : never
type RunnerConstructFn<A, B> = <Runners extends Runner<any, any>[]>(
  ...runners: Runners
) => (fx: Eff<InferRunnerEffect<Runners[number]>, A>) => B
type RunnerMatchFn<B> = <E extends AnyEffect>(e: EffectConstructor<E>, f: RunnerFn<B, E>) => Runner<B, E>

const runnerMatchImpl: RunnerMatchFn<any> = (e, f) => [e, f]

const runnerConstructImpl = <A, B>(pure: (x: A) => B): RunnerConstructFn<A, B> => (...runners) => {
  return function handle(fx: Eff<AnyEffect, A>): B {
    if (fx instanceof Pure) return pure(fx.value)
    for (const [cls, fn] of runners as Runner<B, AnyEffect>[]) {
      if (fx.effect instanceof cls) {
        const k = (x: any): B => handle(fx.k(x))
        return fn(fx.effect, k)
      }
    }
    throw 'unreachable'
  }
}

const createRunner = <A, B, IE extends AnyEffect>(
  pure: (x: A) => B,
  impure: (construct: RunnerConstructFn<A, B>, match: RunnerMatchFn<B>) => (fx: Eff<IE, A>) => B,
): ((fx: Eff<IE, A>) => B) => impure(runnerConstructImpl(pure), runnerMatchImpl)

interface OtherEffects extends Effect<never> {}
type HandlerFn<B, E extends AnyEffect, AE extends AnyEffect> = (
  effect: E,
  k: (x: E[typeof Return]) => Eff<AE | OtherEffects, B>,
) => Eff<AE | OtherEffects, B>
type Handler<B, E extends AnyEffect, AE extends AnyEffect> = [EffectConstructor<E>, HandlerFn<B, E, AE>]

type InferHandlerEffects<H, AE extends AnyEffect> = H extends Handler<any, infer E, AE> ? E : never
type HandlerConstructFn<A, B, AE extends AnyEffect> = <Handlers extends Handler<B, any, AE>[]>(
  ...handlers: Handlers
) => <IE extends AnyEffect>(fx: Eff<IE, A>) => Eff<Exclude<IE, InferHandlerEffects<Handlers[number], AE>> | AE, B>
type HandlerMatchFn<B, AE extends AnyEffect> = <E extends AnyEffect>(
  e: EffectConstructor<E>,
  f: HandlerFn<B, E, AE>,
) => Handler<B, E, AE>

const handlerMatchImpl: HandlerMatchFn<any, any> = (e, f) => [e, f]

const handlerConstructImpl = <A, B, AE extends AnyEffect>(
  pure: (x: A) => Eff<AE, B>,
): HandlerConstructFn<A, B, AnyEffect> => (...handlers) =>
  function handle(fx: Eff<AnyEffect, A>): Eff<AnyEffect, B> {
    if (fx instanceof Pure) return pure(fx.value)
    for (const [cls, fn] of handlers as Handler<B, AnyEffect, AnyEffect>[]) {
      if (fx.effect instanceof cls) {
        const k = (x: any): Eff<AnyEffect, B> => handle(fx.k(x))
        return fn(fx.effect, k)
      }
    }
    return new Impure(fx.effect, (x: any) => handle(fx.k(x)))
  }

const createHandler = <AE extends AnyEffect = never>() => <A, B, IE extends AnyEffect, OE extends AnyEffect>(
  pure: (x: A) => Eff<AE, B>,
  impure: (construct: HandlerConstructFn<A, B, AE>, match: HandlerMatchFn<B, AE>) => (fx: Eff<IE, any>) => Eff<OE, any>,
): ((fx: Eff<IE, A>) => Eff<OE, B>) => impure(handlerConstructImpl(pure), handlerMatchImpl)

/// Effect
class AskEffect extends Effect<number> {
  constructor() {
    super()
  }
}
type ReaderEffect = AskEffect
const ask = liftEff(AskEffect)

class TellEffect extends Effect<void> {
  constructor(readonly msg: string) {
    super()
  }
}
type WriterEffect = TellEffect
const tell = liftEff(TellEffect)

class IOEffect<A> extends Effect<A> {
  constructor(readonly f: () => Promise<A>) {
    super()
  }
}
const doIO = liftEff(IOEffect)

class GetEffect extends Effect<number> {
  constructor() {
    super()
  }
}
class SetEffect extends Effect<void> {
  constructor(readonly value: number) {
    super()
  }
}
type StateEffect = GetEffect | SetEffect
const getEff = liftEff(GetEffect)
const setEff = liftEff(SetEffect)

/// Handler Def

const handleReader = (env: number) =>
  createHandler()(pureEff(), (construct, match) =>
    construct(
      match(AskEffect, (_, k) => {
        return k(env)
      }),
    ),
  )

const handleWriter = createHandler()(
  <A>(x: A) => pureEff()<[A, string[]]>([x, []]),
  (construct, match) =>
    construct(
      match(TellEffect, (e, k) => {
        return k().map(([a, es]) => [a, [e.msg, ...es]])
      }),
    ),
)

const handleStdoutWriter = createHandler()(pureEff(), (construct, match) =>
  construct(
    match(TellEffect, (e, k) => {
      console.log(e.msg)
      return k()
    }),
  ),
)

const isGetEff = <A>(fx: Impure<AnyEffect, A>): fx is Impure<GetEffect, A> => fx.effect instanceof GetEffect
const isSetEff = <A>(fx: Impure<AnyEffect, A>): fx is Impure<SetEffect, A> => fx.effect instanceof SetEffect
const handleState = (initial: number) => <A, E extends AnyEffect>(
  fx0: Eff<E, A>,
): Eff<Exclude<E, StateEffect>, [A, number]> => {
  function handle<A, E extends AnyEffect>(fx: Eff<E, A>, s: number): Eff<Exclude<E, StateEffect>, [A, number]> {
    if (fx instanceof Pure) return pureEff()([fx.value, s])
    if (isGetEff(fx)) {
      return handle(fx.k(s), s)
    } else if (isSetEff(fx)) {
      return handle(fx.k(undefined), fx.effect.value)
    } else {
      return new Impure<any, any>(fx.effect, (x: any) => handle(fx.k(x), s))
    }
  }
  return handle(fx0, initial)
}

const runIO = createRunner(
  <A>(x: A) => Promise.resolve(x),
  (construct, match) =>
    construct(
      match(IOEffect, (e, k) => {
        return e.f().then(k)
      }),
    ),
)

/// use
const main = () =>
  edo(function*() {
    yield tell('Hello')
    yield doIO(() => new Promise(r => setTimeout(r, 1000)))
    yield tell('world')
    const env: number = yield ask()
    return env
  })

const result = runIO(handleWriter(handleReader(57)(main())))
result.then(x => console.log(x))
