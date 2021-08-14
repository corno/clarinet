import {
    CloseArrayToken,
    CloseObjectToken,
    MultilineStringToken,
    OpenArrayToken,
    OpenObjectToken,
    SimpleStringToken,
    TaggedUnionToken,
} from "./ITreeParser"


export interface ObjectHandler<TokenAnnotation, NonTokenAnnotation> {
    property: ($: {
        token: SimpleStringToken<TokenAnnotation>
    }) => RequiredValueHandler<TokenAnnotation, NonTokenAnnotation>
    objectEnd: ($: {
        token: CloseObjectToken<TokenAnnotation>
    }) => void
}

export interface ArrayHandler<TokenAnnotation, NonTokenAnnotation> {
    element: ($: {
        annotation: NonTokenAnnotation
    }) => ValueHandler<TokenAnnotation, NonTokenAnnotation>
    arrayEnd: ($: {
        token: CloseArrayToken<TokenAnnotation>
    }) => void
}

export interface TaggedUnionHandler<TokenAnnotation, NonTokenAnnotation> {
    option: OnOption<TokenAnnotation, NonTokenAnnotation>
    missingOption: () => void
    end: ($: {
        annotation: NonTokenAnnotation
    }) => void
}

export type OnObject<TokenAnnotation, NonTokenAnnotation> = ($: {
    token: OpenObjectToken<TokenAnnotation>
}) => ObjectHandler<TokenAnnotation, NonTokenAnnotation>

export type OnArray<TokenAnnotation, NonTokenAnnotation> = ($: {
    token: OpenArrayToken<TokenAnnotation>
}) => ArrayHandler<TokenAnnotation, NonTokenAnnotation>

export type OnSimpleString<TokenAnnotation> = ($: {
    token: SimpleStringToken<TokenAnnotation>
}) => void

export type OnMultilineString<TokenAnnotation> = ($: {
    token: MultilineStringToken<TokenAnnotation>
}) => void

export type OnTaggedUnion<TokenAnnotation, NonTokenAnnotation> = ($: {
    token: TaggedUnionToken<TokenAnnotation>
}) => TaggedUnionHandler<TokenAnnotation, NonTokenAnnotation>

export type OnOption<TokenAnnotation, NonTokenAnnotation> = ($: {
    token: SimpleStringToken<TokenAnnotation>
}) => RequiredValueHandler<TokenAnnotation, NonTokenAnnotation>

export type OnMissing = () => void

export interface RequiredValueHandler<TokenAnnotation, NonTokenAnnotation> {
    exists: ValueHandler<TokenAnnotation, NonTokenAnnotation>
    missing: OnMissing
}

export interface TreeHandler<TokenAnnotation, NonTokenAnnotation> {
    root: RequiredValueHandler<TokenAnnotation, NonTokenAnnotation>
    onEnd: (annotation: TokenAnnotation) => void
}

export interface ValueHandler<TokenAnnotation, NonTokenAnnotation> {
    object: OnObject<TokenAnnotation, NonTokenAnnotation>
    array: OnArray<TokenAnnotation, NonTokenAnnotation>
    multilineString: OnMultilineString<TokenAnnotation>
    simpleString: OnSimpleString<TokenAnnotation>
    taggedUnion: OnTaggedUnion<TokenAnnotation, NonTokenAnnotation>
}
