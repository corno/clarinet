import { ContextSchemaError } from "../../../apis/Ideserialize/interface/Errors"
import { printExternalSchemaResolvingError } from "./printDeserializeDiagnostic"

function assertUnreachable<RT>(_x: never): RT {
	throw new Error("unreachable")
}

export function printContextSchemaError(error: ContextSchemaError): string {
	switch (error[0]) {
		case "external schema resolving": {
			const $ = error[1]
			return `${printExternalSchemaResolvingError($)}`
		}
		case "validating schema file against internal schema": {
			return "validating schema file against internal schema"
		}
		default:
			return assertUnreachable(error[0])
	}
}
