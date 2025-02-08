import { Query } from './query'
import { hashKey } from './util'

export class QueryCache {
  queries

  constructor() {
    /**
     * - key: queryHash (created by queryKey)
     * - value: Query object
     */
    this.queries = new Map()
  }

  get = (queryHash) => {
    return this.queries.get(queryHash)
  }

  build(client, options) {
    const queryKey = options.queryKey
    const queryHash = hashKey(queryKey)

    let query = this.get(queryHash)

    if (!query) {
      query = new Query({
        cache: this,
        queryKey,
        queryHash,
        options: client.defaultQueryOptions(options),
      })

      this.queries.set(query.queryHash, query)
    }

    return query
  }

  remove = (query) => {
    this.queries.delete(query.queryHash)
  }
}
