import { inj, prj, fmap } from './'
import { ArrayImpl } from './array'
import { PromiseImpl } from './promise'

const f = fmap((n: number) => n * 2)
const arrayResult = prj(f(inj(ArrayImpl, [1, 2, 3])))
console.log(arrayResult) // [2, 4, 6]
const promiseResult = prj(f(inj(PromiseImpl, Promise.resolve(1))))
promiseResult.then(res => console.log(res)) // 2