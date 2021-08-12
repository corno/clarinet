import * as stream from "stream"
// import * as core from "../src/core"
// import { createASTNTextFormatter, TokenizerAnnotationData } from "../src"
import * as astn from "../src"

export function formatCLI(
    createFormatter: (
        indentationString: string,
        newline: string,
        write: (str: string) => void,
        errorHandler: astn.StructureErrorHandler<astn.TokenizerAnnotationData>,
    ) => astn.TokenConsumer<astn.TokenizerAnnotationData>
): void {

    const astnFormatter = astn.createStreamPreTokenizer(
        astn.createTokenizer(
            createFormatter(
                "    ",
                "\r\n",
                str => {
                    process.stdout.write(str)
                },
                {
                    onStructureError: $ => {
                        console.error(`${astn.printStructureError($.error)} @ ${astn.printRange($.annotation.range)}`)
                    },
                    onTreeError: $ => {
                        console.error(`${astn.printTreeParserError($.error)} @ ${astn.printRange($.annotation.range)}`)
                    },
                },
            )
        ),
        $ => {
            console.error(`${astn.printTokenError($.error)} @ ${astn.printRange($.range)}`)
        },
    )
    process.stdin.setEncoding("utf-8")
    process.stdin.pipe(
        new stream.Writable({
            defaultEncoding: "utf-8",
            write: function (data, _encoding, callback) {
                astnFormatter.onData(data.toString()).handle(_aborted => {
                    callback()
                })
            },
        })
    ).on('finish', () => {
        astnFormatter.onEnd(false, null).handle(() => {
            //nothing to do
        })
    })
}
