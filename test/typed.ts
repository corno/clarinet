/* eslint
    no-console:"off",
    complexity: "off",
*/
import * as p from "pareto"
import { describe } from "mocha"
import * as chai from "chai"
import * as core from "../src/core"
import * as astn from "../src"
import { tryToConsumeString } from "./consumeString"
import { createErrorStreamHandler, printRange, TokenizerAnnotationData } from "../src"
import { createDummyTreeHandler } from "../src/core"

//const selectedJSONTests: string[] = ["two keys"]
//const selectedExtensionTests: string[] = []

type ErrorLine = [string, string]

type ParserRequiredValueHandler = core.RequiredValueHandler<TokenizerAnnotationData, null>


describe('typed', () => {
    describe('#expect', () => {
        function doTest(
            testName: string,
            data: string,
            callback: (
                expect: core.IExpectContext<astn.TokenizerAnnotationData, null>,
                addError: (errorLine: ErrorLine) => void
            ) => ParserRequiredValueHandler,
            expectedErrors: ErrorLine[]
        ) {

            it(testName, () => {
                const foundErrors: ErrorLine[] = []
                const onWarning = ($: {
                    issue: core.ExpectError
                    annotation: astn.TokenizerAnnotationData
                }) => {
                    foundErrors.push(["expect warning", `${core.printExpectError($.issue)} ${printRange($.annotation.range)}`])
                }
                const streamTokenizer = astn.createParserStack({
                    onEmbeddedSchema: () => createDummyTreeHandler(),
                    onSchemaReference: () => {
                        throw new Error("IMPLEMENT ME")
                    },
                    onBody: () => {

                        const expect = core.createExpectContext<astn.TokenizerAnnotationData, null>(
                            $ => {
                                foundErrors.push(["expect error", `${core.printExpectError($.issue)} ${printRange($.annotation.range)}`])
                            },
                            onWarning,
                            () => core.createDummyValueHandler(),
                            () => core.createDummyValueHandler(),
                            core.Severity.warning,
                            core.OnDuplicateEntry.ignore,
                            $ => core.serializeSimpleString($.data),
                        )
                        return {
                            root: callback(
                                expect,
                                errorLine => {
                                    foundErrors.push(errorLine)
                                }
                            ),
                        }
                    },
                    errorStreams: createErrorStreamHandler(true, str => foundErrors.push(["parser error", str])),
                    onEnd: () => {
                        return p.value(null)
                    },
                })
                return tryToConsumeString(
                    data,
                    streamTokenizer,
                ).convertToNativePromise().then(() => {
                    chai.assert.deepEqual(foundErrors, expectedErrors)
                })
            })
        }

        doTest(
            'duplicate entry',
            `{ "a": (), "a": () }`,
            expect => {
                return {
                    exists: expect.expectDictionary({
                        onBegin: () => {
                            //
                        },
                        onProperty: () => {
                            return {
                                exists: expect.expectType({}),
                                missing: () => {
                                    //
                                },
                            }
                        },
                        onEnd: () => {
                            //
                        },
                    }),
                    missing: () => {
                        //
                    },
                }
            },
            [
                ["expect warning", "duplicate entry: 'a' 1:12-15"],
            ]
        )
        doTest(
            'duplicate property',
            `( "a": 42, "a": 42 )`,
            expect => core.createRequiredValueHandler(
                expect,
                ["verbose group", {
                    properties: {
                        a: {
                            onExists: () => {
                                return core.createRequiredValueHandler(
                                    expect,
                                    ["number", {
                                        callback: () => {
                                        },
                                    }]
                                )
                            },
                            onNotExists: null,
                        },
                    },
                }]
            ),
            [
                ["expect warning", "duplicate property: 'a' 1:12-15"],
            ]
        )
        doTest(
            'unexpected boolean',

            `( "a": true )`,
            (expect, addError) => core.createRequiredValueHandler(
                expect,
                [
                    "verbose group",
                    {
                        properties: {
                            a: {
                                onExists: () => {
                                    return core.createRequiredValueHandler(
                                        expect,
                                        ["number", {
                                            callback: () => {
                                            },
                                            onInvalidType: () => {
                                                //addError(["stacked error", err.rangeLessMessage, $.start.line, $.start.column, $.end.line, $.end.column])
                                                addError(["invalid type", "TBD 0:0-0"])
                                            },
                                        }]
                                    )
                                },
                                onNotExists: null,
                            },
                        },
                    },
                ]
            ),
            [
                ["invalid type", "TBD 0:0-0"],
            ]
        )

        doTest(
            'unexpected empty type',
            `( )`,
            (expect, addError) => core.createRequiredValueHandler(
                expect,
                [
                    "verbose group",
                    {
                        properties: {
                            a: {
                                onExists: () => {
                                    return core.createRequiredValueHandler(
                                        expect,
                                        ["number", {
                                            callback: () => {
                                            },
                                            onInvalidType: () => {
                                                //addError(["stacked error", err.rangeLessMessage, $.start.line, $.start.column, $.end.line, $.end.column])
                                                addError(["invalid type", "TBD 0:0-0"])
                                            },
                                        }]
                                    )
                                },
                                onNotExists: null,
                            },
                        },
                    },
                ]
            ),
            [
                ["expect error", "missing property: 'a' 1:1-2"],
            ]
        )
        doTest(
            'unexpected object',
            `{ }`,
            (expect, _addError) => core.createRequiredValueHandler(
                expect,
                [
                    "list",
                    {
                        onElement: () => {
                            return core.createValueHandler(
                                expect,
                                ["number", {
                                    callback: () => {
                                    },
                                }],
                            )
                        },
                    },
                ]
            ),
            [
                ["expect error", "expected a list ( [] ) but found an object ( {} or () ) 1:1-2"],
            ]
        )

        doTest(
            'tagged union',
            `( "a": | "foo" () )`,
            expect => {
                return {
                    missing: () => {
                        //
                    },
                    exists: expect.expectType({
                        properties: {
                            a: {
                                onExists: () => {
                                    return {
                                        exists: expect.expectTaggedUnion({
                                            options: {
                                                foo: () => {
                                                    return {
                                                        exists: expect.expectType({
                                                            properties: {
                                                                //
                                                            },
                                                        }),
                                                        missing: () => {
                                                            //
                                                        },
                                                    }
                                                },
                                            },
                                        }),
                                        missing: () => {
                                            //
                                        },
                                    }
                                },
                                onNotExists: null,
                            },
                        },
                    }),
                }
            },
            []
        )
        doTest(
            'invalid tagged union',
            `( "a": | "foo" )`,
            (expect, addError) => {
                return {
                    missing: () => {
                        //
                    },
                    exists: expect.expectType({
                        properties: {
                            a: {
                                onExists: () => {
                                    return {
                                        exists: expect.expectTaggedUnion({
                                            options: {
                                                foo: () => {
                                                    return {
                                                        exists: expect.expectType({}),
                                                        missing: () => {
                                                            addError(["missing", "TBD 0:0-0"])
                                                        },
                                                    }
                                                },
                                            },
                                        }),
                                        missing: () => {
                                            //
                                        },
                                    }
                                },
                                onNotExists: () => {
                                    //
                                },
                            },
                        },
                    }),
                }
            },
            [
                ["missing", "TBD 0:0-0"],
                ["parser error", "missing tagged union value @ 1:16-17"],
            ]
        )
    })
})
