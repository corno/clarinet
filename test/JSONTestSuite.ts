import * as p from "pareto"
import * as fs from "fs"
import { describe } from "mocha"
import assert from "assert"
import * as path from "path"
import * as p20 from "pareto-20"
import * as astn from "../src"

function tokenizeStrings(
    strings: string[],
    onError: () => void,
) {
    p20.createArray(strings).streamify().handle(
        null,
        astn.createStreamPreTokenizer(
            astn.createTokenizer(
                astn.createStructureParser({
                    onEmbeddedSchema: () => astn.createDummyTreeHandler(),
                    onSchemaReference: () => {
                        return p.value(false)
                    },
                    onBody: () => astn.createDummyTreeHandler(),
                    errors: {
                        onTreeError: onError,
                        onStructureError: onError,
                    },
                    onEnd: () => {
                        return p.value(null)
                    },

                })
            ),
            onError,
        )
    )
}

const parsingDir = path.join(__dirname, "/../../test/data/JSONTestSuite/test_parsing")
describe('parsing', () => {
    fs.readdirSync(parsingDir).forEach(file => {
        it(file, () => {
            const expected = file[0]
            switch (expected) {
                case "n": {
                    try {
                        let foundError = false
                        const data = fs.readFileSync(path.join(parsingDir, file), { encoding: "utf-8" })
                        tokenizeStrings(
                            [data],
                            () => {
                                foundError = true
                            },
                        )
                        assert.ok(foundError, "no errors found")
                    } catch (e) {
                        //nothing to do
                    }
                    break
                }
                case "y": {
                    try {
                        let foundError = false
                        const data = fs.readFileSync(path.join(parsingDir, file), { encoding: "utf-8" })
                        tokenizeStrings(
                            [data],
                            () => {
                                foundError = true
                            },
                        )
                        assert.ok(!foundError, "errors found")
                    } catch (e) {
                        //do nothing
                    }
                    break
                }
                case "i":
                    try {
                        const data = fs.readFileSync(path.join(parsingDir, file), { encoding: "utf-8" })
                        tokenizeStrings(
                            [data],
                            () => {
                                //do nothing with the error
                            },
                        )
                    } catch (e) {
                        //do nothing
                    }
                    break
                default:
                    throw new Error("unknown expected result: " + expected)
            }
        })
    })
})

const transformDir = path.join(__dirname, "/../../test/data/JSONTestSuite/test_transform")
describe('transform', () => {
    fs.readdirSync(transformDir).forEach(file => {
        it(file, () => {
            try {
                const data = fs.readFileSync(path.join(transformDir, file), { encoding: "utf-8" })
                tokenizeStrings(
                    [data],
                    () => {
                        //do nothing with the error
                    },
                )
            } catch (e) {
                //do nothing
            }
        })
    })
})
