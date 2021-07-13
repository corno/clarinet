import * as i from "../../interfaces"

export type ValueContext<TokenAnnotation, NonTokenAnnotation> = {
    definition: i.ValueDefinition
    handler: i.TypedValueHandler<TokenAnnotation, NonTokenAnnotation>
}

export interface ShorthandParsingState<TokenAnnotation, NonTokenAnnotation> {
    wrapup(
        annotation: TokenAnnotation,
        onError: (message: i.UnmarshallError, annotation: TokenAnnotation, severity: i.DiagnosticSeverity) => void
    ): void
    findNextValue(): ValueContext<TokenAnnotation, NonTokenAnnotation> | null
    pushGroup(
        definition: i.GroupDefinition,
         handler: i.TypedValueHandler<TokenAnnotation, NonTokenAnnotation>
         ): void
    pushTaggedUnion(
        definition: i.OptionDefinition,
        taggedUnionHandler: i.TypedTaggedUnionHandler<TokenAnnotation, NonTokenAnnotation>,
        optionHandler: i.TypedValueHandler<TokenAnnotation, NonTokenAnnotation>,
    ): void
}