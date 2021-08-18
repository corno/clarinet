import { ExternalSchemaResolvingError } from "../../../apis/Ideserialize/interface/ContextSchemaError"

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