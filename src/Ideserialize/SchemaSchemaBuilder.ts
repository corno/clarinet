import { SchemaAndSideEffects } from "./SchemaAndSideEffects"
import { SchemaDeserializationError } from "./Errors"
import { TreeHandler } from "../Iuntyped"

export type SchemaSchemaBuilder<TokenAnnotation, NonTokenAnnotation> = (
    onSchemaError: (error: SchemaDeserializationError, annotation: TokenAnnotation) => void,
    onSchema: (schema: SchemaAndSideEffects<TokenAnnotation, NonTokenAnnotation>) => void,
) => TreeHandler<TokenAnnotation, NonTokenAnnotation>
