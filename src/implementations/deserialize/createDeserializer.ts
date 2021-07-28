/* eslint
    "max-classes-per-file": off,
*/

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
    onEnd: () => p.IValue<null>
}): TokenConsumer<TokenizerAnnotationData> {

    let internalSchemaSpecificationStart: null | TokenizerAnnotationData = null
    let foundSchemaErrors = false

    let internalSchema: ResolvedSchema<TokenizerAnnotationData, null> | null = null

    return createStructureParser({
        onEmbeddedSchema: (schemaSchemaReference, firstTokenizerAnnotationData) => {
            internalSchemaSpecificationStart = firstTokenizerAnnotationData

            const schemaSchemaBuilder = $.getSchemaSchemaBuilder(schemaSchemaReference)

            if (schemaSchemaBuilder === null) {
                throw new Error(`IMPLEMENT ME: unknown schema schema: ${schemaSchemaReference}`)
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
        onSchemaReference: schemaReference => {
            internalSchemaSpecificationStart = schemaReference.annotation

            return loadPossibleExternalSchema(
                $.resolveReferencedSchema(schemaReference.data.value),
                $.getSchemaSchemaBuilder,
                error => {
                    foundSchemaErrors = true
                    $.onError(
                        ["schema reference resolving", error],
                        schemaReference.annotation,
                        astncore.DiagnosticSeverity.error,
                    )
                },
            ).mapResult<boolean>(schemaAndSideEffects => {
                internalSchema = {
                    schemaAndSideEffects: schemaAndSideEffects,
                    specification: ["reference", { name: schemaReference.data.value }],
                }
                return p.value(false)
            }).catch(() => {
                return p.value(false)
            })
        },
        onBody: firstBodyTokenizerAnnotationData => {
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
                if (internalSchemaSpecificationStart !== null) {
                    $.onError(
                        ["found both internal and context schema. ignoring internal schema"],
                        internalSchemaSpecificationStart,
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
            } else if (internalSchemaSpecificationStart !== null) {
                if (internalSchema === null) {
                    if (!foundSchemaErrors) {
                        console.error("NO SCHEMA AND NO ERROR")
                    }
                    $.onError(
                        ["no valid schema"],
                        firstBodyTokenizerAnnotationData,
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
                        firstBodyTokenizerAnnotationData,
                        astncore.DiagnosticSeverity.error,
                    )
                } else {
                    $.onError(
                        ["no schema"],
                        firstBodyTokenizerAnnotationData,
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
            return $.onEnd()
        },
    })
}
