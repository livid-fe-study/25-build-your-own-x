// import { useCallback, useState, useSyncExternalStore } from "react";
import {
  useCallback,
  useState,
  useSyncExternalStore,
} from "../../react/index.js";
import QueryObserver from "../core/QueryObserver.js";
// import { useQueryClient } from "./QueryClientProvider";
import { QueryClient } from "../core/QueryClient.js";
const client = new QueryClient();

const useBaseQuery = (options, Observer, queryClient) => {
  // const client = useQueryClient(queryClient);

  const [observer] = useState(
    new Observer(client, client.defaultQueryOptions(options))
  );

  const subscribe = useCallback(
    (onStoreChange) => {
      // Query 객체의 상태가 변경될 때 onStoreChange 메소드가 호출됩니다.
      const unsubscribe = observer.subscribe(onStoreChange);
      return unsubscribe;
    },
    [observer]
  );

  const getSnapshot = useCallback(() => {
    // Object.is 를 기반으로 다시 렌더링 여부를 판단합니다.
    return observer.getResult();
  }, [observer]);

  // core 로직과 React를 연결합니다.
  useSyncExternalStore(subscribe, getSnapshot);

  return observer.getResult();
};

const useQuery = (options, queryClient) => {
  return useBaseQuery(options, QueryObserver, queryClient);
};

export default useQuery;
