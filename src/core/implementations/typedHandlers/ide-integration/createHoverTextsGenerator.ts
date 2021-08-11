
import { TypedTreeHandler, Token, TypedValueHandler } from "../../../interfaces"

function assertUnreachable<RT>(_x: never): RT {
    throw new Error("unreachable")
}
function cc<T>(input: T, callback: (output: T) => void): void {
    callback(input)
}

type GetHoverText = () => string


export type OnTokenHoverText<TokenAnnotation> = (
    annotation: TokenAnnotation,
    getHoverTexts: GetHoverText | null,
) => void

export function createHoverTextsGenerator<TokenAnnotation, NonTokenAnnotation>(
    onToken: OnTokenHoverText<TokenAnnotation>,
    onEnd: () => void,
): TypedTreeHandler<TokenAnnotation, NonTokenAnnotation> {

    function createValueHoverTextGenerator(
        name: string | null,
    ): TypedValueHandler<TokenAnnotation, NonTokenAnnotation> {
        function addOnToken<Data>(token: Token<Data, TokenAnnotation> | null) {
            if (name !== null) {
                const cn = name
                if (token !== null) {
                    onToken(token.annotation, () => {
                        return cn
                    })
                }
            }
        }
        return {
            onDictionary: $ => {
                addOnToken($.token)
                return {
                    onClose: $ => {
                        addOnToken($.token)
                    },
                    onEntry: () => {
                        return createValueHoverTextGenerator(null)
                    },
                }
            },
            onList: $ => {
                addOnToken($.token)
                return {
                    onClose: $ => {
                        addOnToken($.token)
                    },
                    onElement: () => {
                        return createValueHoverTextGenerator(null)
                    },
                }
            },
            onTaggedUnion: $ => {
                addOnToken($.token)
                return {
                    onUnexpectedOption: () => {
                        return createValueHoverTextGenerator(null)
                    },
                    onOption: $ => {
                        addOnToken($.token)
                        return createValueHoverTextGenerator(null)
                    },
                    onEnd: () => {
                    },
                }
            },
            onSimpleString: $ => {
                addOnToken($.token)
            },
            onMultilineString: $ => {
                addOnToken($.token)
            },
            onTypeReference: () => {
                return createValueHoverTextGenerator(name)
            },
            onGroup: $ => {
                switch ($.type[0]) {
                    case "mixin":
                        break
                    case "omitted":
                        break
                    case "verbose":
                        cc($.type[1], $ => {
                            addOnToken($)
                        })
                        break
                    case "shorthand":
                        cc($.type[1], $ => {
                            addOnToken($)
                        })
                        break
                    default:
                        assertUnreachable($.type[0])
                }
                return {
                    onUnexpectedProperty: () => {
                        //
                    },
                    onProperty: $ => {
                        return createValueHoverTextGenerator($.key)
                    },
                    onClose: $ => {
                        addOnToken($.token)
                    },
                }
            },
        }
    }
    return {
        root: createValueHoverTextGenerator(null),
        onEnd: () => {
            return onEnd()
        },
    }
}