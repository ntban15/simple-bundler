import { getMessage } from "./api.js";
import { LOCALE } from "./const.js";

const translations = {
  vi: {
    "Hello!": "Xin chào!",
  },
  es: {
    "Hello!": "Hola!",
  },
};
export function translate(text) {
  return translations[LOCALE][text] || text;
}

export function greet(name) {
  console.log(`${getMessage()} ${name}`);
}
