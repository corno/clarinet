import * as p from "pareto"
import * as astn from ".."

export function createProcessorForASTNStreamWithContext(
    serializedDatasetBaseName: string,
    serializedDatasetDirName: string,
    getSchemaSchemaBuilder: (
        name: string
    ) => astn.SchemaSchemaBuilder<astn.TokenizerAnnotationData, null> | null,
    getContextSchema: (
        dir: string,
        schemaFileName: string
    ) => p.IUnsafeValue<p.IStream<string, null>, astn.RetrievalError>,
    getReferencedSchema: (
        id: string
    ) => p.IUnsafeValue<p.IStream<string, null>, astn.RetrievalError>,
    getTypedTreeHandler: (
        schemaSpec: astn.ResolvedSchema<astn.TokenizerAnnotationData, null>
    ) => astn.TypedTreeHandler<astn.TokenizerAnnotationData, null>,
    onError: (error: string, severity: astn.DiagnosticSeverity, range: astn.Range | null) => void,
): p.IValue<p.IStreamConsumer<string, null, null>> {
    return astn.loadContextSchema(
        {
            basename: serializedDatasetBaseName,
            dirname: serializedDatasetDirName,
            getContextSchema: getContextSchema,
        },
        getSchemaSchemaBuilder,
        (error, severity) => {
            onError(astn.printContextSchemaError(error), severity, null)
        },
    ).mapResult(contextSchema => {
        return p.value(astn.createStreamPreTokenizer(
            astn.createTokenizer(
                astn.createDeserializer({
                    contextSchema: contextSchema,
                    resolveReferencedSchema: getReferencedSchema,
                    onError: (error, annotation, severity) => {
                        onError(`${astn.printDeserializationDiagnostic(error)}`, severity, annotation.range)
                    },
                    getSchemaSchemaBuilder: getSchemaSchemaBuilder,
                    handlerBuilder: getTypedTreeHandler,
                    onEnd: () => {
                        return p.value(null)
                    },
                })

            ),
            $ => {
                onError(astn.printTokenError($.error), astn.DiagnosticSeverity.error, $.range)
            }
        ))
    })
}