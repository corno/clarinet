// import * as fs from "fs"
import * as fs from "fs"
import * as chai from "chai"
import * as astn from "../src"
import * as core from "../src/core"
import { consumeString } from "./consumeString"
import { createASTNSerializer, createStreamPreTokenizer, createTokenizer, printRange, printStructureError, TokenConsumer, TokenizerAnnotationData } from "../src"
import { StructureErrorHandler } from "../src/implementations/structureParser/createStructureParser"
import { printTokenError } from "../src/implementations/pretokenizer/printTokenError"
import { printTreeParserError } from "../src/core/implementations/treeParser/printTreeParserErrorError"
import { createJSONSerializer } from "../src/implementations/formatting/createJSONSerializer"

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
        errorHandler: StructureErrorHandler<astn.TokenizerAnnotationData>,
    ) => TokenConsumer<astn.TokenizerAnnotationData>,
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
                throw new Error(`unexpected error ${printStructureError($.error)} @ ${printRange($.annotation.range)}`)
            },
            onTreeError: $ => {
                throw new Error(`unexpected error ${printTreeParserError($.error)} @ ${printRange($.annotation.range)}`)
            },
        },
    )

    return consumeString(
        dataIn,
        createStreamPreTokenizer(
            createTokenizer(
                astnFormatter
            ),
            $ => {
                throw new Error(`unexpected error ${printTokenError($.error)} @ ${printRange($.range)}`)
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
            createASTNSerializer,
            "normalized",
            "astn",
        )
    })
    it("JSON", () => {
        return format(
            createJSONSerializer,
            "out",
            "json"
        )
    })
})