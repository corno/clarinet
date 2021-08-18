
import * as p from "pareto"

import * as def from "../../modules/schema/types/definitions"
import { DiagnosticSeverity } from "../../modules/diagnosticSeverity/types/DiagnosticSeverity"
import { TokenizerAnnotationData } from "../../modules/tokenizer/types/TokenizerAnnotationData"
import { SchemaSchemaBuilder } from "../../modules/typed/interfaces/SchemaSchemaBuilder"
import { ResolvedSchema } from "../types/ResolvedSchema"
import { DeserializeError } from "../types/DeserializeError"
import { RetrievalError } from "../types/RetrievalError"

import * as th from "../../modules/parser/interfaces/ITreeHandler"
import { ITypedTreeHandler } from "../../modules/typed/interfaces/ITypedTreeHandler"
import { IParser } from "../../modules/parser/interfaces/IParser"
import { ContextSchema } from "../interfaces/ContextSchema"

import { createDummyTreeHandler } from "../../modules/parser/functions/dummyHandlers"
import { createStructureParser } from "../../modules/parser/functions/createStructureParser"
import { createTreeUnmarshaller } from "../../modules/typed/functions/createTreeUnmarshaller"

import { loadPossibleExternalSchema } from "./loadPossibleExternalSchema"

type ResolveReferencedSchema = (id: string) => p.IUnsafeValue<p.IStream<string, null>, RetrievalError>

export function createUnmarshaller($: {
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

            return loadPossibleExternalSchema(
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
                return createTreeUnmarshaller(
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
                    $.contextSchema[1].getSchema(),
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
                        internalSchema.schemaAndSideEffects.getSchema(),
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
