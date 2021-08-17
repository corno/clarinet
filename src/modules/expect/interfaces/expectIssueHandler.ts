import { DiagnosticSeverity } from "../../diagnosticSeverity/types/DiagnosticSeverity";
import { ExpectErrorValueTypeX } from "../types/expectedError";

export type ExpectIssueHandler<TokenAnnotation> = ($: {
    issue: ExpectErrorValueTypeX
    severity: DiagnosticSeverity
    annotation: TokenAnnotation
}) => void