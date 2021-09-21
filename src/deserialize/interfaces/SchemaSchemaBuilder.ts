import { ISchemaAndSideEffects } from "../../modules/typed/interfaces/SchemaAndSideEffects"
import { ITreeHandler } from "../../modules/parser/interfaces/ITreeHandler"
import { SchemaDeserializationError } from "../types/SchemaDeserializationError"

export type SchemaSchemaBuilder<TokenAnnotation, NonTokenAnnotation> = (
    onSchemaError: (error: SchemaDeserializationError, annotation: TokenAnnotation) => void,
    onSchema: (schema: ISchemaAndSideEffects<TokenAnnotation, NonTokenAnnotation>) => void,
) => ITreeHandler<TokenAnnotation, NonTokenAnnotation>
