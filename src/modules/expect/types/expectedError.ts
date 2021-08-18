import { ExpectedValue, ExpectedValueType } from "./ExpectedValue"


export type ExpectedToken =
| "close angle bracket"
| "close bracket"
| "close curly"
| "close paren"
| "open angle bracket"
| "open bracket"
| "open curly"
| "open paren"


export type ExpectError =
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
    found: ExpectedValueType
    expected: ExpectedValue
}]
| ["invalid string", {
    found: string
    expected: ExpectedValue
}]
| ["expected token", {
    token: ExpectedToken
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