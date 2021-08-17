
import * as p from "pareto"
import * as loadExtenalSchema from "./loadExternalSchema"
import * as def from "../../../modules/typed/types/definitions"
import * as th from "../../../modules/parser/interfaces/ITreeHandler"
import { ITypedTreeHandler } from "../../../modules/typed"
import { ContextSchema, DeserializeError, ResolvedSchema, ResolveReferencedSchema, SchemaSchemaBuilder } from "../../../apis/Ideserialize"
import * as i from "../../../apis/ITokenizer"
import { createStructureParser } from "../../structureParser"
import { createUnmarshaller } from "../../unmarshall"
import { DiagnosticSeverity } from "../../../modules/diagnosticSeverity/types/DiagnosticSeverity"
import { createDummyTreeHandler } from "../../../modules/parser/functions/dummyHandlers"

export function createDeserializer($: {
    contextSchema: ContextSchema<i.TokenizerAnnotationData, null>
    resolveReferencedSchema: ResolveReferencedSchema
    onError: (diagnostic: DeserializeError, annotation: i.TokenizerAnnotationData, severity: DiagnosticSeverity) => void

    getSchemaSchemaBuilder: (
        name: string,
    ) => SchemaSchemaBuilder<i.TokenizerAnnotationData, null> | null
    handlerBuilder: (
        schemaSpec: ResolvedSchema<i.TokenizerAnnotationData, null>,
    ) => ITypedTreeHandler<i.TokenizerAnnotationData, null>
    onEnd: () => void
}): i.ITokenConsumer<i.TokenizerAnnotationData> {

    let headerAnnotation: null | i.TokenizerAnnotationData = null
    let foundSchemaErrors = false

    let internalSchema: ResolvedSchema<i.TokenizerAnnotationData, null> | null = null

    return createStructureParser({
        onEmbeddedSchema: $$ => {
            headerAnnotation = $$.headerAnnotation

            const schemaSchemaBuilder = $.getSchemaSchemaBuilder($$.schemaSchemaReferenceToken.data.value)

            if (schemaSchemaBuilder === null) {
                throw new Error(`IMPLEMENT ME: unknown schema schema: ${$$.schemaSchemaReferenceToken.data.value}`)
            }
            return schemaSchemaBuilder(
                (error, annotation) => {
                    $.onError(["embedded schema error", error], annotation, DiagnosticSeverity.error)
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

            return loadExtenalSchema.loadPossibleExternalSchema(
                $.resolveReferencedSchema($$.token.data.value),
                $.getSchemaSchemaBuilder,
                error => {
                    foundSchemaErrors = true
                    $.onError(
                        ["schema reference resolving", error],
                        $$.token.annotation,
                        DiagnosticSeverity.error,
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
                schema: def.Schema,
                schemaSpec: ResolvedSchema<i.TokenizerAnnotationData, null>,
            ): th.TreeHandler<i.TokenizerAnnotationData, null> {
                const handler = $.handlerBuilder(schemaSpec)
                return createUnmarshaller(
                    schema,
                    handler,
                    (error, annotation, severity) => $.onError(["unmarshall", error], annotation, severity),
                )
            }
            if ($.contextSchema[0] === "available") {
                if (headerAnnotation !== null) {
                    $.onError(
                        ["found both internal and context schema. ignoring internal schema"],
                        headerAnnotation,
                        DiagnosticSeverity.warning
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
                        DiagnosticSeverity.error,
                    )
                    return createDummyTreeHandler()
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
                        DiagnosticSeverity.error,
                    )
                } else {
                    $.onError(
                        ["no schema"],
                        firstBodyTokenAnnotation,
                        DiagnosticSeverity.error,
                    )
                }
                return createDummyTreeHandler()
            }
        },
        errors: {
            onTreeError: $$ => {
                $.onError(["tree", $$.error], $$.annotation, DiagnosticSeverity.error)
            },
            onStructureError: $$ => {
                $.onError(["structure", $$.error], $$.annotation, DiagnosticSeverity.error)
            },
        },
        onEnd: () => {
            $.onEnd()
        },
    })
}
