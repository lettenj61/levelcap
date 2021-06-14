const File = require("./dist/db").default;

const db = new File({ path: "db.json" });

(async () => {
  await db.write("users", [
    { id: 1, enabled: false },
    { id: 214, enabled: true }
  ]);

  await db.sync();
})();
