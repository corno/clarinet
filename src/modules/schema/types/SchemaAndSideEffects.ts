import * as def from "./definitions"
import * as h from "../../typed/interfaces/ITypedTreeHandler"
import { DiagnosticSeverity } from "../../diagnosticSeverity/types/DiagnosticSeverity"


export type SchemaAndSideEffects<TokenAnnotation, NonTokenAnnotation> = {
    schema: def.Schema
    createStreamingValidator: (
        onValidationError: (message: string, annotation: TokenAnnotation, severity: DiagnosticSeverity) => void,
    ) => h.ITypedTreeHandler<TokenAnnotation, NonTokenAnnotation>
}