// import * as fs from "fs"
import * as fs from "fs"
import * as chai from "chai"
import * as astn from "../src"
import { consumeString } from "./consumeString"

const dir = "./test/data/formatting/"

const dataIn = fs.readFileSync(dir + "in.astn", { encoding: "utf-8" })

// core.createSerializedQuotedString(schemaReference.data.value)


// const newline = "\r\n"
// const indentation = "    "

function format(
    createFormatter: (
        indentationString: string,
        newline: string,
        write: (str: string) => void,
        errorHandler: astn.StructureErrorHandler<astn.TokenizerAnnotationData>,
    ) => astn.IParser<astn.TokenizerAnnotationData>,
    outBasename: string,
    outExtension: string
): Promise<null | void> {

    let actualOut = ""

    const expectedOut = fs.readFileSync(dir + outBasename + ".expected." + outExtension, { encoding: "utf-8" })

    const astnFormatter = createFormatter(
        "    ",
        "\r\n",
        str => {
            actualOut += str
        },
        {
            onStructureError: $ => {
                throw new Error(`unexpected error ${astn.printStructureError($.error)} @ ${astn.printRange($.annotation.range)}`)
            },
            onTreeError: $ => {
                throw new Error(`unexpected error ${astn.printTreeParserError($.error)} @ ${astn.printRange($.annotation.range)}`)
            },
        },
    )

    return consumeString(
        dataIn,
        astn.createStreamPreTokenizer(
            astn.createTokenizer(
                astnFormatter
            ),
            $ => {
                throw new Error(`unexpected error ${astn.printTokenError($.error)} @ ${astn.printRange($.range)}`)
            },
        ),
    ).convertToNativePromise().then(() => {
        if (actualOut !== expectedOut) {
            fs.writeFileSync(dir + outBasename + ".actual." + outExtension, actualOut, { encoding: "utf-8" })
        }
        //fs.writeFileSync("./test/data/formatting/actualAfter.astn", actualAfter, { encoding: "utf-8"})
        chai.assert.equal(expectedOut, actualOut)
    })
}

describe('formatting', () => {
    it("normalized ASTN", () => {
        return format(
            astn.createASTNSerializer,
            "normalized",
            "astn",
        )
    })
    it("JSON", () => {
        return format(
            astn.createJSONSerializer,
            "out",
            "json"
        )
    })
})