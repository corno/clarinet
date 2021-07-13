import * as sp from "./ITreeParser"

export type StackContext = {
    dictionaryDepth: number
    verboseGroupDepth: number
    listDepth: number
    shorthandGroupDepth: number
    taggedUnionDepth: number
}

export interface FlattenedHandler<InTokenAnnotation, InNonTokenAnnotation> {
    objectBegin: ($: {
        token: sp.OpenObjectToken<InTokenAnnotation>
        stackContext: StackContext
    }) => void
    property: ($: {
        propertyToken: sp.SimpleStringToken<InTokenAnnotation>
        objectToken: sp.OpenObjectToken<InTokenAnnotation>
        stackContext: StackContext
        isFirst: boolean
    }) => void
    objectEnd: ($: {
        openToken: sp.OpenObjectToken<InTokenAnnotation>
        token: sp.CloseObjectToken<InTokenAnnotation>
        stackContext: StackContext
        isEmpty: boolean
    }) => void
    arrayBegin: ($: {
        token: sp.OpenArrayToken<InTokenAnnotation>
        stackContext: StackContext
    }) => void
    element: ($: {
        arrayToken: sp.OpenArrayToken<InTokenAnnotation>
        annotation: InNonTokenAnnotation
        stackContext: StackContext
        isFirst: boolean
    }) => void
    arrayEnd: ($: {
        openToken: sp.OpenArrayToken<InTokenAnnotation>
        token: sp.CloseArrayToken<InTokenAnnotation>
        stackContext: StackContext
        isEmpty: boolean
    }) => void
    simpleStringValue: ($: {
        token: sp.SimpleStringToken<InTokenAnnotation>
        stackContext: StackContext
    }) => void
    multilineStringValue: ($: {
        token: sp.MultilineStringToken<InTokenAnnotation>
        stackContext: StackContext
    }) => void
    taggedUnionBegin: ($: {
        token: sp.TaggedUnionToken<InTokenAnnotation>
        stackContext: StackContext
    }) => void
    option: ($: {
        token: sp.SimpleStringToken<InTokenAnnotation>
        stackContext: StackContext
    }) => void
    taggedUnionEnd: ($: {
        annotation: InNonTokenAnnotation
        stackContext: StackContext
    }) => void
}