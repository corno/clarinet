export type Token<Data, TokenAnnotation> = {
    data: Data
    annotation: TokenAnnotation
}

export type OpenObject = {
    type:
    | ["verbose group"]
    | ["dictionary"]
}

export type OpenArray = {
    type:
    | ["shorthand group"]
    | ["list"]
}

export type SimleStringWrapping =
    | ["apostrophe", {
    }]
    | ["none", {
    }]
    | ["quote", {
    }]

export type SimpleString = {
    wrapping: SimleStringWrapping
    value: string
}

export type MultilineString = {
    lines: string[]
}

export type CloseObject = {
}

export type CloseArray = {
}

export type TaggedUnion = {
}


export type CloseArrayToken<TokenAnnotation> = Token<CloseArray, TokenAnnotation>

export type CloseObjectToken<TokenAnnotation>  = Token<CloseObject, TokenAnnotation>

export type OpenArrayToken<TokenAnnotation> = Token<OpenArray, TokenAnnotation>

export type OpenObjectToken<TokenAnnotation> = Token<OpenObject, TokenAnnotation>

export type SimpleStringToken<TokenAnnotation> = Token<SimpleString, TokenAnnotation>

export type MultilineStringToken<TokenAnnotation> = Token<MultilineString, TokenAnnotation>

export type TaggedUnionToken<TokenAnnotation> = Token<TaggedUnion, TokenAnnotation>

export interface ITreeParser<TokenAnnotation> {
    closeArray(
        token: CloseArrayToken<TokenAnnotation>,
    ): void
    closeObject(
        token: CloseObjectToken<TokenAnnotation>,
    ): void
    openArray(
        token: OpenArrayToken<TokenAnnotation>,
    ): void
    openObject(
        token: OpenObjectToken<TokenAnnotation>,
    ): void
    simpleString(
        token: SimpleStringToken<TokenAnnotation>,
    ): void
    multilineString(
        token: MultilineStringToken<TokenAnnotation>,
    ): void
    taggedUnion(
        token: TaggedUnionToken<TokenAnnotation>,
    ): void
    forceEnd(
        annotation: TokenAnnotation
    ): void
}
