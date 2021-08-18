
export type ExternalSchemaResolvingError =
| ["errors in external schema"]
| ["loading", {
    message: string
}]

export type ContextSchemaError =
| ["validating schema file against internal schema"]
| ["external schema resolving", ExternalSchemaResolvingError]