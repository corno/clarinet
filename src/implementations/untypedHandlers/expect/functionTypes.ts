import { DiagnosticSeverity } from "../../../generic";
import * as i from "../../../apis/Iuntyped";

export type ExpectIssueHandler<TokenAnnotation> = ($: {
    issue: ExpectErrorValueType
    severity: DiagnosticSeverity
    annotation: TokenAnnotation
}) => void

export enum ExpectSeverity {
    warning,
    error,
    nothing
}
export enum OnDuplicateEntry {
    ignore,
    overwrite
}

export type ExpectErrorValueType =
    | ["array is not a list", {
        //
    }]
    | ["array is not a shorthand group", {
        //
    }]

    | ["object is not a verbose group", {
        //
    }]

    | ["object is not a dictionary", {
        //
    }]
    | ["invalid value type", {
        found: i.ExpectError
        expected: i.ExpectErrorValue
    }]
    | ["invalid string", {
        found: string
        expected: i.ExpectErrorValue
    }]
    | ["expected token", {
        token: i.ExpectedToken
        found: string
    }]
    | ["duplicate entry", {
        key: string
    }]
    | ["duplicate property", {
        name: string
    }]
    | ["missing property", {
        name: string
    }]
    | ["unexpected property", {
        "found key": string
        "valid keys": string[]
    }]
    | ["not a valid number", {
        value: string
    }]
    | ["string is not quoted", {
    }]
    | ["string should not have quotes or apostrophes", {
    }]
    | ["superfluous element", {
    }]
    | ["elements missing", {
        names: string[]
    }]
    | ["unknown option", {
        "found": string
        "valid options": string[]
    }]