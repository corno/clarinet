import { InternalSchemaSpecification } from "../../modules/marshallDataset/types/InternalSchemaSpecification";
import { ISchemaAndSideEffects } from "../../modules/typed/interfaces/SchemaAndSideEffects";

export interface ResolvedSchema<TokenAnnotation, NonTokenAnnotation> {
    specification: InternalSchemaSpecification
    schemaAndSideEffects: ISchemaAndSideEffects<TokenAnnotation, NonTokenAnnotation>
}