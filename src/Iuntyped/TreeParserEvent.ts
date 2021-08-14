import {
    CloseArray,
    CloseObject,
    MultilineString,
    OpenArray,
    OpenObject,
    SimpleString,
    TaggedUnion,
} from "./ITreeParser"

export type TreeParserEvent =
    | ["close array", CloseArray]
    | ["close object", CloseObject]
    | ["open array", OpenArray]
    | ["open object", OpenObject]
    | ["simple string", SimpleString]
    | ["multiline string", MultilineString]
    | ["tagged union", TaggedUnion]
