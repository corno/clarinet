/* eslint
    no-console: "off",
*/

import { SchemaSchemaBuilder } from "../../schema/types/SchemaSchemaBuilder"

import { DiagnosticSeverity } from "../../diagnosticSeverity/types/DiagnosticSeverity"
import { ExpectSeverity } from "../../expect/types/expectSeverity"
import { OnDuplicateEntry } from "../../expect/types/onDuplicateEntry"

import { createExpectContext } from "../../expect/functions/createExpectContext"
import { createDummyValueHandler } from "../../parser/functions/dummyHandlers"
import { createASTNSchemaDeserializer } from "../../schema/functions/createASTNSchemaDeserializer"
import { createDummyTypedHandler } from "./createDummyTypedHandler"


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
