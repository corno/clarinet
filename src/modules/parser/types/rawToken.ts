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

export type StructuralTokenType =
    | ["header start"]
    | ["tagged union start"]
    | ["open shorthand group"]
    | ["close shorthand group"]
    | ["open verbose group"]
    | ["close verbose group"]
    | ["open dictionary"]
    | ["close dictionary"]
    | ["open list"]
    | ["close list"]

export type StructuralTokenData = {
    type: StructuralTokenType
}

export enum TokenType {
    Structural,
    SimpleString,
    MultilineString,
}

export type Comments = {
    before: string[]
    after: string | null
}

export type Token2<Annotation> = {
    comments: Comments
    annotation: Annotation
    type:
    | [TokenType.Structural, StructuralTokenData]
    | [TokenType.SimpleString, SimpleStringData]
    | [TokenType.MultilineString, MultilineStringData]
}