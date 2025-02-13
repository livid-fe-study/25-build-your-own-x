import { useState, useEffect, createElement, render } from "./react/index.js";
import useQuery from "./tanstack-query/react/useQuery.js";

/** @jsx Didact.createElement */
function Counter() {
  const [state, setState] = useState(1);
  const { data = [], isFetching: isLoading } = useQuery({
    queryKey: ["todos"],
    queryFn: async () => {
      const response = await fetch(
        "https://jsonplaceholder.typicode.com/todos?_limit=4"
      );
      return response.json();
    },
  });
  const h1 = createElement("h1", null, "Count: ", state);
  const button = createElement(
    "button",
    {
      onClick: () => {
        setState((prev) => prev + 1);
      },
    },
    "Click me"
  );
  // const h2 = createElement("h2", null, "Todos: ", data);
  console.log("data", data);
  useEffect(() => {
    console.log("state", state);
    return () => {
      console.log("cleanup", state);
    };
  }, [state]);
  return createElement("div", null, h1, button);
}
const element = createElement(Counter, null);
const container = document.getElementById("root");
render(element, container);
