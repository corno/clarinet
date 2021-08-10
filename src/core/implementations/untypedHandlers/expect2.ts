import * as i from "../../interfaces/untyped"

function assertUnreachable<RT>(_x: never): RT {
    throw new Error("unreachable")
}

export type ValueType<TokenAnnotation, NonTokenAnnotation> =
    | [
        "dicionary",
        i.ExpectDictionaryParameters<TokenAnnotation, NonTokenAnnotation>
    ]
    | [
        "list",
        i.ExpectListParameters<TokenAnnotation, NonTokenAnnotation>
    ]
    | [
        "quoted string",
        i.ExpectQuotedStringParameters<TokenAnnotation>
    ]
    | [
        "simple string",
        i.ExpectStringParameters<TokenAnnotation>
    ]
    | [
        "tagged union",
        i.ExpectTaggedUnionParameters<TokenAnnotation, NonTokenAnnotation>
    ]
    | [
        "verbose group",
        i.ExpectVerboseGroupParameters<TokenAnnotation, NonTokenAnnotation>
    ]

export function createRequiredValueHandler<TokenAnnotation, NonTokenAnnotation>(
    context: i.IExpectContext<TokenAnnotation, NonTokenAnnotation>,
    valueType: ValueType<TokenAnnotation, NonTokenAnnotation>,
    onMissing?: () => void
): i.RequiredValueHandler<TokenAnnotation, NonTokenAnnotation> {
    return {
        exists: createValueHandler(
            context,
            valueType,
        ),
        missing: onMissing !== undefined ? onMissing : () => {
            //
        },
    }
}

export function createValueHandler<TokenAnnotation, NonTokenAnnotation>(
    context: i.IExpectContext<TokenAnnotation, NonTokenAnnotation>,
    valueType: ValueType<TokenAnnotation, NonTokenAnnotation>,
): i.ValueHandler<TokenAnnotation, NonTokenAnnotation> {
    switch (valueType[0]) {
        case "dicionary": {
            const $1 = valueType[1]
            return context.expectDictionary($1)
        }
        case "list": {
            const $1 = valueType[1]
            return context.expectList($1)
        }
        case "quoted string": {
            const $1 = valueType[1]
            return context.expectQuotedString($1)
        }
        case "simple string": {
            const $1 = valueType[1]
            return context.expectSimpleString($1)
        }
        case "tagged union": {
            const $1 = valueType[1]
            return context.expectTaggedUnion($1)
        }
        case "verbose group": {
            const $1 = valueType[1]
            return context.expectVerboseGroup($1)
        }
        default:
            return assertUnreachable(valueType[0])
    }
}