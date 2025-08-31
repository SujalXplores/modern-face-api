import type { TestEnv } from './Environment';

declare global {
  var nodeTestEnv: TestEnv;

  namespace NodeJS {
    interface Global {
      nodeTestEnv: TestEnv;
    }
  }

  interface Window {
    __karma__?: {
      config: {
        jasmine: {
          args: string[];
        };
      };
    };
  }
}
