import { Schema } from "../typedHandler"
import { TypedTreeHandler } from "../Ityped"
import { DiagnosticSeverity } from "../generic"

export type SchemaAndSideEffects<TokenAnnotation, NonTokenAnnotation> = {
    schema: Schema
    createStreamingValidator: (
        onValidationError: (message: string, annotation: TokenAnnotation, severity: DiagnosticSeverity) => void,
    ) => TypedTreeHandler<TokenAnnotation, NonTokenAnnotation>
}