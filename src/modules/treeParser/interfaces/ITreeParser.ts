import * as tokens from "../types/tokens"

export interface ITreeParser<TokenAnnotation> {
    closeArray(
        token: tokens.CloseArrayToken<TokenAnnotation>,
    ): void
    closeObject(
        token: tokens.CloseObjectToken<TokenAnnotation>,
    ): void
    openArray(
        token: tokens.OpenArrayToken<TokenAnnotation>,
    ): void
    openObject(
        token: tokens.OpenObjectToken<TokenAnnotation>,
    ): void
    simpleString(
        token: tokens.SimpleStringToken<TokenAnnotation>,
    ): void
    multilineString(
        token: tokens.MultilineStringToken<TokenAnnotation>,
    ): void
    taggedUnion(
        token: tokens.TaggedUnionToken<TokenAnnotation>,
    ): void
    forceEnd(
        annotation: TokenAnnotation
    ): void
}