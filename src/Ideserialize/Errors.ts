import { TokenError } from "../pretokenizer"
import { StructureErrorType } from "../structureParser"
import { TreeParserErrorType } from "../treeParser"
import { ExpectError } from "../untypedHandlers"
import { UnmarshallError } from "../Ityped"

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


export type ExternalSchemaResolvingError =
    | ["errors in external schema"]
    | ["loading", {
        message: string
    }]

export type ContextSchemaError =
    | ["validating schema file against internal schema"]
    | ["external schema resolving", ExternalSchemaResolvingError]

export type SchemaDeserializationError =
    | ["validation", {
        "message": string
    }]
    | ["expect", ExpectError]
    | ["stacked", TreeParserErrorType]

export type DeserializeError =
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
