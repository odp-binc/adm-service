import fs from "fs";

const dotEnvJSON = (name) => {
  try {
    return JSON.parse(fs.readFileSync(".env.json"));
  } catch (e) {
  }
  return {};
};

export { dotEnvJSON };
