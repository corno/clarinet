import { DiagnosticSeverity } from "../../../generic"
import { Schema } from "../../../implementations/typedHandler"
import { ITypedTreeHandler } from "../../typedTreeHandler"

export type SchemaAndSideEffects<TokenAnnotation, NonTokenAnnotation> = {
    schema: Schema
    createStreamingValidator: (
        onValidationError: (message: string, annotation: TokenAnnotation, severity: DiagnosticSeverity) => void,
    ) => ITypedTreeHandler<TokenAnnotation, NonTokenAnnotation>
}