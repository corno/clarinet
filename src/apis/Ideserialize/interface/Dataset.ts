import { SchemaAndSideEffects } from "./SchemaAndSideEffects"

export type ContextSchema<TokenAnnotation, NonTokenAnnotation> =
    | ["ignored"]
    | ["not available"]
    | ["has errors"]
    | ["available", SchemaAndSideEffects<TokenAnnotation, NonTokenAnnotation>]