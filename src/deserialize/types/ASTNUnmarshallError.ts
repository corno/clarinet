
import { StructureErrorType } from "../../modules/parser/types/StructureErrorType"
import { TreeParserErrorType } from "../../modules/parser/types/TreeParserError"
import { SchemaDeserializationError } from "./SchemaDeserializationError"
import { TokenError } from "../../modules/tokenizer/types/TokenError"
import { UnmarshallError } from "../../modules/typed/types/UnmarshallError"
import { ExternalSchemaResolvingError } from "./ContextSchemaError"

export type ASTNUnmarshallError =
| ["no valid schema"]
| ["no schema"]
| ["found both internal and context schema. ignoring internal schema"]
| ["invalid embedded schema"]
| ["invalid schema reference"]
| ["unmarshall", UnmarshallError]
| ["tree", TreeParserErrorType]
| ["tokenizer", TokenError]
| ["structure", StructureErrorType]
| ["embedded schema error", SchemaDeserializationError]
| ["schema reference resolving", ExternalSchemaResolvingError]
