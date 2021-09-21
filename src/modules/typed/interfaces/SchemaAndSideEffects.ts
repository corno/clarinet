import * as def from "../../schema/types/definitions"
import { DiagnosticSeverity } from "../../diagnosticSeverity/types/DiagnosticSeverity"

import * as h from "./ITypedTreeHandler"

export interface ISchemaAndSideEffects<TokenAnnotation, NonTokenAnnotation> {
    getSchema: () => def.Schema
    createStreamingValidator: (
        onValidationError: (message: string, annotation: TokenAnnotation, severity: DiagnosticSeverity) => void,
    ) => h.ITypedTreeHandler<TokenAnnotation, NonTokenAnnotation>
}