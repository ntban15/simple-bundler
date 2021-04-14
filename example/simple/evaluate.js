import { sum } from "./utils.js";

function evaluate(expression) {
  const [op1, op2] = expression.split("+");

  const result = sum(parseInt(op1, 10), parseInt(op2, 10));

  return result;
}

export default evaluate;
