
import * as p from "pareto"
import * as Ideserialize from "../imports"
import * as loadExtenalSchema from "./loadExternalSchema"
import * as i from "../imports"
import * as structureParser from "../imports"
import * as typedHandler from "../imports"
import * as ITyped from "../imports"
import * as Iuntyped from "../imports"
import * as unmarshall from "../imports"
import { createDummyTreeHandler } from "../imports"
import { DiagnosticSeverity } from "../imports"

export function createDeserializer($: {
    contextSchema: Ideserialize.ContextSchema<i.TokenizerAnnotationData, null>
    resolveReferencedSchema: Ideserialize.ResolveReferencedSchema
    onError: (diagnostic: Ideserialize.DeserializeError, annotation: i.TokenizerAnnotationData, severity: DiagnosticSeverity) => void

    getSchemaSchemaBuilder: (
        name: string,
    ) => Ideserialize.SchemaSchemaBuilder<i.TokenizerAnnotationData, null> | null
    handlerBuilder: (
        schemaSpec: Ideserialize.ResolvedSchema<i.TokenizerAnnotationData, null>,
    ) => ITyped.ITypedTreeHandler<i.TokenizerAnnotationData, null>
    onEnd: () => void
}): i.ITokenConsumer<i.TokenizerAnnotationData> {

    let headerAnnotation: null | i.TokenizerAnnotationData = null
    let foundSchemaErrors = false

    let internalSchema: Ideserialize.ResolvedSchema<i.TokenizerAnnotationData, null> | null = null

    return structureParser.createStructureParser({
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
                schema: typedHandler.Schema,
                schemaSpec: Ideserialize.ResolvedSchema<i.TokenizerAnnotationData, null>,
            ): Iuntyped.TreeHandler<i.TokenizerAnnotationData, null> {
                const handler = $.handlerBuilder(schemaSpec)
                return unmarshall.createUnmarshaller(
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
