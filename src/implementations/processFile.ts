/* eslint
    no-console: "off",
*/

import * as p from "pareto"
import * as astn from ".."
import * as p20 from "pareto-20"
//import { createBuilder, createSerializeInterface, Datastore, SerializationStyle } from "../src"


// export function createNormalizer(
//     style: SerializationStyle,
//     onEnd: (str: string) => void,
// ): (schemaSpec: astn.ResolvedSchema<astn.TokenizerAnnotationData, null>) => astn.TypedTreeHandler<astn.TokenizerAnnotationData, null> {
//     return resolvedSchema => {
//         const simpleDS: Datastore = {
//             root: { type: null },
//         }
//         return createBuilder(
//             simpleDS,
//             () => {
//                 let out = ""
//                 return astn.serialize(
//                     createSerializeInterface(simpleDS),
//                     resolvedSchema.schemaAndSideEffects.schema,
//                     resolvedSchema.specification,
//                     style,
//                     str => {
//                         //console.log("!!!!", str)
//                         out += str
//                     },
//                 ).mapResult(() => {
//                     console.log("XXX", out)
//                     return onEnd(out)
//                 })
//             }
//         )
//     }
// }

export function processFile(
    serializedDataset: string,
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
    onError: (error: string, severity: astn.DiagnosticSeverity) => void,
    handlerBuilder: (schemaSpec: astn.ResolvedSchema<astn.TokenizerAnnotationData, null>) => astn.TypedTreeHandler<astn.TokenizerAnnotationData, null>,
): p.IValue<null> {

    return astn.loadContextSchema(
        {
            basename: serializedDatasetBaseName,
            dirname: serializedDatasetDirName,
            getContextSchema: getContextSchema,
        },
        getSchemaSchemaBuilder,
        (error, severity) => {
            onError(astn.printContextSchemaError(error), severity)
        },
    ).mapResult(contextSchema => {
        return p20.createArray(
            [serializedDataset]
        ).streamify().consume(
            null,
            astn.createStreamPreTokenizer(
                astn.createTokenizer(
                    astn.createDeserializer({
                        contextSchema: contextSchema,
                        resolveReferencedSchema: getReferencedSchema,
                        onError: (error, annotation, severity) => {
                            onError(`${astn.printDeserializationDiagnostic(error)} @ ${astn.printRange(annotation.range)}`, severity)
                        },
                        getSchemaSchemaBuilder: getSchemaSchemaBuilder,
                        handlerBuilder: handlerBuilder,
                        onEnd: () => {
                            return p.value(null)
                        },
                    })

                ),
                $ => {
                    onError(astn.printTokenError($.error), astn.DiagnosticSeverity.error)
                }
            )
        )
    })
}