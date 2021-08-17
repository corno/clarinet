import * as i from "../types/ExpectedValue"

function assertUnreachable<RT>(_x: never): RT {
    throw new Error("unreachable")
}

export function printExpectedValueType(vt: i.ExpectedValueType): string {
    switch (vt) {
        case "array": {
            return `an array ([] or <>)`
        }
        case "shorthand group": {
            return `a shorhand type (<>)`
        }
        case "boolean": {
            return `a boolean (true/false)`
        }
        case "dictionary": {
            return `a dictionary ( {} )`
        }
        case "list": {
            return `a list ( [] )`
        }
        case "nothing": {
            return `nothing`
        }
        case "null": {
            return `'null'`
        }
        case "number": {
            return `a number`
        }
        case "object": {
            return `an object ( {} or () )`
        }
        case "string": {
            return `a string (quoted, apostrophed, multiline or non wrapped (including a number, a keyword, a boolean)`
        }
        case "quoted string": {
            return `a string with quotes`
        }
        case "nonwrapped string": {
            return `a string without quotes or aposthropes`
        }
        case "tagged union": {
            return `a tagged union ( | "statename" data )`
        }
        case "type": {
            return `a type ( () )`
        }
        case "type or shorthand group": {
            return `a type ( () ) or a shorhand type (<>)`
        }
        case "verbose group": {
            return `a verbose group ( () )`
        }
        default:
            return assertUnreachable(vt[0])
    }
}

export function printExpectedValue(vt: i.ExpectedValue): string {
    return `${printExpectedValueType(vt.type)}${vt["null allowed"] ? 'or null' : ''}`
}
