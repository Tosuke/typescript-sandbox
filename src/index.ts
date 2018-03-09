type Schema = {
  orange: string
  apple: number
  banana: {
    isFruit: boolean
  }
}

type ArrayType<A> = A extends Array<infer T> ? T : never

type PrimitiveTypes = string | number | boolean
type PrimitiveTypedMemberKeys<
  S,
  K extends keyof S
> = K extends (S[K] extends PrimitiveTypes ? any : never) ? K : never
type PrimitiveTypedMembers<S> = Pick<S, PrimitiveTypedMemberKeys<S, keyof S>>

type Parameters = {
  [key: string]: PrimitiveTypes
}

type Directive = {
  $param?: Parameters
}

type IfDirectiveParameters = {
  if: boolean
}

type Directives = {
  include?: IfDirectiveParameters
  skip?: IfDirectiveParameters
} & {
  [key: string]: Parameters
}

type WithDirectives<T> = T extends any ? T | [Directives, T] : never

type Query<S> = {
  $members?: Array<WithDirectives<keyof PrimitiveTypedMembers<S>>>
}

type SimpleMemberKeys<
  K extends [Directives, string] | string
> = K extends string ? K : never
type NonNullDecoratedMemberKeys<
  K extends [Directives, string] | string
> = K extends [infer D, infer T]
  ? (keyof D extends 'include' | 'skip' ? never : T)
  : never
type NullableDecoratedMemberKeys<
  K extends [Directives, string] | string
> = K extends [infer D, infer T]
  ? (keyof D extends 'include' | 'skip' ? T : never)
  : never
type MemberSelectionsSet<S, K extends [Directives, keyof S] | keyof S> = {
  [P in SimpleMemberKeys<K>]: S[P]
} &
  { [P in NonNullDecoratedMemberKeys<K>]: S[P] } &
  { [P in NullableDecoratedMemberKeys<K>]?: S[P] }

type RemoveDirectives<T> = T extends [Directives, infer S] ? S : T

type SelectionsSet<S, Q extends Query<S>> = '$members' extends keyof Q
  ? MemberSelectionsSet<S, ArrayType<Q['$members']>>
  : {}

function query<Q extends Query<Schema>>(query: Q): SelectionsSet<Schema, Q> {
  let res: SelectionsSet<Schema, Q>
  return res
}

let res = query({
  $members: ['orange', [{ include: { if: false } }, 'apple']]
}) // --> { orange: string, apple?: number}
