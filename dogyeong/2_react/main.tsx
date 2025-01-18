import { Didact } from './didact.ts'

/** @jsx Didact.createElement */
function Counter() {
  const [state, setState] = Didact.useState(1)
  return <h1 onClick={() => setState((c) => c + 1)}>Count: {state}</h1>
}
const element = <Counter />
const container = document.getElementById('root')
Didact.render(element, container)
