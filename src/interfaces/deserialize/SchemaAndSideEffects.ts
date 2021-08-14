import { Schema } from "../../typedHandler"
import { DiagnosticSeverity, TypedTreeHandler } from "../typed"

export type SchemaAndSideEffects<TokenAnnotation, NonTokenAnnotation> = {
    schema: Schema
    createStreamingValidator: (
        onValidationError: (message: string, annotation: TokenAnnotation, severity: DiagnosticSeverity) => void,
    ) => TypedTreeHandler<TokenAnnotation, NonTokenAnnotation>
}