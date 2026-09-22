import { loadEnvFile } from "../lib/load-env";
import { resetDemoData } from "../lib/seed";

loadEnvFile();

resetDemoData()
  .then(() => {
    console.log("seed ok");
    process.exit(0);
  })
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
