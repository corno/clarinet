import * as tokens from "../types/tokens"


export interface IObjectHandler<TokenAnnotation, NonTokenAnnotation> {
    property: ($: {
        token: tokens.SimpleStringToken<TokenAnnotation>
    }) => IRequiredValueHandler<TokenAnnotation, NonTokenAnnotation>
    objectEnd: ($: {
        token: tokens.CloseObjectToken<TokenAnnotation>
    }) => void
}

export interface IArrayHandler<TokenAnnotation, NonTokenAnnotation> {
    element: ($: {
        annotation: NonTokenAnnotation
    }) => IValueHandler<TokenAnnotation, NonTokenAnnotation>
    arrayEnd: ($: {
        token: tokens.CloseArrayToken<TokenAnnotation>
    }) => void
}

export interface ITaggedUnionHandler<TokenAnnotation, NonTokenAnnotation> {
    option: OnOption<TokenAnnotation, NonTokenAnnotation>
    missingOption: () => void
    end: ($: {
        annotation: NonTokenAnnotation
    }) => void
}

export type OnObject<TokenAnnotation, NonTokenAnnotation> = ($: {
    token: tokens.OpenObjectToken<TokenAnnotation>
}) => IObjectHandler<TokenAnnotation, NonTokenAnnotation>

export type OnArray<TokenAnnotation, NonTokenAnnotation> = ($: {
    token: tokens.OpenArrayToken<TokenAnnotation>
}) => IArrayHandler<TokenAnnotation, NonTokenAnnotation>

export type OnSimpleString<TokenAnnotation> = ($: {
    token: tokens.SimpleStringToken<TokenAnnotation>
}) => void

export type OnMultilineString<TokenAnnotation> = ($: {
    token: tokens.MultilineStringToken<TokenAnnotation>
}) => void

export type OnTaggedUnion<TokenAnnotation, NonTokenAnnotation> = ($: {
    token: tokens.TaggedUnionToken<TokenAnnotation>
}) => ITaggedUnionHandler<TokenAnnotation, NonTokenAnnotation>

export type OnOption<TokenAnnotation, NonTokenAnnotation> = ($: {
    token: tokens.SimpleStringToken<TokenAnnotation>
}) => IRequiredValueHandler<TokenAnnotation, NonTokenAnnotation>

export type OnMissing = () => void

export interface IRequiredValueHandler<TokenAnnotation, NonTokenAnnotation> {
    exists: IValueHandler<TokenAnnotation, NonTokenAnnotation>
    missing: OnMissing
}


export interface IValueHandler<TokenAnnotation, NonTokenAnnotation> {
    object: OnObject<TokenAnnotation, NonTokenAnnotation>
    array: OnArray<TokenAnnotation, NonTokenAnnotation>
    multilineString: OnMultilineString<TokenAnnotation>
    simpleString: OnSimpleString<TokenAnnotation>
    taggedUnion: OnTaggedUnion<TokenAnnotation, NonTokenAnnotation>
}

export interface ITreeHandler<TokenAnnotation, NonTokenAnnotation> {
    root: IRequiredValueHandler<TokenAnnotation, NonTokenAnnotation>
    onEnd: (annotation: TokenAnnotation) => void
}
