import { DiagnosticSeverity } from "../../diagnosticSeverity/types/DiagnosticSeverity";
import { ExpectError } from "../types/expectedError";

export type ExpectIssueHandler<TokenAnnotation> = ($: {
    issue: ExpectError
    severity: DiagnosticSeverity
    annotation: TokenAnnotation
}) => void