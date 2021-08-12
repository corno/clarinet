/* eslint
    no-console: "off",
*/

import * as astn from ".."
import {
    DiagnosticSeverity,
} from ".."


export function createASTNSchemaBuilder<TokenAnnotation, NonTokenAnnotation>(
): astn.SchemaSchemaBuilder<TokenAnnotation, NonTokenAnnotation> | null {
    return (onError2, onSchema) => {
        let foundErrors = false
        return astn.createASTNSchemaDeserializer(
            astn.createExpectContext(
                $ => {
                    if ($.severity === DiagnosticSeverity.error) {
                        onError2(["expect", $.issue], $.annotation)
                    }
                },
                () => astn.createDummyValueHandler(),
                () => astn.createDummyValueHandler(),
                astn.ExpectSeverity.warning,
                astn.OnDuplicateEntry.ignore,
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
                            return astn.createDummyTypedHandler()
                        },
                    })
                }
            },
        )
    }
}
