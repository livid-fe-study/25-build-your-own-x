import { Didact } from './didact'

/** @jsx Didact.createElement */
function Counter() {
  const [state, setState] = Didact.useState(1)

  Didact.useEffect(() => {
    const handler = () => {
      console.log('state: ', state)
    }

    console.log('run useEffect')
    document.addEventListener('click', handler)

    return () => {
      console.log('cleanup useEffect')
      document.removeEventListener('click', handler)
    }
  }, [state])

  return <h1 onClick={() => setState((c) => c + 1)}>Count: {state}</h1>
}

const element = <Counter />
const container = document.getElementById('root')
Didact.render(element, container)
