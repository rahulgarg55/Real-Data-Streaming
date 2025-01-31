import { SKDB } from "skdb";
import { skdbDevServerDb, createLocalDbConnectedTo } from "skdb-dev";

// Connect to the remote server and create a local instance mirroring
// the `tasks` table

const remoteDb = await skdbDevServerDb("dummy", "localhost", 3586);
await remoteDb.schema(
  "CREATE TABLE IF NOT EXISTS tasks (id STRING PRIMARY KEY, name STRING, complete INTEGER, skdb_access STRING);",
);

const localDb = await createLocalDbConnectedTo(remoteDb, "root");
await localDb.mirror({
  table: "tasks",
  expectedColumns: "(id STRING PRIMARY KEY, name STRING, complete INTEGER, skdb_access STRING)"
});

// Watch for changes to uncompleted tasks; log any additions or removals

await localDb.exec(
  `CREATE VIRTUAL VIEW uncompleted_tasks AS
     SELECT * FROM tasks WHERE complete = 0;`,
);

await localDb.watchChanges(
  "SELECT * FROM uncompleted_tasks",
  {},
  (initial_rows) => {
    /* ignore */
  },
  (added, removed) => {
    for (let row of added) {
      console.log("ADDED: " + JSON.stringify(row));
    }
    for (let row of removed) {
      console.log("REMOVED: " + JSON.stringify(row));
    }
  },
);
