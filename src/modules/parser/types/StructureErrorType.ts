
export type StructureErrorType =
| ["expected the schema start (!) or root value"]
| ["expected an embedded schema"]
| ["expected a schema reference or an embedded schema"]
| ["expected a schema schema reference"]
| ["expected the schema"]
| ["expected rootvalue"]
| ["unexpected data after end", {
}]
| ["unexpected '!'"]
