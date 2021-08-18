
import * as p from "pareto"
import { SchemaError } from "../../../apis/Ideserialize/interface/Errors"
import { RetrievalError } from "../../../apis/Ideserialize/interface/ResolveReferencedSchema"
import { SchemaAndSideEffects } from "../../../modules/schema/types/SchemaAndSideEffects"
import { SchemaSchemaBuilder } from "../../../modules/schema/types/SchemaSchemaBuilder"
import { createStructureParser } from "../../../modules/parser/functions/createStructureParser"
import { createDummyTreeHandler } from "../../../modules/parser/functions/dummyHandlers"
import { IParser } from "../../../modules/parser/interfaces/IParser"
import { TokenizerAnnotationData } from "../../../modules/tokenizer/types/TokenizerAnnotationData"
import { createStreamPreTokenizer } from "../../../modules/tokenizer/functions/createStreamPreTokenizer"
import { createTokenizer } from "../../../modules/tokenizer/functions/createTokenizer"
import { ExternalSchemaResolvingError } from "../../../apis/Ideserialize/interface/ContextSchemaError"


function assertUnreachable<RT>(_x: never): RT {
    throw new Error("unreachable")
}

export function createSchemaDeserializer<TokenAnnotation>(
    getSchemaSchemaBuilder: (
        name: string,
    ) => SchemaSchemaBuilder<TokenAnnotation, null> | null,
    onError: (error: SchemaError, annotation: TokenAnnotation) => void,
    onSchema: (schema: SchemaAndSideEffects<TokenAnnotation, null> | null) => void,
    //SchemaAndSideEffects<TokenAnnotation>,
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

export function loadPossibleExternalSchema(
    possibleStream: p.IUnsafeValue<p.IStream<string, null>, RetrievalError>,
    getSchemaSchemaBuilder: (
        name: string,
    ) => SchemaSchemaBuilder<TokenizerAnnotationData, null> | null,
    onError: (
        error: ExternalSchemaResolvingError
    ) => void,
): p.IUnsafeValue<SchemaAndSideEffects<TokenizerAnnotationData, null>, null> {

    return possibleStream.mapError(error => {
        switch (error[0]) {
            case "not found": {
                onError(["loading", {
                    message: "schema not found",
                }])
                return p.value(null)
            }
            case "other": {
                const $ = error[1]
                onError(["loading", {
                    message: `other: ${$.description}`,
                }])
                return p.value(null)
            }
            default:
                return assertUnreachable(error[0])
        }
    }).try(
        stream => {
            return loadExternalSchema(
                stream,
                getSchemaSchemaBuilder,
                onError,
            )
        }
    )
}

export function loadExternalSchema(
    stream: p.IStream<string, null>,
    getSchemaSchemaBuilder: (
        name: string,
    ) => SchemaSchemaBuilder<TokenizerAnnotationData, null> | null,
    onError: (
        error: ExternalSchemaResolvingError
    ) => void,
): p.IUnsafeValue<SchemaAndSideEffects<TokenizerAnnotationData, null>, null> {
    let foundErrors = false
    let schema: SchemaAndSideEffects<TokenizerAnnotationData, null> | null = null
    return stream.consume<null>(
        null,
        createStreamPreTokenizer(
            createTokenizer(
                createSchemaDeserializer(
                    getSchemaSchemaBuilder,
                    _error => {
                        foundErrors = true
                        //console.error("SCHEMA ERROR", error)
                    },
                    $ => {
                        schema = $
                        return p.value(null)
                    }
                )
            ),
            _error => {
                foundErrors = true
            }
        ),
    ).try(
        () => {
            if (schema === null) {
                if (!foundErrors) {
                    throw new Error("no schema and no errors")
                }
                onError(["errors in external schema"])
                return p.error(null)
            } else {
                return p.success(schema)
            }
        },
    )
}