import * as i from "../interfaces/ITreeHandler"

export function createDummyRequiredValueHandler<TokenAnnotation, NonTokenAnnotation>(
): i.IRequiredValueHandler<TokenAnnotation, NonTokenAnnotation> {
    return {
        exists: createDummyValueHandler(),
        missing: () => {
            //
        },
    }
}

export function createDummyValueHandler<TokenAnnotation, NonTokenAnnotation>(
): i.IValueHandler<TokenAnnotation, NonTokenAnnotation> {
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
): i.ITaggedUnionHandler<TokenAnnotation, NonTokenAnnotation> {
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
): i.IArrayHandler<TokenAnnotation, NonTokenAnnotation> {
    return {
        element: () => createDummyValueHandler(),
        arrayEnd: () => {
        },
    }
}

export function createDummyObjectHandler<TokenAnnotation, NonTokenAnnotation>(
): i.IObjectHandler<TokenAnnotation, NonTokenAnnotation> {
    return {
        property: () => {
            return createDummyRequiredValueHandler()
        },
        objectEnd: () => {
        },
    }
}

export function createDummyTreeHandler<TokenAnnotation, NonTokenAnnotation>(
): i.ITreeHandler<TokenAnnotation, NonTokenAnnotation> {
    return {
        root: createDummyRequiredValueHandler(),
        onEnd: () => {},
    }
}
