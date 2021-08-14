import * as i from "../Iuntyped"

export function createDummyRequiredValueHandler<TokenAnnotation, NonTokenAnnotation>(
): i.RequiredValueHandler<TokenAnnotation, NonTokenAnnotation> {
    return {
        exists: createDummyValueHandler(),
        missing: () => {
            //
        },
    }
}

export function createDummyValueHandler<TokenAnnotation, NonTokenAnnotation>(
): i.ValueHandler<TokenAnnotation, NonTokenAnnotation> {
    return {
        array: () => createDummyArrayHandler(),
        object: () => createDummyObjectHandler(),
        simpleString: () => {
        },
        multilineString: () => {
        },
        taggedUnion: () => createDummyTaggedUnionHandler(),
    }
}

export function createDummyTaggedUnionHandler<TokenAnnotation, NonTokenAnnotation>(
): i.TaggedUnionHandler<TokenAnnotation, NonTokenAnnotation> {
    return {
        option: () => createDummyRequiredValueHandler(),
        missingOption: () => {
            //
        },
        end: () => {
        },
    }
}

export function createDummyArrayHandler<TokenAnnotation, NonTokenAnnotation>(
): i.ArrayHandler<TokenAnnotation, NonTokenAnnotation> {
    return {
        element: () => createDummyValueHandler(),
        arrayEnd: () => {
        },
    }
}

export function createDummyObjectHandler<TokenAnnotation, NonTokenAnnotation>(
): i.ObjectHandler<TokenAnnotation, NonTokenAnnotation> {
    return {
        property: () => {
            return createDummyRequiredValueHandler()
        },
        objectEnd: () => {
        },
    }
}

export function createDummyTreeHandler<TokenAnnotation, NonTokenAnnotation>(
): i.TreeHandler<TokenAnnotation, NonTokenAnnotation> {
    return {
        root: createDummyRequiredValueHandler(),
        onEnd: () => {},
    }
}
