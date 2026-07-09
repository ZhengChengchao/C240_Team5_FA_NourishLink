/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_N8N_ADD_SURPLUS_WEBHOOK?: string;
  readonly VITE_GOOGLE_MAPS_API_KEY?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
