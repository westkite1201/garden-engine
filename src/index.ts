import { generate } from "./app/generate.js";

// Parse CLI args
const args = process.argv.slice(2);
let theme = process.env.THEME ?? "spring";

for (const arg of args) {
  if (arg.startsWith("--theme=")) {
    theme = arg.split("=")[1];
  }
}

generate(theme).catch((err) => {
  console.error(err);
  process.exit(1);
});
