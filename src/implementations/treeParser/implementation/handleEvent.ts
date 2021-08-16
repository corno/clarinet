import { ITreeParser, Token, TreeParserEvent } from "../../../apis/Iuntyped"

function assertUnreachable<RT>(_x: never): RT {
    throw new Error("unreachable")
}

export function handleEvent<TokenAnnotation>(
    event: TreeParserEvent,
    annotation: TokenAnnotation,
    parser: ITreeParser<TokenAnnotation>,
): void {
    function createToken<Data>(
        data: Data,
    ): Token<Data, TokenAnnotation> {
        return {
            data: data,
            annotation: annotation,
        }
    }

    switch (event[0]) {
        case "close array": {
            const $ = event[1]
            return parser.closeArray(createToken($))
        }
        case "close object": {
            const $ = event[1]
            return parser.closeObject(createToken($))
        }
        case "open array": {
            const $ = event[1]
            return parser.openArray(createToken($))
        }
        case "open object": {
            const $ = event[1]
            return parser.openObject(createToken($))
        }
        case "simple string": {
            const $ = event[1]
            return parser.simpleString(createToken($))
        }
        case "multiline string": {
            const $ = event[1]
            return parser.multilineString(createToken($))
        }
        case "tagged union": {
            const $ = event[1]
            return parser.taggedUnion(createToken($))
        }
        default:
            return assertUnreachable(event[0])
    }
}