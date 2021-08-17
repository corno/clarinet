import { StructureErrorType } from "../types/StructureErrorType";
import { TreeParserErrorType } from "../types/TreeParserError";

export interface StructureErrorHandler<Annotation> {
    onTreeError: ($: {
        error: TreeParserErrorType
        annotation: Annotation
    }) => void
    onStructureError: ($: {
        error: StructureErrorType
        annotation: Annotation
    }) => void
}