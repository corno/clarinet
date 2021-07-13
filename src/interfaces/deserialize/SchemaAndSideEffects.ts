import * as astncore from "../../core"

/**
 * a schema implementation should provide this type
 */
export type SchemaAndSideEffects<TokenAnnotation, NonTokenAnnotation> = {
    schema: astncore.Schema
    createStreamingValidator: (
        onValidationError: (message: string, annotation: TokenAnnotation, severity: astncore.DiagnosticSeverity) => void,
    ) => astncore.TypedTreeHandler<TokenAnnotation, NonTokenAnnotation>
    //createAsyncValidator: () => buildAPI.Root
}