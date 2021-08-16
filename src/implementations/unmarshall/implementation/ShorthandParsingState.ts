import { DiagnosticSeverity } from "../../../generic"
import { UnmarshallError } from "../../../apis/Ityped"
import * as t from "../../../modules/typed/interfaces/ITypedTreeHandler"
import * as def from "../../../modules/typed/types/definitions"


export type ValueContext<TokenAnnotation, NonTokenAnnotation> = {
    definition: def.ValueDefinition
    handler: t.TypedValueHandler<TokenAnnotation, NonTokenAnnotation>
}

export interface ShorthandParsingState<TokenAnnotation, NonTokenAnnotation> {
    wrapup(
        annotation: TokenAnnotation,
        onError: (message: UnmarshallError, annotation: TokenAnnotation, severity: DiagnosticSeverity) => void
    ): void
    findNextValue(): ValueContext<TokenAnnotation, NonTokenAnnotation> | null
    pushGroup(
        definition: def.GroupDefinition,
         handler: t.TypedValueHandler<TokenAnnotation, NonTokenAnnotation>
         ): void
    pushTaggedUnion(
        definition: def.OptionDefinition,
        taggedUnionHandler: t.TypedTaggedUnionHandler<TokenAnnotation, NonTokenAnnotation>,
        optionHandler: t.TypedValueHandler<TokenAnnotation, NonTokenAnnotation>,
    ): void
}