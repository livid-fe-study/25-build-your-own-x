import { QueryCache } from "./QueryCache";

export class QueryClient {
  cache;

  constructor(config) {
    this.cache = config.cache || new QueryCache();
    this.defaultOptions = config.defaultOptions;
  }

  getQueryCache = () => {
    return this.cache;
  };

  defaultQueryOptions = (options) => {
    const mergedQueryOptions = {
      ...this.defaultOptions?.queries,
      ...options,
    };

    const defaultedQueryOptions = {
      ...mergedQueryOptions,
      queryHash:
        mergedQueryOptions.queryHash || hashKey(mergedQueryOptions.queryKey),
    };

    return defaultedQueryOptions;
  };
}
