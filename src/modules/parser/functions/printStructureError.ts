import { StructureErrorType } from "../types/StructureErrorType"

function assertUnreachable<RT>(_x: never): RT {
    throw new Error("unreachable")
}

export function printStructureError($$: StructureErrorType): string {
    switch ($$[0]) {
        case "unknown punctuation": {
            return `unknown punctuation`
        }
        case "unexpected '!'": {
            return `unexpected '!'`
        }
        case "expected rootvalue": {
            return `expected rootvalue`
        }
        case "expected the schema": {
            return `expected the schema`
        }
        case "expected an embedded schema": {
            return `expected an embedded schema`
        }
        case "expected a schema schema reference": {
            return `expected a schema schema reference`
        }
        case "expected the schema start (!) or root value": {
            return `expected the schema start (!) or root value`
        }
        case "expected a schema reference or an embedded schema": {
            return `expected a schema reference or an embedded schema`
        }
        case "unexpected data after end": {
            const $$$ = $$[1]
            return `unexpected data after end: ${$$$.data}`
        }
        default:
            return assertUnreachable($$[0])
    }
}
