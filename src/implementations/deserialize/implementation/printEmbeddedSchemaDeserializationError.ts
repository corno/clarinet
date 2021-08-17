import { SchemaDeserializationError } from "../../../apis/Ideserialize/interface/Errors"
import { printExpectX } from "../../../modules/expect/functions/printExpectError"
import { printTreeParserError } from "../../../modules/parser/functions/printTreeParserErrorError"

function assertUnreachable<RT>(_x: never): RT {
    throw new Error("unreachable")
}

export function printEmbeddedSchemaDeserializationError(error: SchemaDeserializationError): string {
    switch (error[0]) {
        case "expect": {
            const $$$ = error[1]
            return printExpectX($$$)
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