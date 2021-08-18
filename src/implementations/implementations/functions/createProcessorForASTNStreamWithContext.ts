import * as p from "pareto"
import { Range } from "../../../modules/tokenizer/types/range"
import { ITypedTreeHandler } from "../../../modules/typed/interfaces/ITypedTreeHandler"
import { DiagnosticSeverity } from "../../../modules/diagnosticSeverity/types/DiagnosticSeverity"
import { TokenizerAnnotationData } from "../../../modules/tokenizer/types/TokenizerAnnotationData"
import { SchemaSchemaBuilder } from "../../../modules/schema/types/SchemaSchemaBuilder"
import { RetrievalError } from "../../../apis/Ideserialize/interface/ResolveReferencedSchema"
import { ResolvedSchema } from "../../../apis/Ideserialize/interface/ResolvedSchema"
import { loadContextSchema } from "../../deserialize/implementation/loadContextSchema"
import { printContextSchemaError } from "../../deserialize/implementation/printContextSchemaError"
import { createStreamPreTokenizer } from "../../../modules/tokenizer/functions/createStreamPreTokenizer"
import { createTokenizer } from "../../../modules/tokenizer/functions/createTokenizer"
import { createDeserializer } from "../../deserialize/implementation/createDeserializer"
import { printDeserializationDiagnostic } from "../../deserialize/implementation/printDeserializeDiagnostic"
import { printTokenError } from "../../../modules/tokenizer/functions/printTokenError"

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