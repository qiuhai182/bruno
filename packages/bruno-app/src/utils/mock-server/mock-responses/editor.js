import { cloneDeep } from 'lodash';
import { findCollectionByUid, findItemInCollection } from 'utils/collections';
import { extractMockResponseRoutePath } from 'utils/mock-server/mock-responses';

export const MOCK_RESPONSE_ITEM_UID_PREFIX = 'mock-response-item-';

export const getMockResponseItemUid = (responseUid) => `${MOCK_RESPONSE_ITEM_UID_PREFIX}${responseUid}`;

export const getMockResponseUidFromItemUid = (itemUid) => {
  if (!itemUid?.startsWith(MOCK_RESPONSE_ITEM_UID_PREFIX)) {
    return null;
  }

  return itemUid.slice(MOCK_RESPONSE_ITEM_UID_PREFIX.length);
};

export const isMockResponseEditorItemUid = (itemUid) => Boolean(getMockResponseUidFromItemUid(itemUid));

const asString = (value) => (value === null || value === undefined ? '' : String(value));

export const buildMockResponseBehavior = (mockResponse) => ({
  delay: asString(mockResponse?.delay),
  probability: asString(mockResponse?.probability),
  counterEvery: asString(mockResponse?.counter?.every),
  counterOffset: asString(mockResponse?.counter?.offset),
  template: mockResponse?.template === true,
  extract: cloneDeep(mockResponse?.extract || [])
});

export const buildMockResponseFromBehavior = (behavior) => {
  const result = {};

  const delay = Number(behavior?.delay);
  if (delay > 0) {
    result.delay = delay;
  }

  const probability = Number(behavior?.probability);
  if (probability > 0 && probability <= 100) {
    result.probability = probability;
  }

  const every = Number(behavior?.counterEvery);
  if (every >= 1) {
    result.counter = {
      every,
      offset: Number(behavior?.counterOffset) || 0
    };
  }

  if (behavior?.template === true) {
    result.template = true;
  }

  const extract = (behavior?.extract || [])
    .filter((rule) => rule?.as || rule?.key)
    .map((rule) => ({
      source: rule.source || 'query',
      key: rule.key || '',
      as: rule.as || rule.key || ''
    }));

  if (extract.length) {
    result.extract = extract;
  }

  return result;
};

export const buildMockResponseEditorItem = (mockResponse) => {
  const responseUid = mockResponse.uid;
  const itemUid = getMockResponseItemUid(responseUid);
  const requestBody = cloneDeep(mockResponse.request?.body || {});

  if (!requestBody.mode) {
    requestBody.mode = 'none';
  }

  const example = {
    uid: responseUid,
    itemUid,
    name: mockResponse.name || '',
    description: mockResponse.description || '',
    type: 'http-request',
    request: {
      url: extractMockResponseRoutePath(mockResponse.request?.url || '/', { preserveTemplateVars: true }),
      method: (mockResponse.request?.method || 'GET').toUpperCase(),
      headers: cloneDeep(mockResponse.request?.headers || []),
      params: cloneDeep(mockResponse.request?.params || []),
      body: requestBody
    },
    response: {
      status: Number(mockResponse.response?.status) || 200,
      statusText: mockResponse.response?.statusText || '',
      headers: cloneDeep(mockResponse.response?.headers || []),
      body: cloneDeep(mockResponse.response?.body || { type: 'json', content: '' })
    },
    behavior: buildMockResponseBehavior(mockResponse)
  };

  const request = cloneDeep(example.request);

  return {
    uid: itemUid,
    name: 'Mock Response',
    type: 'http-request',
    request,
    examples: [],
    draft: {
      type: 'http-request',
      request,
      examples: [example]
    }
  };
};

const stripConditionUids = (rules) => {
  const cloned = cloneDeep(rules || { operator: 'AND', conditions: [] });

  if (Array.isArray(cloned.conditions)) {
    cloned.conditions = cloned.conditions.map(({ uid, ...condition }) => condition);
  }

  return cloned;
};

export const mockResponseFromEditorItem = (item, responseUid, rules, savedMockResponse = {}) => {
  const examples = item.draft?.examples || item.examples || [];
  const example = examples.find((entry) => entry.uid === responseUid);

  if (!example) {
    throw new Error('Mock response draft not found');
  }

  return {
    uid: responseUid,
    name: example.name || '',
    description: example.description || '',
    request: {
      ...cloneDeep(example.request),
      url: extractMockResponseRoutePath(example.request?.url, { preserveTemplateVars: true })
    },
    response: cloneDeep(example.response),
    ...buildMockResponseFromBehavior(example.behavior),
    rules: stripConditionUids(rules),
    ...(savedMockResponse.copiedFrom ? { copiedFrom: cloneDeep(savedMockResponse.copiedFrom) } : {})
  };
};

export const findItemForExampleEditor = (state, collectionUid, itemUid) => {
  const responseUid = getMockResponseUidFromItemUid(itemUid);

  if (responseUid) {
    return state.mockResponseEditors?.[responseUid]?.item || null;
  }

  const collection = findCollectionByUid(state.collections, collectionUid);

  if (!collection) {
    return null;
  }

  return findItemInCollection(collection, itemUid);
};
