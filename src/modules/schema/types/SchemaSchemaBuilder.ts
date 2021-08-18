import { SchemaAndSideEffects } from "./SchemaAndSideEffects"
import { TreeHandler } from "../../parser/interfaces/ITreeHandler"
import { SchemaDeserializationError } from "./SchemaDeserializationError"

export type SchemaSchemaBuilder<TokenAnnotation, NonTokenAnnotation> = (
    onSchemaError: (error: SchemaDeserializationError, annotation: TokenAnnotation) => void,
    onSchema: (schema: SchemaAndSideEffects<TokenAnnotation, NonTokenAnnotation>) => void,
) => TreeHandler<TokenAnnotation, NonTokenAnnotation>
