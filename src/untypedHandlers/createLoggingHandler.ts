import * as i from "../Iuntyped"

export function createLoggingHandler<TokenAnnotation, NonTokenAnnotation>(
    onEvent: (event: i.TreeParserEvent, annotation: TokenAnnotation) => void,
): i.TreeHandler<TokenAnnotation, NonTokenAnnotation> {
    function createLoggingRequiredValueHandler(
    ): i.RequiredValueHandler<TokenAnnotation, NonTokenAnnotation> {
        return {
            exists: createLoggingValueHandler(),
            missing: () => {
            },
        }
    }

    function createLoggingValueHandler(
    ): i.ValueHandler<TokenAnnotation, NonTokenAnnotation> {
        return {
            array: $ => {
                onEvent(["open array", $.token.data], $.token.annotation)
                return {
                    element: () => {
                        return createLoggingValueHandler()
                    },
                    arrayEnd: $ => {
                        onEvent(["close array", $.token.data], $.token.annotation)
                    },
                }
            },
            object: $ => {
                onEvent(["open object", $.token.data], $.token.annotation)

                return {
                    property: $ => {
                        onEvent(["simple string", $.token.data], $.token.annotation)
                        return createLoggingRequiredValueHandler()
                    },
                    objectEnd: $ => {
                        onEvent(["close object", $.token.data], $.token.annotation)
                    },
                }
            },
            simpleString: $ => {
                onEvent(["simple string", $.token.data], $.token.annotation)
            },
            multilineString: $ => {
                onEvent(["multiline string", $.token.data], $.token.annotation)
            },
            taggedUnion: $ => {
                onEvent(["tagged union", $.token.data], $.token.annotation)
                return {
                    option: $ => {
                        onEvent(["simple string", $.token.data], $.token.annotation)
                        return createLoggingRequiredValueHandler()
                    },
                    missingOption: () => {
                    },
                    end: () => {
                    },
                }
            },
        }
    }
    return {
        root: createLoggingRequiredValueHandler(),
        onEnd: () => {},
    }
}