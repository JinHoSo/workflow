/**
 * Type declaration for npm-registry-fetch
 */
declare module 'npm-registry-fetch' {
  import { FetchOptions } from 'npm-registry-fetch/lib/types'

  interface NpmFetch {
    (url: string, opts?: FetchOptions): Promise<unknown>
    json(url: string, opts?: FetchOptions): Promise<unknown>
  }

  const npmFetch: NpmFetch
  export = npmFetch
}

