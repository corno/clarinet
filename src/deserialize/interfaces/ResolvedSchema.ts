import { InternalSchemaSpecification } from "../../modules/marshallDataset/types/InternalSchemaSpecification";
import { SchemaAndSideEffects } from "../../modules/typed/interfaces/SchemaAndSideEffects";

export interface ResolvedSchema<TokenAnnotation, NonTokenAnnotation> {
    specification: InternalSchemaSpecification
    schemaAndSideEffects: SchemaAndSideEffects<TokenAnnotation, NonTokenAnnotation>
}