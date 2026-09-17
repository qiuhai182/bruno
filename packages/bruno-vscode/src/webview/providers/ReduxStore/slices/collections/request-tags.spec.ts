import { describe, test, expect, vi } from 'vitest';

// Mock vscode
vi.mock('vscode', () => ({}));

// Import the slice after mocking
const { default: collectionsReducer, addRequestTag, deleteRequestTag } = await import('./index');

// Helper to create a minimal collection state matching CollectionsState
function makeState(item: any): any {
  return {
    collections: [{
      uid: 'col-1',
      name: 'Test',
      pathname: '/test',
      items: [item],
      environments: [],
      brunoConfig: {}
    }],
    collectionSortOrder: 'default',
    activeConnections: {}
  };
}

describe('addRequestTag', () => {
  test('creates draft and adds tag only to draft.tags (not item.tags)', () => {
    const item = { uid: 'req-1', name: 'Test', type: 'http-request', tags: [], request: { url: '' } };
    const state = makeState(item);

    const result = collectionsReducer(state, addRequestTag({
      collectionUid: 'col-1',
      itemUid: 'req-1',
      tag: 'smoke'
    }));

    const updatedItem = result.collections[0].items[0];
    // item.tags stays unchanged (saved state)
    expect(updatedItem.tags).toEqual([]);
    // draft is created with the new tag
    expect(updatedItem.draft).toBeDefined();
    expect(updatedItem.draft.tags).toContain('smoke');
  });

  test('adds tag to existing draft.tags', () => {
    const item = {
      uid: 'req-1',
      name: 'Test',
      type: 'http-request',
      tags: ['existing'],
      request: { url: '' },
      draft: {
        uid: 'req-1',
        name: 'Test',
        type: 'http-request',
        tags: ['existing'],
        request: { url: 'http://edited.com' }
      }
    };
    const state = makeState(item);

    const result = collectionsReducer(state, addRequestTag({
      collectionUid: 'col-1',
      itemUid: 'req-1',
      tag: 'regression'
    }));

    const updatedItem = result.collections[0].items[0];
    // item.tags unchanged
    expect(updatedItem.tags).toEqual(['existing']);
    // draft.tags updated
    expect(updatedItem.draft.tags).toContain('existing');
    expect(updatedItem.draft.tags).toContain('regression');
  });

  test('does not add duplicate tags to draft', () => {
    const item = {
      uid: 'req-1',
      name: 'Test',
      type: 'http-request',
      tags: ['smoke'],
      request: { url: '' },
      draft: { uid: 'req-1', tags: ['smoke'], request: { url: '' } }
    };
    const state = makeState(item);

    const result = collectionsReducer(state, addRequestTag({
      collectionUid: 'col-1',
      itemUid: 'req-1',
      tag: 'smoke'
    }));

    const updatedItem = result.collections[0].items[0];
    expect(updatedItem.draft.tags).toEqual(['smoke']);
  });
});

describe('deleteRequestTag', () => {
  test('creates draft and removes tag only from draft.tags', () => {
    const item = { uid: 'req-1', name: 'Test', type: 'http-request', tags: ['smoke', 'api'], request: { url: '' } };
    const state = makeState(item);

    const result = collectionsReducer(state, deleteRequestTag({
      collectionUid: 'col-1',
      itemUid: 'req-1',
      tag: 'smoke'
    }));

    const updatedItem = result.collections[0].items[0];
    // item.tags stays unchanged (saved state)
    expect(updatedItem.tags).toEqual(['smoke', 'api']);
    // draft is created with the tag removed
    expect(updatedItem.draft).toBeDefined();
    expect(updatedItem.draft.tags).toEqual(['api']);
  });

  test('removes tag from existing draft.tags', () => {
    const item = {
      uid: 'req-1',
      name: 'Test',
      type: 'http-request',
      tags: ['smoke', 'api'],
      request: { url: '' },
      draft: { uid: 'req-1', tags: ['smoke', 'api'], request: { url: 'http://edited.com' } }
    };
    const state = makeState(item);

    const result = collectionsReducer(state, deleteRequestTag({
      collectionUid: 'col-1',
      itemUid: 'req-1',
      tag: 'smoke'
    }));

    const updatedItem = result.collections[0].items[0];
    // item.tags unchanged
    expect(updatedItem.tags).toEqual(['smoke', 'api']);
    // draft.tags updated
    expect(updatedItem.draft.tags).toEqual(['api']);
  });
});
