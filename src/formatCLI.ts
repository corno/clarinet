import * as astn from "."
import { IStreamConsumer } from "./IStreamConsumer"

export function formatCLI(
    write: (str: string) => void,
    onError: (str: string) => void,
    createFormatter: (
        indentationString: string,
        newline: string,
        write: (str: string) => void,
        errorHandler: astn.IStructureErrorHandler<astn.TokenizerAnnotationData>,
    ) => astn.IParser<astn.TokenizerAnnotationData>
): IStreamConsumer<string, null, null> {
    return astn.createStreamPreTokenizer(
        astn.createTokenizer(
            createFormatter(
                "    ",
                "\r\n",
                (str) => {
                    write(str)
                },
                {
                    onStructureError: ($) => {
                        onError(`${astn.printStructureError($.error)} @ ${astn.printRange($.annotation.range)}`)
                    },
                    onTreeError: ($) => {
                        onError(`${astn.printTreeParserError($.error)} @ ${astn.printRange($.annotation.range)}`)
                    },
                },
            ),
            (error, range)=> {
                onError(`${astn.printTokenizerError(error)} @ ${astn.printRange(range)}`)
            },
        ),
        ($) => {
            onError(`${astn.printTokenError($.error)} @ ${astn.printRange($.range)}`)
        },
    )
}
