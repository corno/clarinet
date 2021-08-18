import { TokenError } from "../../modules/tokenizer/types/TokenError"
import { StructureErrorType } from "../../modules/parser/types/StructureErrorType"
import { TreeParserErrorType } from "../../modules/parser/types/TreeParserError"
import { SchemaDeserializationError } from "../../modules/schema/types/SchemaDeserializationError"

export type SchemaError =
    | ["schema schema cannot be embedded"]
    | ["unknown schema schema", {
        name: string
    }]
    | ["missing schema schema definition"]
    | ["tokenizer", TokenError]
    | ["structure", StructureErrorType]
    | ["tree", TreeParserErrorType]
    | ["schema processing", SchemaDeserializationError]
