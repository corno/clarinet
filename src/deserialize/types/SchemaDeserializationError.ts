import { ExpectError } from "../../modules/expect/types/ExpectError";
//import { TreeParserErrorType } from "../../parser/types/TreeParserError";

export type SchemaDeserializationError =
| ["validation", {
    "message": string
}]
| ["expect", ExpectError]
