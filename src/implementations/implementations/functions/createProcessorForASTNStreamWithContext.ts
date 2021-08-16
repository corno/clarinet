import * as p from "pareto"
import { DiagnosticSeverity, Range } from "../../../generic"
import { TokenizerAnnotationData } from "../../../apis/ITokenizer"
import { ITypedTreeHandler } from "../../../apis/Ityped"
import { createDeserializer } from "../../deserialize"
import { loadContextSchema } from "../../deserialize"
import { printContextSchemaError } from "../../deserialize"
import { printDeserializationDiagnostic } from "../../deserialize"
import { createStreamPreTokenizer } from "../../streamPretokenizer"
import { createTokenizer } from "../../tokenizer"
import { printTokenError } from "../../pretokenizer"
import { ResolvedSchema, RetrievalError, SchemaSchemaBuilder } from "../../../apis/Ideserialize"

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
    ) => ITypedTreeHandler<TokenizerAnnotationData, null>,
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