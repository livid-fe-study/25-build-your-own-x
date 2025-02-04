class QueryClient {
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
            ...options
        };

        const defaultedQueryOptions = {
            ...mergedQueryOptions,
            queryHash: mergedQueryOptions.queryHash || hashKey(mergedQueryOptions.queryKey)
        };

        return defaultedQueryOptions;
    };
}

class QueryCache {
    queries;

    constructor() {
        /**
         * - key: queryHash (queryKey 값을 기반으로 생성됩니다.)
         * - value: Query object
         */
        this.queries = new Map();
    }

    get = (queryHash) => {
        return this.queries.get(queryHash);
    };

    build(client, options) {
        const queryKey = options.queryKey;
        const queryHash = hashKey(queryKey);

        let query = this.get(queryHash);

        if (!query) {
            query = new Query({
                cache: this,
                queryKey,
                queryHash,
                options: client.defaultQueryOptions(options)
            });

            this.queries.set(query.queryHash, query);
        }

        return query;
    }

    remove = (query) => {
        this.queries.delete(query.queryHash);
    };
}

class Query {
    cache;
    queryKey;
    queryHash;
    options;
    observers;
    state;
    promise;
    gcTimeout;

    constructor(config) {
        this.observers = [];
        this.cache = config.cache;
        this.queryHash = config.queryHash;
        this.queryKey = config.queryKey;
        this.options = {
            ...config.defaultOptions,
            ...config.options
        };
        this.state = {
            data: undefined,
            error: undefined,
            status: "pending",
            isFetching: true,
            lastUpdated: undefined
        };

        // Query 객체 생성 시점에 QueryCache에게 gc를 요청합니다.
        this.scheduleGcTimeout();
    }

    scheduleGcTimeout = () => {
        const { gcTime } = this.options;

        this.gcTimeout = setTimeout(() => {
            this.cache.remove(this);
        }, gcTime);
    };

    clearGcTimeout = () => {
        clearTimeout(this.gcTimeout);
        this.gcTimeout = null;
    };

    subscribe = (observer) => {
        this.observers.push(observer);

        // 구독이 발생할 때 gc 요청을 해제합니다.
        this.clearGcTimeout();

        const unsubscribe = () => {
            this.observers = this.observers.filter(() => {
                return d !== observer;
            });

            // 구독이 해제되는 시점에 구독 리스트의 길이가 0 이라면, QueryCache에게 gc를 다시 요청합니다.
            if (!this.observers.length) {
                this.scheduleGcTimeout();
            }
        };

        return unsubscribe;
    };

    setState = (updater) => {
        this.state = updater(this.state);

        this.observers.forEach((observer) => {
            // 상태가 변경될 때, 구독자들에게 상태 변경 이벤트를 발행합니다.
            observer.notify();
        });
    };

    fetch = () => {
        // promise 객체를 멤버 변수로 활용하여, 불필요한 요청을 방지합니다.
        if (!this.promise) {
            this.promise = (async () => {
                this.setState((old) => ({ ...old, isFetching: true, error: undefined }));

                try {
                    if (!this.options.queryFn) {
                        throw new Error(`Missing queryFn: '${this.options.queryHash}'`);
                    }

                    const data = await this.options.queryFn();

                    this.setState((old) => ({ ...old, status: "success", data, lastUpdated: Date.now() }));
                } catch (error) {
                    this.setState((old) => ({ ...old, status: "error", error }));
                } finally {
                    this.setState((old) => ({ ...old, isFetching: false }));

                    this.promise = null;
                }
            })();
        }

        return this.promise;
    };
}

class QueryObserver {
    client;
    options;
    notify;

    constructor(client, options) {
        this.client = client;
        this.options = options;
    }

    getQuery = () => {
        // options의 queryKey 값을 기반으로 구독되어 있는 Query를 조회합니다.
        const query = this.client.getQueryCache().build(this.client, this.options);

        return query;
    };

    getResult = () => {
        // Query 객체에서 관리하고 있는 서버 상태를 조회합니다.
        return this.getQuery().state;
    };

    subscribe = (callback) => {
        // Query 객체의 서버 상태가 변경될 때 호출이 필요한 callback 함수를 notify 멤버 변수로 저장합니다.
        this.notify = callback;

        const query = this.getQuery();

        const { lastUpdated } = query.state;
        const { staleTime } = this.options;

        const needsToFetch = !lastUpdated || Date.now() - lastUpdated > staleTime;

        const unsubscribeQuery = query.subscribe(this);

        if (needsToFetch) {
            query.fetch();
        }

        const unsubscribe = () => {
            unsubscribeQuery();
        };

        return unsubscribe;
    };
}