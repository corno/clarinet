
export type Group = { [key: string]: Value }

export type Dictionary = { [key: string]: Value }

export type DSTaggedUnion = {
    option: null | string
    value: Value
}

export type Value = {
    type:
    | null
    | ["dictionary", Dictionary]
    | ["list", Value[]]
    | ["tagged union", DSTaggedUnion]
    | ["simple string", string]
    | ["multiline string", string[]]
    | ["group", Group]
}

export type Datastore = {
    root: Value
}