import { useState, useMemo } from "react";
import { useSKDB, useQuery } from "skdb-react";
import "./App.css";
import { AppBar, Box, Toolbar, IconButton, Typography } from "@mui/material";
import { InputBase, Badge, Tabs, Tab, TextField, Paper } from "@mui/material";
import { Switch, Table, TableBody, TableCell, TableRow } from "@mui/material";
import { TableContainer, TablePagination } from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import AddIcon from "@mui/icons-material/Add";
import DeleteIcon from "@mui/icons-material/Delete";

type Option = {
  filter: string;
  onFilter: (filter: string) => void;
  page: number;
  onPage: (page: number) => void;
  rowsPerPage: number;
  onRowsPerPage: (page: number) => void;
};

interface Task {
  id: string;
  name: string;
  complete: number;
}

function TasksTable({
  completed,
  option,
}: {
  completed: boolean;
  option: Option;
}) {
  const handleChangePage = (_event: unknown, newPage: number) => {
    option.onPage(newPage);
  };

  const handleChangeRowsPerPage = (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    option.onRowsPerPage(parseInt(event.target.value, 10));
    option.onPage(0);
  };

  const params: { filt: string; completed: number; end?: number } = {
    filt: "%" + option.filter + "%",
    completed: completed ? 1 : 0,
  };
  const counts = useQuery(
    "SELECT count(*) AS n FROM tasks WHERE name LIKE @filt AND complete = @completed;",
    params,
  );

  const count = counts.length ? counts[0].n : 0;
  let page = Math.max(
    Math.min(option.page, Math.floor((count - 1) / option.rowsPerPage)),
    0,
  );
  const start = page * option.rowsPerPage;
  params.end = (page + 1) * option.rowsPerPage;
  const tasks = (
    useQuery(
      "SELECT * FROM tasks WHERE name LIKE @filt AND complete = @completed ORDER BY id DESC LIMIT @end;",
      params,
    ) as Array<Task>
  ).slice(start);
  if (page != option.page) {
    setTimeout(() => option.onPage(page), 0);
  }
  return (
    <Paper>
      <TableContainer>
        <Table sx={{ minWidth: 650 }} aria-label="simple table">
          <TableBody>
            {tasks.map((t: Task) => (
              <TaskRow task={t} key={t.id} />
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <TablePagination
        rowsPerPageOptions={[5, 10, 25]}
        component="footer"
        count={count}
        rowsPerPage={option.rowsPerPage}
        page={page}
        onPageChange={handleChangePage}
        onRowsPerPageChange={handleChangeRowsPerPage}
      />
    </Paper>
  );
}

function TaskRow({ task }: { task: Task }) {
  const skdb = useSKDB();

  const isComplete = task.complete === 1;

  const del = (id: string) => {
    skdb.exec("DELETE FROM tasks WHERE id = @id;", { id });
  };

  const complete = (id: string, complete: boolean) => {
    const completed = complete ? 1 : 0;
    skdb.exec("UPDATE tasks SET complete = @completed WHERE id = @id;", {
      id,
      completed,
    });
  };
  return (
    <TableRow className="task">
      <TableCell>
        <Typography noWrap component="div">
          {task.name}
        </Typography>
      </TableCell>
      <TableCell className="min">
        <IconButton title="Delete" onClick={(_e) => del(task.id)}>
          <DeleteIcon />
        </IconButton>
      </TableCell>
      <TableCell className="min">
        <Switch
          size="small"
          title="Completed?"
          checked={isComplete}
          onChange={(e) => complete(task.id, e.target.checked)}
        />
      </TableCell>
    </TableRow>
  );
}

function AddTasks() {
  const skdb = useSKDB();
  const [taskName, setTaskName] = useState("");
  const isEmpty = useMemo(() => taskName.length == 0, [taskName]);

  const handleTaskName = (e: any) => {
    setTaskName(e.target.value);
  };

  const addTask = async (name: string) => {
    if (isEmpty) {
      return;
    }
    skdb.exec(
      "INSERT INTO tasks (name, complete, skdb_access) VALUES (@name, 0, 'read-write');",
      { name },
    );
    setTaskName("");
  };

  const onKeyDown = ({ keyCode }: { keyCode: number }) => {
    if (keyCode == 13) addTask(taskName);
  };

  return (
    <Box className="new">
      <TextField
        placeholder="Enter the new task name"
        label="Task name"
        variant="standard"
        onChange={handleTaskName}
        value={taskName}
        onKeyDown={onKeyDown}
      />
      <IconButton
        disabled={isEmpty}
        title="Add Task"
        onClick={(_e) => addTask(taskName)}
      >
        <AddIcon />
      </IconButton>
    </Box>
  );
}

function Body(params: { option: Option }) {
  const option = params.option;
  const [value, setCurrentTab] = useState("uncompleted");
  const counts = useQuery(
    "SELECT complete, count(*) AS n FROM tasks GROUP BY complete;",
  );

  let completed = 0;
  let uncompleted = 0;

  for (const summary of counts) {
    if (summary.complete === 1) {
      completed = summary.n;
    } else {
      uncompleted = summary.n;
    }
  }

  const handleTabChange = (_e: any, value: string) => {
    setCurrentTab(value);
  };
  return (
    <Box className="app-body" component="main">
      <Box sx={{ borderBottom: 1, borderColor: "divider" }}>
        <Tabs
          value={value}
          aria-label="TODO TABS"
          variant="fullWidth"
          onChange={handleTabChange}
        >
          <Tab
            value="uncompleted"
            label={
              <Badge badgeContent={uncompleted} color="success">
                Todo
              </Badge>
            }
          />
          <Tab
            value="completed"
            label={
              <Badge badgeContent={completed} color="warning">
                Done
              </Badge>
            }
          />
        </Tabs>
      </Box>
      {value === "uncompleted" && (
        <div className="todo">
          <AddTasks />
          <TasksTable completed={false} option={option} />
        </div>
      )}
      {value === "completed" && (
        <div className="done">
          <TasksTable completed={true} option={option} />
        </div>
      )}
    </Box>
  );
}

function Header({
  text,
  onChange,
  onPage,
}: {
  text: string;
  onChange: (text: string) => void;
  onPage: (page: number) => void;
  handleDrawerToggle: () => void;
}) {
  const handleFilter = (e: any) => {
    onChange(e.target.value);
    onPage(0);
  };

  return (
    <Box>
      <AppBar position="static">
        <Toolbar>
          <Typography
            variant="h6"
            noWrap
            component="div"
            sx={{ display: { xs: "none", sm: "block" } }}
          >
            Real Data Streaming
          </Typography>
          <div className="search">
            <div className="icon">
              <SearchIcon />
            </div>
            <InputBase
              className="filter"
              placeholder="Search…"
              value={text}
              onChange={handleFilter}
            />
          </div>
        </Toolbar>
      </AppBar>
    </Box>
  );
}

function App() {
  const [filterText, setFilterText] = useState("");
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(5);
  //
  const [mobileOpen, setMobileOpen] = useState(false);
  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const option: Option = {
    filter: filterText,
    onFilter: setFilterText,
    page: page,
    onPage: setPage,
    rowsPerPage: rowsPerPage,
    onRowsPerPage: setRowsPerPage,
  };
  return (
    <>
      <div className="app">
        <Header
          text={filterText}
          onChange={setFilterText}
          onPage={setPage}
          handleDrawerToggle={handleDrawerToggle}
        />
        <Body option={option} />
      </div>
    </>
  );
}

export default App;
