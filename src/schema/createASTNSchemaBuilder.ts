/* eslint
    no-console: "off",
*/

import { DiagnosticSeverity } from "../generic"
import { SchemaSchemaBuilder } from "../interfaces"
import { createDummyTypedHandler } from "../typedHandlers"
import { createDummyValueHandler, createExpectContext, ExpectSeverity, OnDuplicateEntry } from "../untypedHandlers"
import { createASTNSchemaDeserializer } from "./createASTNSchemaDeserializer"


export function createASTNSchemaBuilder<TokenAnnotation, NonTokenAnnotation>(): SchemaSchemaBuilder<TokenAnnotation, NonTokenAnnotation> | null {
    return (onError2, onSchema) => {
        let foundErrors = false
        return createASTNSchemaDeserializer(
            createExpectContext(
                $ => {
                    if ($.severity === DiagnosticSeverity.error) {
                        onError2(["expect", $.issue], $.annotation)
                    }
                },
                () => createDummyValueHandler(),
                () => createDummyValueHandler(),
                ExpectSeverity.warning,
                OnDuplicateEntry.ignore,
            ),
            (message, annotation) => {
                foundErrors = true
                onError2(["validation", { message: message }], annotation)
            },
            schema => {
                if (schema === null) {
                    if (foundErrors === false) {
                        throw new Error("no schema, no errors")
                    }
                } else {
                    onSchema({
                        schema: schema,
                        createStreamingValidator: () => {
                            return createDummyTypedHandler()
                        },
                    })
                }
            },
        )
    }
}
