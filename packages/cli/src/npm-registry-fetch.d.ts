/**
 * Type declaration for npm-registry-fetch
 */
declare module 'npm-registry-fetch' {
  import { FetchOptions } from 'npm-registry-fetch/lib/types'

  function npmFetch(url: string, opts?: FetchOptions): Promise<unknown>

  export = npmFetch
}

