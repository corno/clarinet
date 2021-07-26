import { TreeParserErrorType } from "../../core";

export type StructureErrorType =
    | ["expected the schema start (!) or root value"]
    | ["expected a schema reference or a schema body"]
    | ["expected the schema"]
    | ["expected rootvalue"]
    | ["unexpected data after end", {
        data: string
    }]
    | ["unexpected '!'"]
    | ["unknown punctuation", {
        found: string
    }]

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