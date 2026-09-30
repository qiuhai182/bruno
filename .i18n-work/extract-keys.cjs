const fs = require('fs');
const base = 'packages/bruno-app/src/components/RequestPane/';
const files = [
  'HttpRequestPane/index.js',
  'QueryUrl/index.js',
  'QueryUrl/HttpMethodSelector/index.js',
  'QueryParams/index.js',
  'QueryEditor/index.js',
  'QueryBuilder/index.js',
  'QueryBuilder/FieldNode.js',
  'QueryBuilder/ErrorBoundary.js',
  'RequestBody/index.js',
  'RequestBody/RequestBodyMode/index.js',
  'RequestHeaders/index.js',
  'FormUrlEncodedParams/index.js',
  'MultipartFormParams/index.js',
  'FileBody/index.js',
  'SendButton/index.js',
  'Settings/index.js',
  'Vars/index.js',
  'Vars/VarsTable/index.js',
  'Script/index.js',
  'PromptVariables/PromptVariablesModal/index.js',
  'GraphQLSchemaActions/index.js',
  'GraphQLSchemaActions/useGraphqlSchema.js',
  'Auth/index.js',
  'Auth/AuthMode/index.js',
  'Auth/WsseAuth/index.js',
  'Auth/BasicAuth/index.js',
  'Auth/BearerAuth/index.js',
  'Auth/DigestAuth/index.js',
  'Auth/NTLMAuth/index.js',
  'Auth/ApiKeyAuth/index.js',
  'Auth/AwsV4Auth/index.js',
  'Auth/OAuth1/index.js',
  'Auth/EdgeGridAuth/index.tsx',
  'Auth/OAuth2/index.js',
  'Auth/OAuth2/GrantTypeSelector/index.js',
  'Auth/OAuth2/PasswordCredentials/index.js',
  'Auth/OAuth2/PasswordCredentials/inputsConfig.js',
  'Auth/OAuth2/ClientCredentials/index.js',
  'Auth/OAuth2/ClientCredentials/inputsConfig.js',
  'Auth/OAuth2/AuthorizationCode/index.js',
  'Auth/OAuth2/AuthorizationCode/inputsConfig.js',
  'Auth/OAuth2/Implicit/index.js',
  'Auth/OAuth2/Implicit/inputsConfig.js',
  'Auth/OAuth2/Oauth2TokenViewer/index.js',
  'Auth/OAuth2/Oauth2ActionButtons/index.js',
  'Auth/OAuth2/AdditionalParams/index.js'
];
const set = new Set();
for (const f of files) {
  const s = fs.readFileSync(base + f, 'utf8');
  for (const m of s.matchAll(/requestPane\.[a-zA-Z0-9_]+(?:\.[a-zA-Z0-9_]+)+/g)) {
    set.add(m[0]);
  }
}
// dynamic tab keys
for (const k of ['params', 'body', 'headers', 'auth', 'vars', 'script', 'assert', 'tests', 'docs', 'app', 'settings']) {
  set.add('requestPane.tabs.' + k);
}
const sorted = [...set].sort().sort((a, b) => a.split('.').length - b.split('.').length || a.localeCompare(b));
for (const k of sorted) {
  console.log(k);
}
console.error('TOTAL:', set.size);
