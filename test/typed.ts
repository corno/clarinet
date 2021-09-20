import * as p from "pareto"
import { describe } from "mocha"
import * as chai from "chai"
import * as astn from "../src"
import { tryToConsumeString } from "./consumeString"

type ErrorLine = [string, string]

type ParserRequiredValueHandler = astn.RequiredValueHandler<astn.TokenizerAnnotationData, null>


describe('typed', () => {
    describe('#expect', () => {
        function doTest(
            testName: string,
            data: string,
            callback: (
                expect: astn.IExpectContext<astn.TokenizerAnnotationData, null>,
                addError: (errorLine: ErrorLine) => void
            ) => ParserRequiredValueHandler,
            expectedErrors: ErrorLine[]
        ) {

            it(testName, () => {
                const foundErrors: ErrorLine[] = []
                const structureParser = astn.createStructureParser<astn.TokenizerAnnotationData>({
                    onEmbeddedSchema: () => astn.createDummyTreeHandler(),
                    onSchemaReference: () => {
                        throw new Error("IMPLEMENT ME")
                    },
                    onBody: () => {
                        const expect = astn.createExpectContext<astn.TokenizerAnnotationData, null>(
                            ($) => {
                                if ($.severity === astn.DiagnosticSeverity.error) {
                                    foundErrors.push(["expect error", `${astn.printExpectError($.issue)} ${astn.printRange($.annotation.range)}`])
                                } else {
                                    foundErrors.push(["expect warning", `${astn.printExpectError($.issue)} ${astn.printRange($.annotation.range)}`])
                                }
                            },
                            () => astn.createDummyValueHandler(),
                            () => astn.createDummyValueHandler(),
                            astn.ExpectSeverity.warning,
                            astn.OnDuplicateEntry.ignore,
                        )
                        return {
                            onEnd: () => { },
                            root: callback(
                                expect,
                                (errorLine) => {
                                    foundErrors.push(errorLine)
                                }
                            ),
                        }
                    },
                    errors: {
                        onStructureError: ($) => {
                            foundErrors.push(["parser error", `${astn.printStructureError($.error)} @ ${astn.printRange($.annotation.range)}`])
                        },
                        onTreeError: ($) => {
                            foundErrors.push(["parser error", `${astn.printTreeParserError($.error)} @ ${astn.printRange($.annotation.range)}`])
                        },
                    },
                    onEnd: () => {
                        return p.value(null)
                    },
                })
                return tryToConsumeString(
                    data,
                    astn.createStreamPreTokenizer(
                        astn.createTokenizer(
                            structureParser,
                            (error, range) => {
                                foundErrors.push(["parser error", `${astn.printTokenizerError(error)} @ ${astn.printRange(range)}`])
                            },
                        ),
                        ($) => {
                            foundErrors.push(["parser error", `${astn.printTokenError($.error)} @ ${astn.printRange($.range)}`])
                        },
                    ),
                ).convertToNativePromise().then(() => {
                    chai.assert.deepEqual(foundErrors, expectedErrors)
                })
            })
        }

        doTest(
            'duplicate entry',
            `{ "a": (), "a": () }`,
            (expect) => {
                return {
                    exists: expect.expectDictionary({
                        onBegin: () => {
                            //
                        },
                        onProperty: () => {
                            return {
                                exists: expect.expectGroup({}),
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
            (expect) => astn.createRequiredValueHandler(
                expect,
                ["verbose group", {
                    properties: {
                        a: {
                            onExists: () => {
                                return astn.createRequiredValueHandler(
                                    expect,
                                    ["simple string", {
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
            'expected boolean, but it\'s just an unquoted string',

            `( "a": true )`,
            (expect, addError) => astn.createRequiredValueHandler(
                expect,
                [
                    "verbose group",
                    {
                        properties: {
                            a: {
                                onExists: () => {
                                    return astn.createRequiredValueHandler(
                                        expect,
                                        ["quoted string", {
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
            (expect, addError) => astn.createRequiredValueHandler(
                expect,
                [
                    "verbose group",
                    {
                        properties: {
                            a: {
                                onExists: () => {
                                    return astn.createRequiredValueHandler(
                                        expect,
                                        ["simple string", {
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
            (expect, _addError) => astn.createRequiredValueHandler(
                expect,
                [
                    "list",
                    {
                        onElement: () => {
                            return astn.createValueHandler(
                                expect,
                                ["simple string", {
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
            (expect) => {
                return {
                    missing: () => {
                        //
                    },
                    exists: expect.expectGroup({
                        properties: {
                            a: {
                                onExists: () => {
                                    return {
                                        exists: expect.expectTaggedUnion({
                                            options: {
                                                foo: () => {
                                                    return {
                                                        exists: expect.expectGroup({
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
                    exists: expect.expectGroup({
                        properties: {
                            a: {
                                onExists: () => {
                                    return {
                                        exists: expect.expectTaggedUnion({
                                            options: {
                                                foo: () => {
                                                    return {
                                                        exists: expect.expectGroup({}),
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
