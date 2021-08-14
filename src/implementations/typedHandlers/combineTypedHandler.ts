import * as p20 from "pareto-20"
import * as p from "pareto"
import { TypedTreeHandler, TypedValueHandler } from "../../interfaces/typed"

export function combineTypedHandlers<TokenAnnotation, NonTokenAnnotation>(
    treeHandlers: TypedTreeHandler<TokenAnnotation, NonTokenAnnotation>[],
): TypedTreeHandler<TokenAnnotation, NonTokenAnnotation> {

    function combineTypedValueHandler(
        handlers: TypedValueHandler<TokenAnnotation, NonTokenAnnotation>[]
    ): TypedValueHandler<TokenAnnotation, NonTokenAnnotation> {
        return {
            onDictionary: $ => {
                const dictHandlers = handlers.map(h => h.onDictionary($))
                return {
                    onClose: $ => {
                        dictHandlers.forEach(dh => dh.onClose($))
                    },
                    onEntry: $ => {
                        return combineTypedValueHandler(dictHandlers.map(dh => dh.onEntry($)))
                    },
                }
            },
            onList: $ => {
                const listHandlers = handlers.map(h => h.onList($))
                return {
                    onClose: $ => {
                        listHandlers.forEach(dh => dh.onClose($))
                    },
                    onElement: $ => {
                        return combineTypedValueHandler(listHandlers.map(dh => dh.onElement($)))
                    },
                }
            },
            onTaggedUnion: $ => {
                const taggedUnionHandlers = handlers.map(h => h.onTaggedUnion($))
                return {
                    onUnexpectedOption: $ => {
                        return combineTypedValueHandler(taggedUnionHandlers.map(tuh => tuh.onUnexpectedOption($)))
                    },
                    onOption: $ => {
                        return combineTypedValueHandler(taggedUnionHandlers.map(tuh => tuh.onOption($)))
                    },
                    onEnd: $ => {
                        taggedUnionHandlers.forEach(tuh => tuh.onEnd($))
                    },
                }
            },
            onSimpleString: $ => {
                handlers.forEach(h => h.onSimpleString($))
            },
            onMultilineString: $ => {
                handlers.forEach(h => h.onMultilineString($))
            },
            onTypeReference: $ => {
                return combineTypedValueHandler(handlers.map(h => h.onTypeReference($)))
            },
            onGroup: $ => {
                const shorthandHandlers = handlers.map(h => h.onGroup($))
                return {
                    onUnexpectedProperty: $ => {
                        shorthandHandlers.forEach(vth => vth.onUnexpectedProperty($))
                    },
                    onProperty: $ => {
                        return combineTypedValueHandler(shorthandHandlers.map(shh => shh.onProperty($)))
                    },
                    onClose: $ => {
                        shorthandHandlers.forEach(shh => shh.onClose($))
                    },

                }
            },
        }

    }
    return {
        root: combineTypedValueHandler(treeHandlers.map(rh => rh.root)),
        onEnd: $ => {
            return p20.createArray(treeHandlers.map(rh => rh.onEnd($))).mergeSafeValues(() => p.value(null)).mapResult(() => p.value(null))
        },
    }
}