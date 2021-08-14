import { SchemaDeserializationError } from "../Ideserialize"
import { printTreeParserError } from "../treeParser"
import { printExpectError } from "../untypedHandlers"

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