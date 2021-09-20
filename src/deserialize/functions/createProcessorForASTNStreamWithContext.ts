import * as p from "pareto"
import { Range } from "../../modules/tokenizer/types/range"
import { ITypedTreeHandler } from "../../modules/typed/interfaces/ITypedTreeHandler"
import { DiagnosticSeverity } from "../../modules/diagnosticSeverity/types/DiagnosticSeverity"
import { TokenizerAnnotationData } from "../../modules/tokenizer/types/TokenizerAnnotationData"
import { SchemaSchemaBuilder } from "../interfaces/SchemaSchemaBuilder"
import { RetrievalError } from "../types/RetrievalError"
import { ResolvedSchema } from "../interfaces/ResolvedSchema"
import { loadContextSchema } from "./loadContextSchema"
import { printContextSchemaError } from "./printContextSchemaError"
import { createStreamPreTokenizer } from "../../modules/tokenizer/functions/createStreamPreTokenizer"
import { createTokenizer } from "../../modules/tokenizer/functions/createTokenizer"
import { createASTNUnmarshaller } from "./createASTNUnmarshaller"
import { printDeserializationDiagnostic } from "./printDeserializeDiagnostic"
import { printTokenError } from "../../modules/tokenizer/functions/printTokenError"
import { printTokenizerError } from "../../modules/tokenizer/functions/createTokenizer"
import { IStreamConsumer } from "../../IStreamConsumer"

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
): p.IValue<IStreamConsumer<string, null, null>> {
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
    ).mapResult((contextSchema) => {
        return p.value(createStreamPreTokenizer(
            createTokenizer(
                createASTNUnmarshaller({
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
                }),
                (error, range) => {
                    onError(printTokenizerError(error), DiagnosticSeverity.error, range)
                },
            ),
            ($) => {
                onError(printTokenError($.error), DiagnosticSeverity.error, $.range)
            }
        ))
    })
}