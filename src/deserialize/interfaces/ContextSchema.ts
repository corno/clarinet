import { ISchemaAndSideEffects } from "../../modules/typed/interfaces/SchemaAndSideEffects"

export type ContextSchema<TokenAnnotation, NonTokenAnnotation> =
    | ["ignored"]
    | ["not available"]
    | ["has errors"]
    | ["available", ISchemaAndSideEffects<TokenAnnotation, NonTokenAnnotation>]