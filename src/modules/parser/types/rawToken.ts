
export type Wrapping =
| ["quote", {
    terminated: boolean
}]
| ["apostrophe", {
    terminated: boolean
}]
| ["none", {
}]

export type SimpleStringData = {
wrapping: Wrapping
value: string
}

export type MultilineStringData = {
lines: string[]
terminated: boolean
}

export type StructuralTokenData = {
char: number
// | ["!"]
// | ["<"]
// | [">"]
// | ["("]
// | [")"]
// | ["{"]
// | ["}"]
// | ["["]
// | ["]"]
}

export enum TokenType {
Structural,
SimpleString,
MultilineString,
}

export type Token2<Annotation> = {
annotation: Annotation
type:
| [TokenType.Structural, StructuralTokenData]
| [TokenType.SimpleString, SimpleStringData]
| [TokenType.MultilineString, MultilineStringData]
}