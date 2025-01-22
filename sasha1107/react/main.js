import { Didact } from "./didact.js";

/** @jsx Didact.createElement */
function Counter() {
  const [state, setState] = Didact.useState(1);
  return Didact.createElement(
    "h1",
    {
      onClick: () => {
        setState((prev) => prev + 1);
      },
    },
    "Count: ",
    state
  );
}
const element = Didact.createElement(Counter, null);
const container = document.getElementById("root");
Didact.render(element, container);
