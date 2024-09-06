export type Headers = { [key: string]: string };

export type UUID = string; // UUID strings - will be validated

export type SerializableDict = { [key: string]: any };
export type NullableSerializableDict = SerializableDict | null;

export type StringArray = ReadonlyArray<string>;
export type NullableStringArray = StringArray | null;
