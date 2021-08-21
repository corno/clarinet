import { SchemaAndSideEffects } from "../../modules/typed/interfaces/SchemaAndSideEffects"
import { TreeHandler } from "../../modules/parser/interfaces/ITreeHandler"
import { SchemaDeserializationError } from "../types/SchemaDeserializationError"

export type SchemaSchemaBuilder<TokenAnnotation, NonTokenAnnotation> = (
    onSchemaError: (error: SchemaDeserializationError, annotation: TokenAnnotation) => void,
    onSchema: (schema: SchemaAndSideEffects<TokenAnnotation, NonTokenAnnotation>) => void,
) => TreeHandler<TokenAnnotation, NonTokenAnnotation>
