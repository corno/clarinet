import * as astncore from "../../core"
import { SchemaDeserializationError } from "../../interfaces/deserialize"

function assertUnreachable<RT>(_x: never): RT {
    throw new Error("unreachable")
}

export function printEmbeddedSchemaDeserializationError(error: SchemaDeserializationError): string {
    switch (error[0]) {
        case "expect": {
            const $$$ = error[1]
            return astncore.printExpectError($$$)
        }
        case "validation": {
            const $$$ = error[1]

            return $$$.message
        }
        case "stacked": {
            const $$$ = error[1]

            return astncore.printTreeParserError($$$)
        }
        default:
            return assertUnreachable(error[0])
    }
}