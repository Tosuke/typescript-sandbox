type UnPromise<T> = T extends Promise<infer S> ? S : never
type Diff<T,U> = T extends U ? never : T
type MapUnPromiseToTuple<TS extends Promise<any>[]> = Array<UnPromise<TS[-1]>> & {
  [P in Diff<keyof TS, keyof Array<UnPromise<TS[-1]>>>]: UnPromise<TS[P]>
}

function PromiseAll<TS extends Promise<any>[]>(...promises: TS): Promise<MapUnPromiseToTuple<TS>> {
  return Promise.all(promises) as Promise<MapUnPromiseToTuple<TS>>
}

PromiseAll(Promise.resolve(1), Promise.resolve(''), Promise.resolve(null)).then(([a, b, c]) => {
  // a <- number
  // b <- string
  // c <- null
  console.log(a, b, c)
})