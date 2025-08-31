export type WithAge<TSource> = TSource & {
  age: number;
};

export function isWithAge(obj: unknown): obj is WithAge<object> {
  return !!(obj && typeof obj === 'object' && typeof (obj as { age?: unknown }).age === 'number');
}

export function extendWithAge<TSource>(sourceObj: TSource, age: number): WithAge<TSource> {
  const extension = { age };
  return Object.assign({}, sourceObj, extension);
}
