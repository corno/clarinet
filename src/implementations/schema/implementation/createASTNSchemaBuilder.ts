/* eslint
    no-console: "off",
*/

import { SchemaSchemaBuilder } from "../../../apis/Ideserialize"
import { DiagnosticSeverity } from "../../../modules/diagnosticSeverity/types/DiagnosticSeverity"
import { createExpectContext } from "../../../modules/expect/functions/createExpectContext"
import { ExpectSeverity } from "../../../modules/expect/types/expectSeverity"
import { OnDuplicateEntry } from "../../../modules/expect/types/onDuplicateEntry"
import { createDummyValueHandler } from "../../../modules/parser/functions/dummyHandlers"
import { createDummyTypedHandler } from "../../typedHandlers"
import { createASTNSchemaDeserializer } from "../../../modules/typed/functions/createASTNSchemaDeserializer"


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
