import { SchemaDeserializationError } from "../types/SchemaDeserializationError"

import { printExpectError } from "../../modules/expect/functions/printExpectError"

function assertUnreachable<RT>(_x: never): RT {
    throw new Error("unreachable")
}

export function printSchemaDeserializationError(error: SchemaDeserializationError): string {
    switch (error[0]) {
        case "expect": {
            const $$$ = error[1]
            return printExpectError($$$)
        }
        case "validation": {
            const $$$ = error[1]

            return $$$.message
        }
        default:
            return assertUnreachable(error[0])
    }
}