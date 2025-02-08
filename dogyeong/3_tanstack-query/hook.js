import { Didact } from '../2_react/didact.js'
import { QueryClient } from './query-client.js'

const client = new QueryClient()

const useBaseQuery = (options, Observer, queryClient) => {
  const [observer] = Didact.useState(() => {
    const defaultOptions = client.defaultQueryOptions(options)
    return new Observer(client, defaultOptions)
  })

  // core 로직과 React를 연결합니다.
  Didact.useSyncExternalStore(
    () => {
      // Object.is 를 기반으로 다시 렌더링 여부를 판단합니다.
      return observer.getResult()
    },
    (onStoreChange) => {
      // Query 객체의 상태가 변경될 때 onStoreChange 메소드가 호출됩니다.
      const unsubscribe = observer.subscribe(onStoreChange)
      return unsubscribe
    },
  )

  return observer.getResult()
}

export const useQuery = (options, queryClient) => {
  return useBaseQuery(options, QueryObserver, queryClient)
}
