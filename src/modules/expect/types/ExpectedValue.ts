
export type ExpectedValueType =
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

export type ExpectedValue = {
    type: ExpectedValueType
    "null allowed": boolean
}
