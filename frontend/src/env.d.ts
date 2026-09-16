// Environment variables injected at build time by @ngx-env/builder from .env.
// Only variables prefixed NG_APP_ are exposed — see angular.json / .env.
declare interface Env {
    readonly NG_APP_ENV: string;
    readonly NG_APP_API_BASE_URL: string;
    readonly NG_APP_API_PREFIX: string;
    readonly NG_APP_API_VERSION: string;
}

declare interface ImportMeta {
    readonly env: Env;
}
