import * as fs from "fs"
import * as chai from "chai"
import { CreateStreamConsumer } from "../src/runProgram"
import * as p20 from "pareto-20"

export function testProgram(
    inputFilePath: string,
    outDir: string,
    outBasename: string,
    outExtension: string,
    createStreamConsumer: CreateStreamConsumer,
): Promise<null | void> {
    const dataIn = fs.readFileSync(inputFilePath, { encoding: "utf-8" })

    const expectedOut = fs.readFileSync(outDir + "/" + outBasename + ".expected." + outExtension, { encoding: "utf-8" })

    let actualOut = ""
    const sc = createStreamConsumer(
        (str) => actualOut += str,
        (str) => {
            throw new Error(`unexpected error: ${str}`)
        }
    )

    return p20.createArray([dataIn]).streamify().consume(
        null,
        sc,
    ).convertToNativePromise().then(() => {
        if (actualOut !== expectedOut) {
            fs.writeFileSync(outDir + outBasename + ".actual." + outExtension, actualOut, { encoding: "utf-8" })
        }
        chai.assert.equal(expectedOut, actualOut)
    })
}