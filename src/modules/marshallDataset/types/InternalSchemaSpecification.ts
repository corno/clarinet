
export type InternalSchemaSpecification =
| ["embedded"]
| ["reference", { name: string }]
| ["none"]