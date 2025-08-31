import { fetchJson } from '../../../src';

describe('fetchJson', () => {
  it('fetches json', async () => {
    const url = 'base/test/data/boxes.json';
    const data = await fetchJson(url);
    expect(data).toBeDefined();
  });
});
