
import * as p from "pareto"
import { RetrievalError } from "../types/RetrievalError"
import { SchemaAndSideEffects } from "../../modules/typed/interfaces/SchemaAndSideEffects"
import { SchemaSchemaBuilder } from "../../modules/typed/interfaces/SchemaSchemaBuilder"
import { TokenizerAnnotationData } from "../../modules/tokenizer/types/TokenizerAnnotationData"
import { ExternalSchemaResolvingError } from "../types/ContextSchemaError"
import { loadExternalSchema } from "./loadExternalSchema"


function assertUnreachable<RT>(_x: never): RT {
    throw new Error("unreachable")
}

export function loadPossibleExternalSchema(
    possibleStream: p.IUnsafeValue<p.IStream<string, null>, RetrievalError>,
    getSchemaSchemaBuilder: (
        name: string,
    ) => SchemaSchemaBuilder<TokenizerAnnotationData, null> | null,
    onError: (
        error: ExternalSchemaResolvingError
    ) => void,
): p.IUnsafeValue<SchemaAndSideEffects<TokenizerAnnotationData, null>, null> {

    return possibleStream.mapError(error => {
        switch (error[0]) {
            case "not found": {
                onError(["loading", {
                    message: "schema not found",
                }])
                return p.value(null)
            }
            case "other": {
                const $ = error[1]
                onError(["loading", {
                    message: `other: ${$.description}`,
                }])
                return p.value(null)
            }
            default:
                return assertUnreachable(error[0])
        }
    }).try(
        stream => {
            return loadExternalSchema(
                stream,
                getSchemaSchemaBuilder,
                onError,
            )
        }
    )
}