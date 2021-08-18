import { ExpectErrorValueTypeX } from "../../expect/types/expectedError";
import { TreeParserErrorType } from "../../parser/types/TreeParserError";

export type SchemaDeserializationError =
| ["validation", {
    "message": string
}]
| ["expect", ExpectErrorValueTypeX]
| ["stacked", TreeParserErrorType]