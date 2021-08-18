import { InternalSchemaSpecification } from "../../../modules/marshallDataset/types/InternalSchemaSpecification";
import { SchemaAndSideEffects } from "../../../modules/schema/types/SchemaAndSideEffects";

export type ResolvedSchema<TokenAnnotation, NonTokenAnnotation> = {
    specification: InternalSchemaSpecification
    schemaAndSideEffects: SchemaAndSideEffects<TokenAnnotation, NonTokenAnnotation>
}