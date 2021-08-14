/* eslint
    no-console:"off",
    complexity: "off",
*/
import * as p from "pareto"
import * as p20 from "pareto-20"
import * as astn from "../src"

import { describe } from "mocha"
import * as chai from "chai"
import { ownJSONTests } from "./data/ownJSONTestset"
import { extensionTests } from "./data/ASTNTestSet"
import { EventDefinition, TestRange, TestDefinition, TestLocation } from "./TestDefinition"

function assertUnreachable<RT>(_x: never): RT {
    throw new Error("unreachable")
}

const selectedOwnJSONTests = Object.keys(ownJSONTests)
const selectedExtensionTests = Object.keys(extensionTests)

// const selectedJSONTests: string[] = []
// const selectedExtensionTests: string[] = ["comment"]

function createTestFunction(chunks: string[], test: TestDefinition, _strictJSON: boolean) {
    return function () {

        const actualEvents: EventDefinition[] = []

        function getRange(mustCheck: boolean | undefined, range: astn.Range): TestRange | null {
            if (mustCheck) {
                const end = astn.getEndLocationFromRange(range)
                return [
                    range.start.line,
                    range.start.column,
                    end.line,
                    end.column,
                ]
            } else {
                return null
            }
        }
        function getLocation(mustTest: boolean | undefined, location: astn.Location): TestLocation | null {
            if (mustTest) {
                return [
                    location.line,
                    location.column,
                ]
            } else {
                return null
            }
        }

        function createLogger(): astn.TreeHandler<astn.TokenizerAnnotationData, null> {
            return astn.createLoggingHandler(
                (event, annotation) => {
                    switch (event[0]) {
                        case "close array": {
                            actualEvents.push(["token", "closearray", annotation.tokenString, getRange(test.testForLocation, annotation.range)])
                            break
                        }
                        case "close object": {
                            actualEvents.push(["token", "closeobject", annotation.tokenString, getRange(test.testForLocation, annotation.range)])
                            break
                        }
                        case "open array": {
                            actualEvents.push(["token", "openarray", annotation.tokenString, getRange(test.testForLocation, annotation.range)])
                            break
                        }
                        case "open object": {
                            actualEvents.push(["token", "openobject", annotation.tokenString, getRange(test.testForLocation, annotation.range)])
                            break
                        }
                        case "simple string": {
                            const data = event[1]
                            actualEvents.push(["token", "simple string", data.value, getRange(test.testForLocation, annotation.range)])
                            break
                        }
                        case "multiline string": {
                            const data = event[1]
                            actualEvents.push(["token", "multiline string", data.lines.join("\\n"), getRange(test.testForLocation, annotation.range)])
                            break
                        }
                        case "tagged union": {
                            actualEvents.push(["token", "opentaggedunion", getRange(test.testForLocation, annotation.range)])
                            break
                        }
                        default:
                            assertUnreachable(event[0])
                    }
                },
            )

        }
        const structureParser = astn.createStructureParser<astn.TokenizerAnnotationData>({
            onEmbeddedSchema: _schemaSchemaName => {
                actualEvents.push(["token", "schema data start"])
                return createLogger()
            },
            onSchemaReference: $$ => {
                actualEvents.push(["token", "schema data start"])
                actualEvents.push(["token", "simple string", $$.token.data.value, getRange(test.testForLocation, $$.token.annotation.range)])
                return p.value(false)
            },
            onBody: _annotation => {
                if (test.testHeaders) {
                    actualEvents.push(["instance data start"])
                }
                return createLogger()
            },
            errors: {
                onStructureError: $ => {
                    actualEvents.push(["parsingerror", astn.printStructureError($.error)])
                },
                onTreeError: $ => {
                    actualEvents.push(["parsingerror", astn.printTreeParserError($.error)])
                },
            },
            onEnd: _annotation => {
                actualEvents.push(["end", getLocation(test.testForLocation, astn.getEndLocationFromRange(_annotation.range))])
                return p.value(null)
            },
        })

        return p20.createArray(chunks).streamify().consume(
            null,
            astn.createStreamPreTokenizer(
                astn.createTokenizer(structureParser),
                $ => {
                    actualEvents.push(["parsingerror", astn.printTokenError($.error)])
                },
            ),
        ).convertToNativePromise().then(() => {
            //

            if (test.events !== undefined) {
                //console.log(JSON.stringify(actualEvents))
                // console.log(JSON.stringify(test.events))
                chai.assert.deepEqual(actualEvents, test.events)
            }
            //const expectedFormattedText = test.formattedText ? test.formattedText : test.text

            // if (!test.skipRoundTripCheck) {
            //     chai.assert.equal("roundtrip:\n" + out.join(""), "roundtrip:\n" + chunks.join("")
            //         .replace(/\r\n/g, "\n")
            //         .replace(/\n\r/g, "\n")
            //         .replace(/\r/g, "\n")
            //     )
            // }
            // chai.assert.equal(
            //     "formatted:\n" + formattedText
            //         .replace(/\r\n/g, "\n")
            //         .replace(/\n\r/g, "\n")
            //         .replace(/\r/g, "\n"),
            //     "formatted:\n" + expectedFormattedText
            // )
        })
    }
}

describe('astn', () => {
    describe('#strictJSON', () => {
        selectedOwnJSONTests.forEach(key => {
            const test = ownJSONTests[key]
            it('[' + key + '] should be able to parse -> one chunk', createTestFunction([test.text], test, true));
            it('[' + key + '] should be able to parse -> every character is a chunck', createTestFunction(test.text.split(''), test, true));
        })
    })
    describe('#extensions', () => {
        selectedExtensionTests.forEach(key => {
            const test = extensionTests[key]
            it('[' + key + '] should be able to parse -> one chunk', createTestFunction([test.text], test, false));
            it('[' + key + '] should be able to parse -> every character is a chunck', createTestFunction(test.text.split(''), test, false));
        })
    });

    describe('#pre-chunked', () => {
        selectedOwnJSONTests.forEach(key => {
            const test = ownJSONTests[key]
            if (!test.chunks) return;
            it('[' + key + '] should be able to parse pre-chunked', createTestFunction(test.chunks, test, true));
        })
    });
});
