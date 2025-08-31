import { Gender } from '../ageGenderNet/types';
import { isValidProbablitiy } from '../utils';

export type WithGender<TSource> = TSource & {
  gender: Gender;
  genderProbability: number;
};

export function isWithGender(obj: unknown): obj is WithGender<object> {
  const typedObj = obj as { gender?: unknown; genderProbability?: unknown };
  return !!(
    obj &&
    typeof obj === 'object' &&
    (typedObj.gender === Gender.MALE || typedObj.gender === Gender.FEMALE) &&
    isValidProbablitiy(typedObj.genderProbability)
  );
}

export function extendWithGender<TSource>(
  sourceObj: TSource,
  gender: Gender,
  genderProbability: number
): WithGender<TSource> {
  const extension = { gender, genderProbability };
  return Object.assign({}, sourceObj, extension);
}
