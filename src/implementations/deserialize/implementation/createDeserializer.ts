
import * as p from "pareto"
import * as loadExtenalSchema from "./loadExternalSchema"
import * as def from "../../../modules/typed/types/definitions"
import * as th from "../../../modules/parser/interfaces/ITreeHandler"
import { DiagnosticSeverity } from "../../../modules/diagnosticSeverity/types/DiagnosticSeverity"
import { createDummyTreeHandler } from "../../../modules/parser/functions/dummyHandlers"
import { createStructureParser } from "../../../modules/parser/functions/createStructureParser"
import { createUnmarshaller } from "../../../modules/typed/functions/createUnmarshaller"
import { ITypedTreeHandler } from "../../../modules/typed/interfaces/ITypedTreeHandler"
import { IParser } from "../../../modules/parser/interfaces/IParser"
import { TokenizerAnnotationData } from "../../../modules/tokenizer/types/TokenizerAnnotationData"
import { ContextSchema } from "../../../apis/Ideserialize/interface/Dataset"
import { ResolveReferencedSchema } from "../../../apis/Ideserialize/interface/ResolveReferencedSchema"
import { DeserializeError } from "../../../apis/Ideserialize/interface/Errors"
import { SchemaSchemaBuilder } from "../../../apis/Ideserialize/interface/SchemaSchemaBuilder"
import { ResolvedSchema } from "../../../apis/Ideserialize/interface/ResolvedSchema"

export function createDeserializer($: {
    contextSchema: ContextSchema<TokenizerAnnotationData, null>
    resolveReferencedSchema: ResolveReferencedSchema
    onError: (diagnostic: DeserializeError, annotation: TokenizerAnnotationData, severity: DiagnosticSeverity) => void

    getSchemaSchemaBuilder: (
        name: string,
    ) => SchemaSchemaBuilder<TokenizerAnnotationData, null> | null
    handlerBuilder: (
        schemaSpec: ResolvedSchema<TokenizerAnnotationData, null>,
    ) => ITypedTreeHandler<TokenizerAnnotationData, null>
    onEnd: () => void
}): IParser<TokenizerAnnotationData> {

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
                schemaSpec: ResolvedSchema<TokenizerAnnotationData, null>,
            ): th.TreeHandler<TokenizerAnnotationData, null> {
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
