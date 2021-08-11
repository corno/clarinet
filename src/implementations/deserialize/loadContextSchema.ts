import * as p from "pareto"
import * as astncore from "../../core"
import { ContextSchema, ContextSchemaError, SchemaSchemaBuilder, TokenizerAnnotationData } from "../../interfaces"
import { RetrievalError } from "../../interfaces/deserialize/ResolveReferencedSchema"
import { loadExternalSchema } from "./loadExternalSchema"

function assertUnreachable<RT>(_x: never): RT {
    throw new Error("unreachable")
}

export type ContextSchemaData = {
    basename: string
    dirname: string
    getContextSchema: (dir: string, schemaFileName: string) => p.IUnsafeValue<p.IStream<string, null>, RetrievalError>
}

export const schemaFileName = "schema.astn-schema"

export function loadContextSchema(
    data: ContextSchemaData,
    getSchemaSchemaBuilder: (
        name: string,
    ) => SchemaSchemaBuilder<TokenizerAnnotationData, null> | null,
    onError: (error: ContextSchemaError, severity: astncore.DiagnosticSeverity) => void,
): p.IValue<ContextSchema<TokenizerAnnotationData, null>> {
    if (data.basename === schemaFileName) {
        //don't validate the schema against itself
        onError(["validating schema file against internal schema"], astncore.DiagnosticSeverity.warning)
        return p.value(["ignored"])
    }

    return data.getContextSchema(
        data.dirname,
        schemaFileName,
    ).mapError<ContextSchema<TokenizerAnnotationData, null>>(error => {
        switch (error[0]) {
            case "not found": {
                //this is okay, the context schema is optional
                return p.value(["not available"])
            }
            case "other": {
                const $ = error[1]
                onError(["external schema resolving", ["loading", {
                    message: `other: ${$.description}`,
                }]], astncore.DiagnosticSeverity.error)
                return p.value(["has errors"])
            }
            default:
                return assertUnreachable(error[0])
        }
    }).mapResult<ContextSchema<TokenizerAnnotationData, null>>(
        stream => {
            return loadExternalSchema(
                stream,
                getSchemaSchemaBuilder,
                error => {
                    onError(["external schema resolving", error], astncore.DiagnosticSeverity.error)
                },
            ).reworkAndCatch<ContextSchema<TokenizerAnnotationData, null>>(
                _error => {
                    return p.value(["has errors"])
                },
                schema => {
                    return p.value(["available", schema])
                }
            )
        }
    ).catch(error => {
        return p.value(error)
    })
    // return loadExternalSchema(
    //     ,
    //     getSchemaSchemaBuilder,
    //     error => {
    //         onError(["external schema resolving", error], astncore.DiagnosticSeverity.error)
    //     },
    // )
}