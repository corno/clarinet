import { DiagnosticSeverity, TypedTaggedUnionHandler, TypedValueHandler, UnmarshallError } from "../../interfaces/typed"
import * as t from "../../typedHandler"


export type ValueContext<TokenAnnotation, NonTokenAnnotation> = {
    definition: t.ValueDefinition
    handler: TypedValueHandler<TokenAnnotation, NonTokenAnnotation>
}

export interface ShorthandParsingState<TokenAnnotation, NonTokenAnnotation> {
    wrapup(
        annotation: TokenAnnotation,
        onError: (message: UnmarshallError, annotation: TokenAnnotation, severity: DiagnosticSeverity) => void
    ): void
    findNextValue(): ValueContext<TokenAnnotation, NonTokenAnnotation> | null
    pushGroup(
        definition: t.GroupDefinition,
         handler: TypedValueHandler<TokenAnnotation, NonTokenAnnotation>
         ): void
    pushTaggedUnion(
        definition: t.OptionDefinition,
        taggedUnionHandler: TypedTaggedUnionHandler<TokenAnnotation, NonTokenAnnotation>,
        optionHandler: TypedValueHandler<TokenAnnotation, NonTokenAnnotation>,
    ): void
}