
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
