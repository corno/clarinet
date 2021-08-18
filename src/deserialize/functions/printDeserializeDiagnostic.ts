
import { printStructureError } from "../../modules/parser/functions/printStructureError"
import { printUnmarshallError } from "../../modules/typed/functions/printUnmarshallError"
import { printTokenError } from "../../modules/tokenizer/functions/printTokenError"
import { printSchemaDeserializationError } from "../../modules/schema/functions/printSchemaDeserializationError"
import { printExternalSchemaResolvingError } from "./printExternalSchemaResolvingError"
import { DeserializeError } from "../types/DeserializeError"

function assertUnreachable<RT>(_x: never): RT {
    throw new Error("unreachable")
}

export function printDeserializationDiagnostic($: DeserializeError): string {
    switch ($[0]) {
        case "tree": {
            const $$ = $[1]
            return $$[0]
        }
        case "unmarshall": {
            const $$ = $[1]
            return printUnmarshallError($$)
        }
        case "tokenizer": {
            const $$ = $[1]
            return printTokenError($$)
        }
        case "structure": {
            const $$ = $[1]
            return printStructureError($$)
        }
        case "embedded schema error": {
            const $$ = $[1]
            return printSchemaDeserializationError($$)
        }
        case "found both internal and context schema. ignoring internal schema": {
            return `found both internal and context schema. ignoring internal schema`
        }
        case "invalid embedded schema": {
            return $[0]
        }
        case "no schema": {
            return "no schema found"
        }
        case "no valid schema": {
            return "no valid schema found"
        }
        case "invalid schema reference": {
            return $[0]
        }
        case "schema reference resolving": {
            const $$$ = $[1]
            return printExternalSchemaResolvingError($$$)
        }
        default:
            return assertUnreachable($[0])
    }
}
