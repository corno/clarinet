import * as p from "pareto"
import { DiagnosticSeverity, Range } from "../generic"
import { ResolvedSchema, RetrievalError, SchemaSchemaBuilder, TokenizerAnnotationData } from "../interfaces"
import { TypedTreeHandler } from "../Ityped"
import { createDeserializer } from "../deserialize/createDeserializer"
import { loadContextSchema } from "../deserialize/loadContextSchema"
import { printContextSchemaError } from "../deserialize/printContextSchemaError"
import { printDeserializationDiagnostic } from "../deserialize/printDeserializeDiagnostic"
import { createStreamPreTokenizer } from "../streamPretokenizer"
import { createTokenizer } from "../tokenizer"
import { printTokenError } from "../pretokenizer"

export function createProcessorForASTNStreamWithContext(
    serializedDatasetBaseName: string,
    serializedDatasetDirName: string,
    getSchemaSchemaBuilder: (
        name: string
    ) => SchemaSchemaBuilder<TokenizerAnnotationData, null> | null,
    getContextSchema: (
        dir: string,
        schemaFileName: string
    ) => p.IUnsafeValue<p.IStream<string, null>, RetrievalError>,
    getReferencedSchema: (
        id: string
    ) => p.IUnsafeValue<p.IStream<string, null>, RetrievalError>,
    getTypedTreeHandler: (
        schemaSpec: ResolvedSchema<TokenizerAnnotationData, null>
    ) => TypedTreeHandler<TokenizerAnnotationData, null>,
    onError: (error: string, severity: DiagnosticSeverity, range: Range | null) => void,
): p.IValue<p.IStreamConsumer<string, null, null>> {
    return loadContextSchema(
        {
            basename: serializedDatasetBaseName,
            dirname: serializedDatasetDirName,
            getContextSchema: getContextSchema,
        },
        getSchemaSchemaBuilder,
        (error, severity) => {
            onError(printContextSchemaError(error), severity, null)
        },
    ).mapResult(contextSchema => {
        return p.value(createStreamPreTokenizer(
            createTokenizer(
                createDeserializer({
                    contextSchema: contextSchema,
                    resolveReferencedSchema: getReferencedSchema,
                    onError: (error, annotation, severity) => {
                        onError(`${printDeserializationDiagnostic(error)}`, severity, annotation.range)
                    },
                    getSchemaSchemaBuilder: getSchemaSchemaBuilder,
                    handlerBuilder: getTypedTreeHandler,
                    onEnd: () => {
                        return p.value(null)
                    },
                })

            ),
            $ => {
                onError(printTokenError($.error), DiagnosticSeverity.error, $.range)
            }
        ))
    })
}