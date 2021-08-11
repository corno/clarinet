
import * as astncore from "../.."
import * as p from "pareto"

export function createDummyTypedHandler<TokenAnnotation, NonTokenAnnotation>(
): astncore.TypedTreeHandler<TokenAnnotation, NonTokenAnnotation> {

    function createGroupNOPSideEffects(): astncore.GroupHandler<TokenAnnotation, NonTokenAnnotation> {
        return {
            onUnexpectedProperty: () => {
                //
            },
            onProperty: () => {
                return createValueNOPSideEffects()
            },
            // onUnexpectedProperty: () => {
            //     //
            // }
            onClose: () => {
                //
            },
        }
    }

    function createTaggedUnionNOPSideEffects(): astncore.TypedTaggedUnionHandler<TokenAnnotation, NonTokenAnnotation> {
        return {
            onUnexpectedOption: () => {
                return createValueNOPSideEffects()
            },
            onOption: () => {
                return createValueNOPSideEffects()
            },
            onEnd: () => {
                //
            },
        }
    }

    function createValueNOPSideEffects(): astncore.TypedValueHandler<TokenAnnotation, NonTokenAnnotation> {

        return {
            onDictionary: () => {
                return createDictionaryNOPSideEffects()
            },
            onList: () => {
                return createListNOPSideEffects()
            },
            onTaggedUnion: () => {
                return createTaggedUnionNOPSideEffects()
            },
            onSimpleString: () => {
                //
            },
            onMultilineString: () => {
                //
            },
            onTypeReference: () => {
                return createValueNOPSideEffects()
            },
            onGroup: () => {
                return createGroupNOPSideEffects()
            },
        }
    }


    function createDictionaryNOPSideEffects(): astncore.DictionaryHandler<TokenAnnotation, NonTokenAnnotation> {
        return {
            onClose: () => {
                //
            },
            onEntry: () => {
                return createValueNOPSideEffects()
            },
        }
    }

    function createListNOPSideEffects(): astncore.ListHandler<TokenAnnotation, NonTokenAnnotation> {
        return {
            onClose: () => {
                //
            },
            onElement: () => {
                return createValueNOPSideEffects()
            },
        }
    }
    return {
        root: createValueNOPSideEffects(),
        onEnd: () => {
            return p.value(null)
        },
    }
}