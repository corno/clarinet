
import * as p from "pareto"
import { SchemaAndSideEffects } from "../../modules/typed/interfaces/SchemaAndSideEffects"
import { SchemaSchemaBuilder } from "../../modules/typed/interfaces/SchemaSchemaBuilder"
import { TokenizerAnnotationData } from "../../modules/tokenizer/types/TokenizerAnnotationData"
import { createStreamPreTokenizer } from "../../modules/tokenizer/functions/createStreamPreTokenizer"
import { createTokenizer } from "../../modules/tokenizer/functions/createTokenizer"
import { ExternalSchemaResolvingError } from "../types/ContextSchemaError"
import { createSchemaParser } from "./createSchemaParser"

export function loadExternalSchema(
    stream: p.IStream<string, null>,
    getSchemaSchemaBuilder: (
        name: string,
    ) => SchemaSchemaBuilder<TokenizerAnnotationData, null> | null,
    onError: (
        error: ExternalSchemaResolvingError
    ) => void,
): p.IUnsafeValue<SchemaAndSideEffects<TokenizerAnnotationData, null>, null> {
    let foundErrors = false
    let schema: SchemaAndSideEffects<TokenizerAnnotationData, null> | null = null
    return stream.consume<null>(
        null,
        createStreamPreTokenizer(
            createTokenizer(
                createSchemaParser(
                    getSchemaSchemaBuilder,
                    _error => {
                        foundErrors = true
                        //console.error("SCHEMA ERROR", error)
                    },
                    $ => {
                        schema = $
                        return p.value(null)
                    }
                )
            ),
            _error => {
                foundErrors = true
            }
        ),
    ).try(
        () => {
            if (schema === null) {
                if (!foundErrors) {
                    throw new Error("no schema and no errors")
                }
                onError(["errors in external schema"])
                return p.error(null)
            } else {
                return p.success(schema)
            }
        },
    )
}