import * as tokens from "../../treeParser/types/tokens"
import * as sc from "../types/StackContext"

export interface IFlattenedHandler<InTokenAnnotation, InNonTokenAnnotation> {
    objectBegin: ($: {
        token: tokens.OpenObjectToken<InTokenAnnotation>
        stackContext: sc.StackContext
    }) => void
    property: ($: {
        propertyToken: tokens.SimpleStringToken<InTokenAnnotation>
        objectToken: tokens.OpenObjectToken<InTokenAnnotation>
        stackContext: sc.StackContext
        isFirst: boolean
    }) => void
    objectEnd: ($: {
        openToken: tokens.OpenObjectToken<InTokenAnnotation>
        token: tokens.CloseObjectToken<InTokenAnnotation>
        stackContext: sc.StackContext
        isEmpty: boolean
    }) => void
    arrayBegin: ($: {
        token: tokens.OpenArrayToken<InTokenAnnotation>
        stackContext: sc.StackContext
    }) => void
    element: ($: {
        arrayToken: tokens.OpenArrayToken<InTokenAnnotation>
        annotation: InNonTokenAnnotation
        stackContext: sc.StackContext
        isFirst: boolean
    }) => void
    arrayEnd: ($: {
        openToken: tokens.OpenArrayToken<InTokenAnnotation>
        token: tokens.CloseArrayToken<InTokenAnnotation>
        stackContext: sc.StackContext
        isEmpty: boolean
    }) => void
    simpleStringValue: ($: {
        token: tokens.SimpleStringToken<InTokenAnnotation>
        stackContext: sc.StackContext
    }) => void
    multilineStringValue: ($: {
        token: tokens.MultilineStringToken<InTokenAnnotation>
        stackContext: sc.StackContext
    }) => void
    taggedUnionBegin: ($: {
        token: tokens.TaggedUnionToken<InTokenAnnotation>
        stackContext: sc.StackContext
    }) => void
    option: ($: {
        token: tokens.SimpleStringToken<InTokenAnnotation>
        stackContext: sc.StackContext
    }) => void
    taggedUnionEnd: ($: {
        annotation: InNonTokenAnnotation
        stackContext: sc.StackContext
    }) => void
    end: (annotation: InTokenAnnotation) => void
}