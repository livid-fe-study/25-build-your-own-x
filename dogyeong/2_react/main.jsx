import { Didact } from './didact.js'

const store = {
  value: 1,
  listeners: [],
  onChange() {
    store.value += 10
    store.listeners.forEach((listener) => listener())
  },
  subscribe(listener) {
    store.listeners.push(listener)
  },
}

/** @jsx Didact.createElement */
function Counter() {
  const [state, setState] = Didact.useState(1)

  Didact.useEffect(() => {
    const handler = () => {
      console.log('state: ', state)
      store.onChange()
    }

    console.log('run useEffect')
    document.addEventListener('click', handler)

    return () => {
      console.log('cleanup useEffect')
      document.removeEventListener('click', handler)
    }
  }, [state])

  const storeValue = Didact.useSyncExternalStore(
    () => store.value,
    store.subscribe,
  )

  return (
    <h1 onClick={() => setState((c) => c + 1)}>
      Count: {state}, storeValue: {storeValue}
    </h1>
  )
}

const element = <Counter />
const container = document.getElementById('root')
Didact.render(element, container)
