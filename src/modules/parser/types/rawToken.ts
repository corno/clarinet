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


export const Punctuation = {
    exclamationMark: 0x21,   // !
    verticalLine: 0x7C,      // |
    comma: 0x2C,             // ,
    colon: 0x3A,             // :
    openBrace: 0x7B,         // {
    closeBrace: 0x7D,        // }
    openParen: 0x28,         // )
    closeParen: 0x29,        // )
    openBracket: 0x5B,       // [
    closeBracket: 0x5D,      // ]
    openAngleBracket: 0x3C,  // <
    closeAngleBracket: 0x3E, // >
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