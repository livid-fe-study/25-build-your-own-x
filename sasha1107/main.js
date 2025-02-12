import { Didact } from "./react/didact.js";

/** @jsx Didact.createElement */
function Counter() {
  const [state, setState] = Didact.useState(1);
  const h1 = Didact.createElement("h1", null, "Count: ", state);
  const button = Didact.createElement(
    "button",
    {
      onClick: () => {
        setState((prev) => prev + 1);
      },
    },
    "Click me"
  );
  Didact.useEffect(() => {
    console.log("state", state);
    return () => {
      console.log("cleanup", state);
    };
  }, [state]);
  return Didact.createElement("div", null, h1, button);
}
const element = Didact.createElement(Counter, null);
const container = document.getElementById("root");
Didact.render(element, container);
