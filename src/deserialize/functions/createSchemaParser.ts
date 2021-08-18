
import * as p from "pareto"
import { SchemaError } from "../types/SchemaError"
import { SchemaAndSideEffects } from "../../modules/typed/interfaces/SchemaAndSideEffects"
import { SchemaSchemaBuilder } from "../../modules/typed/interfaces/SchemaSchemaBuilder"
import { createStructureParser } from "../../modules/parser/functions/createStructureParser"
import { createDummyTreeHandler } from "../../modules/parser/functions/dummyHandlers"
import { IParser } from "../../modules/parser/interfaces/IParser"

export function createSchemaParser<TokenAnnotation>(
    getSchemaSchemaBuilder: (
        name: string,
    ) => SchemaSchemaBuilder<TokenAnnotation, null> | null,
    onError: (error: SchemaError, annotation: TokenAnnotation) => void,
    onSchema: (schema: SchemaAndSideEffects<TokenAnnotation, null> | null) => void,
): IParser<TokenAnnotation> {
    let foundError = false

    let schemaDefinitionFound = false
    let schemaSchemaBuilder: null | SchemaSchemaBuilder<TokenAnnotation, null> = null
    function onSchemaError(error: SchemaError, annotation: TokenAnnotation) {
        onError(error, annotation)
        foundError = true
    }

    return createStructureParser({
        onEmbeddedSchema: $$ => {
            onSchemaError(["schema schema cannot be embedded"], $$.embeddedSchemaAnnotation)
            return createDummyTreeHandler()
        },
        onSchemaReference: $$ => {
            schemaDefinitionFound = true
            schemaSchemaBuilder = getSchemaSchemaBuilder($$.token.data.value)
            if (schemaSchemaBuilder === null) {
                //console.error(`unknown schema schema '${schemaSchemaReference.data.value}'`)
                onSchemaError(["unknown schema schema", { name: $$.token.data.value }], $$.token.annotation)
            }
            return p.value(false)
        },
        onBody: annotation => {
            if (!schemaDefinitionFound) {
                //console.error("missing schema schema types")
                onSchemaError(["missing schema schema definition"], annotation)
                return createDummyTreeHandler()
            } else {
                if (schemaSchemaBuilder === null) {
                    if (!foundError) {
                        throw new Error("UNEXPECTED: SCHEMA PROCESSOR NOT SUBSCRIBED AND NO ERRORS")
                    }
                    return createDummyTreeHandler()
                } else {
                    return schemaSchemaBuilder(
                        (error, annotation2) => {
                            onError(["schema processing", error], annotation2)
                        },
                        schemaAndSideEffects => {
                            onSchema(schemaAndSideEffects)
                        }
                    )
                }
            }
        },
        onEnd: () => {
            return p.value(null)
        },
        errors: {
            onTreeError: $ => {
                onSchemaError(["tree", $.error], $.annotation)
            },
            onStructureError: $ => {
                onSchemaError(["structure", $.error], $.annotation)
            },

        },
    })
}
