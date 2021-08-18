import { ExpectError } from "../../expect/types/expectedError";
import { TreeParserErrorType } from "../../parser/types/TreeParserError";

export type SchemaDeserializationError =
| ["validation", {
    "message": string
}]
| ["expect", ExpectError]
| ["stacked", TreeParserErrorType]