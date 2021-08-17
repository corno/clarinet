
import { DeserializeError, ExternalSchemaResolvingError } from "../../../apis/Ideserialize/interface/Errors"
import { printStructureError } from "../../../modules/parser/functions/printStructureError"
import { printUnmarshallError } from "../../../modules/typed/functions/printUnmarshallError"
import { printTokenError } from "../../../modules/tokenizer/functions/printTokenError"
import { printEmbeddedSchemaDeserializationError } from "./printEmbeddedSchemaDeserializationError"

function assertUnreachable<RT>(_x: never): RT {
    throw new Error("unreachable")
}

export function printExternalSchemaResolvingError(error: ExternalSchemaResolvingError): string {

    switch (error[0]) {
        case "errors in external schema": {
            return `errors in external schema`
        }
        case "loading": {
            const $$$$ = error[1]
            return $$$$.message
        }
        default:
            return assertUnreachable(error[0])
    }
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
            return printEmbeddedSchemaDeserializationError($$)
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
