import { DiagnosticSeverity } from "../../diagnosticSeverity/types/DiagnosticSeverity";
import { ExpectError } from "../types/ExpectError";

export type ExpectIssueHandler<TokenAnnotation> = ($: {
    issue: ExpectError
    severity: DiagnosticSeverity
    annotation: TokenAnnotation
}) => void