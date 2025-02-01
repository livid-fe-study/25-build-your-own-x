const noop = () => {};

class QueryObserver {
  client;
  options;
  notify = noop;

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
      this.notify = noop;
    };

    return unsubscribe;
  };
}

export default QueryObserver;
