
import * as p from "pareto"
import {
    DictionaryHandler,
    GroupHandler,
    ListHandler,
    TypedTaggedUnionHandler,
    ITypedTreeHandler,
    TypedValueHandler,
} from "../../../apis/Ityped"

export function createDummyTypedHandler<TokenAnnotation, NonTokenAnnotation>(
): ITypedTreeHandler<TokenAnnotation, NonTokenAnnotation> {

    function createGroupNOPSideEffects(): GroupHandler<TokenAnnotation, NonTokenAnnotation> {
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

    function createTaggedUnionNOPSideEffects(): TypedTaggedUnionHandler<TokenAnnotation, NonTokenAnnotation> {
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

    function createValueNOPSideEffects(): TypedValueHandler<TokenAnnotation, NonTokenAnnotation> {

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


    function createDictionaryNOPSideEffects(): DictionaryHandler<TokenAnnotation, NonTokenAnnotation> {
        return {
            onClose: () => {
                //
            },
            onEntry: () => {
                return createValueNOPSideEffects()
            },
        }
    }

    function createListNOPSideEffects(): ListHandler<TokenAnnotation, NonTokenAnnotation> {
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