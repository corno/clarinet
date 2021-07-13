import { SchemaAndSideEffects } from "./SchemaAndSideEffects"
import * as astncore from "../../core"
import { SchemaDeserializationError } from "./Errors"

export type SchemaSchemaBuilder<TokenAnnotation, NonTokenAnnotation> = (
    onSchemaError: (error: SchemaDeserializationError, annotation: TokenAnnotation) => void,
    onSchema: (schema: SchemaAndSideEffects<TokenAnnotation, NonTokenAnnotation>) => void,
) => astncore.TreeHandler<TokenAnnotation, NonTokenAnnotation>
