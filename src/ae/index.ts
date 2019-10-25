declare const phantom: unique symbol

interface Eff<K extends string, A, B> {
  [phantom]: B
  kind: K
  value: A
}

type GetEff = Eff<'Get', void, number>
function get(): GetEff {
  return {
    kind: 'Get',
  } as GetEff
}

type SetEff = Eff<'Set', number, void>
function set(value: number): SetEff {
  return {
    kind: 'Set',
    value,
  } as SetEff
}

type LogEff = Eff<'Log', unknown, void>
function log(value: unknown): LogEff {
  return {
    kind: 'Log',
    value,
  } as LogEff
}

type UnionToIntersection<A> = (A extends (infer B) ? (x: B) => void : never) extends (x: infer C) => void ? C : never

type EffResolver<E extends Eff<string, any, any>> = UnionToIntersection<
  E extends Eff<infer K, infer A, infer B> ? Record<K, (value: A) => Promise<B>> : never
>

const logResolver: EffResolver<LogEff> = {
  Log: async value => {
    console.log(value)
  },
}

const createStateResolver = (initial: number): EffResolver<GetEff | SetEff> => ({
  Get: () => Promise.resolve(initial),
  Set: async v => {
    initial = v
  },
})

type InferEffectsFromResolvers<RS extends EffResolver<Eff<string, any, any>>> = {
  [Key in keyof RS]: [Key, RS[Key]]
}[keyof RS] extends [infer K, (value: infer A) => Promise<infer B>]
  ? K extends string
    ? Eff<K, A, B>
    : never
  : never

type Runner<ES extends Eff<string, any, any>> = <R, E extends ES>(gen: Generator<E, R, unknown>) => Promise<R>

const createRunner = <RS extends EffResolver<Eff<string, any, any>>>(
  resolver: RS,
): Runner<InferEffectsFromResolvers<RS>> => gen =>
  new Promise<any>((res, rej) => {
    const resolveEff = (eff: Eff<string, any, any>) =>
      (resolver as Record<string, (value: unknown) => Promise<unknown>>)[eff.kind](eff.value)

    const loop = (err?: unknown, value?: unknown) => {
      try {
        let r: IteratorResult<InferEffectsFromResolvers<RS>, unknown>
        if (err) {
          r = gen.throw(err)
        } else {
          r = gen.next(value)
        }
        if (r.done) {
          res(r.value)
          return
        }
        resolveEff(r.value).then(val => loop(undefined, val), err => loop(err))
      } catch (e) {
        rej(e)
      }
    }
    loop(undefined, undefined)
  })

const runner = createRunner({ ...logResolver, ...createStateResolver(0) })

type Cond = Generator<'A' | 'B', any, any> extends Generator<'A', any, any> ? true : false

function* main() {
  // const value: number = yield get()
  yield log('hogehoge')
}

const gen = main()

runner(gen)
  .then(() => console.log('fulfilled'))
  .catch(e => console.error(e))
