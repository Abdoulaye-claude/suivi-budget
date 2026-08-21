import { describe, expect, it } from 'vitest';
import { mergeById } from './cloudSync';

interface Item {
  id: string;
  value: string;
}

describe('mergeById', () => {
  it('returns an empty array when both local and remote are empty', () => {
    expect(mergeById<Item>([], [])).toEqual([]);
  });

  it('returns all local items unchanged when remote is empty (cloud-empty case)', () => {
    const local: Item[] = [{ id: '1', value: 'a' }, { id: '2', value: 'b' }];
    expect(mergeById(local, [])).toEqual(local);
  });

  it('returns all remote items when local is empty', () => {
    const remote: Item[] = [{ id: '1', value: 'a' }];
    expect(mergeById([], remote)).toEqual(remote);
  });

  it('remote wins on id conflict', () => {
    const local: Item[] = [{ id: '1', value: 'local-version' }];
    const remote: Item[] = [{ id: '1', value: 'remote-version' }];
    expect(mergeById(local, remote)).toEqual([{ id: '1', value: 'remote-version' }]);
  });

  it('appends local-only ids after all remote items', () => {
    const local: Item[] = [
      { id: '1', value: 'local-version' },
      { id: '2', value: 'local-only' },
    ];
    const remote: Item[] = [{ id: '1', value: 'remote-version' }];
    expect(mergeById(local, remote)).toEqual([
      { id: '1', value: 'remote-version' },
      { id: '2', value: 'local-only' },
    ]);
  });
});
