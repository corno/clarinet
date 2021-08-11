/* eslint
    no-console: "off",
*/

import * as chai from "chai"
import * as fs from "fs"
import * as path from "path"
import * as p from "pareto"
import { describe } from "mocha"
import * as astn from "../src"
import * as p20 from "pareto-20"
import {
    SerializationStyle,
    processFile,
    createTypedSerializer,
    DiagnosticSeverity,
    createASTNSchemaBuilder,
} from "../src"

function readFileFromFileSystem(
    dir: string,
    schemaFileName: string,
): p.IUnsafeValue<p.IStream<string, null>, astn.RetrievalError> {
    return p20.wrapUnsafeFunction((onError, onSuccess) => {
        fs.readFile(
            path.join(dir, schemaFileName),
            { encoding: "utf-8" },
            (err, data) => {
                if (err === null) {
                    onSuccess(p20.createArray([data]).streamify())
                } else {
                    if (err.code === "ENOENT") {
                        //there is no schema file
                        onError(["not found", {}])
                    } else if (err.code === "EISDIR") {
                        //the path is a directory
                        onError(["not found", {}])
                    } else {
                        console.log(err.code)
                        onError(["other", { description: err.message }])
                    }
                }
            }
        )
    })
}
const testsDir = "./test/data/typed_tests"

type Issue = [string, string | null, string] //errormessage, range as string, severity

type Issues = Issue[]

type CodeCompletions = {
    [key: string]: {
        inToken: string[] | null
        afterToken: string[] | null
    }
}

type HoverTexts = {
    [key: string]: {
        hoverText: string | null
    }
}

function deepEqual(
    testDirPath: string,
    name: string,
    extension: string,
    parseExpected: (expectedString: string) => any, //eslint-disable-line
    actual: any, //eslint-disable-line
    actualAsString: string,
) {
    const expectedPath = path.join(testDirPath, `${name}.expected.${extension}`)

    //fs.writeFileSync(expectedPath, actualAsString)
    const actualPath = path.join(".", testDirPath, `${name}.actual.${extension}`)
    try {
        fs.unlinkSync(actualPath)
    } catch (e) {
        //
    }

    const expectedAsString = fs.readFileSync(expectedPath, { encoding: "utf-8" })
    try {
        chai.assert.deepEqual(actual, parseExpected(expectedAsString))
    } catch (e) {
        fs.writeFileSync(actualPath, actualAsString)
        throw e
    }
}

function deepEqualJSON(
    testDirPath: string,
    name: string,
    actual: any, //eslint-disable-line
) {
    deepEqual(
        testDirPath,
        name,
        "json",
        str => JSON.parse(str),//eslint-disable-line
        actual,
        JSON.stringify(actual, undefined, "\t"),
    )
}
export function directoryTests(): void {

    describe("'tests' directory", () => {
        fs.readdirSync(testsDir).forEach(dir => {
            const testDirPath = path.join(testsDir, dir)
            const serializedDatasetPath = path.join(testDirPath, "data.astn.test")
            //const expectedOutputPath = path.join(testDirPath, "expected.astn.test")
            const serializedDataset = fs.readFileSync(serializedDatasetPath, { encoding: "utf-8" })

            function parse(
                onError: (error: string, severity: astn.DiagnosticSeverity) => void,
                getRootHandler: (
                    schema: astn.ResolvedSchema<astn.TokenizerAnnotationData, null>
                ) => astn.TypedTreeHandler<astn.TokenizerAnnotationData, null>,
            ): p.IValue<null> {
                return processFile(
                    serializedDataset,
                    path.basename(serializedDatasetPath),
                    path.dirname(serializedDatasetPath),
                    name => {
                        if (name !== "astn/schema@0.1") {
                            return null
                        }
                        return createASTNSchemaBuilder()
                    },
                    readFileFromFileSystem,
                    schemaID => {
                        return readFileFromFileSystem(__dirname + "../../../test/schema", schemaID)
                    },
                    onError,
                    getRootHandler,
                )
            }
            describe(dir, () => {
                it("issues", async () => {
                    const actualIssues: Issues = []
                    return parse(
                        (error, severity) => {
                            actualIssues.push([error, null, severity === astn.DiagnosticSeverity.warning ? "warning" : "error"])
                        },
                        schema => schema.schemaAndSideEffects.createStreamingValidator(
                            (error, annotation, severity) => {
                                actualIssues.push([error, astn.printRange(annotation.range), severity === astn.DiagnosticSeverity.warning ? "warning" : "error"])
                            }
                        ),
                    ).convertToNativePromise(
                    ).then(() => {
                        deepEqualJSON(testDirPath, "issues", actualIssues)
                    })
                })
                function testNormalize(
                    style: SerializationStyle,
                    file: string,
                ) {
                    let out = ""
                    return parse(
                        () => {

                        },
                        rs => createTypedSerializer(
                            rs,
                            style,
                            str => {
                                out += str
                            }
                        ),
                    ).mapResult(() => {
                        return p.value(out)
                    }).convertToNativePromise(
                    ).then(serialized => {
                        deepEqual(
                            testDirPath,
                            "output",
                            file,
                            str => str,
                            serialized,
                            serialized,
                        )
                    })

                }
                it("compact", () => {
                    return testNormalize(["compact"], "compact.astn")
                })
                it("verbose", () => {
                    return testNormalize(["expanded", { omitPropertiesWithDefaultValues: true }], "verbose.astn")
                })
                it("codecompletions", async () => {
                    const actualCodeCompletions: CodeCompletions = {}
                    return parse(
                        () => {
                            //
                        },
                        () => astn.createCodeCompletionsGenerator(
                            (annotation, getIntraCodeCompletions, getCodeCompletionsAfter) => {
                                if (actualCodeCompletions[astn.printRange(annotation.range)] !== undefined) {
                                    throw new Error(`double registration @ ${astn.printRange(annotation.range)}`)
                                }
                                actualCodeCompletions[astn.printRange(annotation.range)] = {
                                    inToken: getIntraCodeCompletions === null ? null : getIntraCodeCompletions(),
                                    afterToken: getCodeCompletionsAfter === null ? null : getCodeCompletionsAfter(),
                                }
                            },
                            () => {
                                return p.value(null)
                            },
                        ),
                    ).convertToNativePromise(
                    ).then(() => {
                        deepEqualJSON(testDirPath, "codecompletions", actualCodeCompletions)
                    })
                })
                it("hovertexts", async () => {
                    const actualHoverTexts: HoverTexts = {}
                    return parse(
                        () => {
                            //
                        },
                        () => astn.createHoverTextsGenerator(
                            (annotation, getHoverText) => {
                                actualHoverTexts[astn.printRange(annotation.range)] = {
                                    hoverText: getHoverText === null ? null : getHoverText(),
                                }
                            },
                            () => {
                                return p.value(null)
                            },
                        ),
                    ).convertToNativePromise(
                    ).then(() => {
                        deepEqualJSON(testDirPath, "hovertexts", actualHoverTexts)
                    })
                })

            })
        })
    })
}

directoryTests()
