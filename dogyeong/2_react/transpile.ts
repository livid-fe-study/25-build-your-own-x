import { transformSync } from "@babel/core"

transformSync("code", {
  plugins: ["@babel/plugin-transform-react-jsx"],
});