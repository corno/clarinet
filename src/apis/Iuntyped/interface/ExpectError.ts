
export type ExpectError =
    | "array"
    | "boolean"
    | "dictionary"
    | "list"
    | "nothing"
    | "null"
    | "number"
    | "object"
    | "nonwrapped string"
    | "quoted string"
    | "shorthand group"
    | "string"
    | "tagged union"
    | "type or shorthand group"
    | "type"
    | "verbose group"

export type ExpectErrorValue = {
    type: ExpectError
    "null allowed": boolean
}

export type ExpectedToken =
    | "close angle bracket"
    | "close bracket"
    | "close curly"
    | "close paren"
    | "open angle bracket"
    | "open bracket"
    | "open curly"
    | "open paren"
