
import * as p from "pareto"
import * as astncore from "../../core"

import { ContextSchema } from "../../interfaces/deserialize/Dataset"
import { DeserializeError } from "../../interfaces/deserialize/Errors"
import { ResolveReferencedSchema } from "../../interfaces/deserialize/ResolveReferencedSchema"
import { ResolvedSchema, SchemaSchemaBuilder } from "../../interfaces/deserialize"
import { loadPossibleExternalSchema } from "./loadExternalSchema"
import { TokenConsumer, TokenizerAnnotationData } from "../../interfaces"
import { createStructureParser } from "../structureParser"

export function createDeserializer($: {
    contextSchema: ContextSchema<TokenizerAnnotationData, null>
    resolveReferencedSchema: ResolveReferencedSchema
    onError: (diagnostic: DeserializeError, annotation: TokenizerAnnotationData, severity: astncore.DiagnosticSeverity) => void

    getSchemaSchemaBuilder: (
        name: string,
    ) => SchemaSchemaBuilder<TokenizerAnnotationData, null> | null
    handlerBuilder: (
        schemaSpec: ResolvedSchema<TokenizerAnnotationData, null>,
    ) => astncore.TypedTreeHandler<TokenizerAnnotationData, null>
    onEnd: () => void
}): TokenConsumer<TokenizerAnnotationData> {

    let headerAnnotation: null | TokenizerAnnotationData = null
    let foundSchemaErrors = false

    let internalSchema: ResolvedSchema<TokenizerAnnotationData, null> | null = null

    return createStructureParser({
        onEmbeddedSchema: $$ => {
            headerAnnotation = $$.headerAnnotation

            const schemaSchemaBuilder = $.getSchemaSchemaBuilder($$.schemaSchemaReferenceToken.data.value)

            if (schemaSchemaBuilder === null) {
                throw new Error(`IMPLEMENT ME: unknown schema schema: ${$$.schemaSchemaReferenceToken.data.value}`)
            }
            return schemaSchemaBuilder(
                (error, annotation) => {
                    $.onError(["embedded schema error", error], annotation, astncore.DiagnosticSeverity.error)
                    foundSchemaErrors = true
                },
                schemaAndSideEffects => {
                    internalSchema = {
                        schemaAndSideEffects: schemaAndSideEffects,
                        specification: ["embedded"],
                    }
                }
            )
        },
        onSchemaReference: $$ => {
            headerAnnotation = $$.token.annotation

            return loadPossibleExternalSchema(
                $.resolveReferencedSchema($$.token.data.value),
                $.getSchemaSchemaBuilder,
                error => {
                    foundSchemaErrors = true
                    $.onError(
                        ["schema reference resolving", error],
                        $$.token.annotation,
                        astncore.DiagnosticSeverity.error,
                    )
                },
            ).mapResult<boolean>(schemaAndSideEffects => {
                internalSchema = {
                    schemaAndSideEffects: schemaAndSideEffects,
                    specification: ["reference", { name: $$.token.data.value }],
                }
                return p.value(false)
            }).catch(() => {
                return p.value(false)
            })
        },
        onBody: firstBodyTokenAnnotation => {
            function createRealTreeHandler(
                schema: astncore.Schema,
                schemaSpec: ResolvedSchema<TokenizerAnnotationData, null>,
            ): astncore.TreeHandler<TokenizerAnnotationData, null> {
                const handler = $.handlerBuilder(schemaSpec)
                return astncore.createDatasetUnmarshaller(
                    schema,
                    handler,
                    (error, annotation, severity) => $.onError(["deserialize", error], annotation, severity),
                )
            }
            if ($.contextSchema[0] === "available") {
                if (headerAnnotation !== null) {
                    $.onError(
                        ["found both internal and context schema. ignoring internal schema"],
                        headerAnnotation,
                        astncore.DiagnosticSeverity.warning
                    )
                }
                return createRealTreeHandler(
                    $.contextSchema[1].schema,
                    {
                        schemaAndSideEffects: $.contextSchema[1],
                        specification: ["none"],
                    }
                )
            } else if (headerAnnotation !== null) {
                if (internalSchema === null) {
                    if (!foundSchemaErrors) {
                        console.error("NO SCHEMA AND NO ERROR")
                    }
                    $.onError(
                        ["no valid schema"],
                        firstBodyTokenAnnotation,
                        astncore.DiagnosticSeverity.error,
                    )
                    return astncore.createDummyTreeHandler()
                } else {
                    return createRealTreeHandler(
                        internalSchema.schemaAndSideEffects.schema,
                        internalSchema,
                    )
                }
            } else {
                if ($.contextSchema[0] === "has errors") {
                    $.onError(
                        ["no valid schema"],
                        firstBodyTokenAnnotation,
                        astncore.DiagnosticSeverity.error,
                    )
                } else {
                    $.onError(
                        ["no schema"],
                        firstBodyTokenAnnotation,
                        astncore.DiagnosticSeverity.error,
                    )
                }
                return astncore.createDummyTreeHandler()
            }
        },
        errors: {
            onTreeError: $$ => {
                $.onError(["tree", $$.error], $$.annotation, astncore.DiagnosticSeverity.error)
            },
            onStructureError: $$ => {
                $.onError(["structure", $$.error], $$.annotation, astncore.DiagnosticSeverity.error)
            },
        },
        onEnd: () => {
            $.onEnd()
        },
    })
}
