import { inj, prj, fmap, pure, mzero, mappend, expo } from './'
import { ArrayImpl } from './array'
import { PromiseImpl } from './promise'
import { MulMonoid } from './mul'
import { StringMonoid } from './string'

const f = fmap((n: number) => n * 2)
const arrayResult = prj(f(inj(ArrayImpl, [1, 2, 3])))
console.log(arrayResult) // [2, 4, 6]
const promiseResult = prj(f(pure(PromiseImpl, 1)))
promiseResult.then(res => console.log(res)) // 2

console.log(prj(expo(inj(MulMonoid, 2), 10)))
console.log(prj(expo(inj(StringMonoid, 'hoge'), 10)))