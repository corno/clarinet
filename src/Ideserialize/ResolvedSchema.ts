import { InternalSchemaSpecification } from "./Dataset";
import { SchemaAndSideEffects } from "./SchemaAndSideEffects";

export type ResolvedSchema<TokenAnnotation, NonTokenAnnotation> = {
    specification: InternalSchemaSpecification
    schemaAndSideEffects: SchemaAndSideEffects<TokenAnnotation, NonTokenAnnotation>
}