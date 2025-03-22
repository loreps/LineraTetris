/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL: string
  readonly VITE_SUPABASE_ANON_KEY: string
  readonly VITE_LINERA_CONTRACT_ID: string
  readonly VITE_LINERA_PRIVATE_KEY: string
  readonly VITE_LINERA_NETWORK_URL: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
