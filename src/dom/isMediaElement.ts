import { env } from '../env';

export function isMediaElement(input: unknown) {
  const { Image, Canvas, Video } = env.getEnv();

  return input instanceof Image || input instanceof Canvas || input instanceof Video;
}
