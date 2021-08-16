import { SchemaDeserializationError } from "../imports"
import { printTreeParserError } from "../imports"
import { printExpectError } from "../imports"

function assertUnreachable<RT>(_x: never): RT {
    throw new Error("unreachable")
}

export function printEmbeddedSchemaDeserializationError(error: SchemaDeserializationError): string {
    switch (error[0]) {
        case "expect": {
            const $$$ = error[1]
            return printExpectError($$$)
        }
        case "validation": {
            const $$$ = error[1]

            return $$$.message
        }
        case "stacked": {
            const $$$ = error[1]

            return printTreeParserError($$$)
        }
        default:
            return assertUnreachable(error[0])
    }
}