import * as def from "../../../modules/typed/types/definitions"
import * as h from "../../../modules/typed/interfaces/ITypedTreeHandler"
import { DiagnosticSeverity } from "../../../modules/diagnosticSeverity/types/DiagnosticSeverity"


export type SchemaAndSideEffects<TokenAnnotation, NonTokenAnnotation> = {
    schema: def.Schema
    createStreamingValidator: (
        onValidationError: (message: string, annotation: TokenAnnotation, severity: DiagnosticSeverity) => void,
    ) => h.ITypedTreeHandler<TokenAnnotation, NonTokenAnnotation>
}