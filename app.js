const express = require("express");
const path = require("path");

const { open } = require("sqlite");
const sqlite3 = require("sqlite3");

const format = require("date-fns/format");
const isMatch = require("date-fns/isMatch");
const isValid = require("date-fns/isValid");

const app = express();
app.use(express.json());

const dbPath = path.join(__dirname, "todoApplication.db");
let db = null;

const initializeDBAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("Server running at http://localhost:3000/");
    });
  } catch (e) {
    console.log(`DB Error: ${e.message}`);
    process.exit(1);
  }
};

initializeDBAndServer();

const convertDbObjToResponseObj = (dbObj) => {
  return {
    id: dbObj.id,
    todo: dbObj.todo,
    priority: dbObj.priority,
    status: dbObj.status,
    category: dbObj.category,
    dueDate: dbObj.due_date,
  };
};

const hasPriorityProperty = (requestQuery) => {
  return requestQuery.priority !== undefined;
};

const hasStatusProperty = (requestQuery) => {
  return requestQuery.status !== undefined;
};

const hasCategoryProperty = (requestQuery) => {
  return requestQuery.category !== undefined;
};

const hasPriorityAndStatusProperty = (requestQuery) => {
  return (
    requestQuery.priority !== undefined && requestQuery.status !== undefined
  );
};

const hasCategoryAndStatusProperty = (requestQuery) => {
  return (
    requestQuery.category !== undefined && requestQuery.status !== undefined
  );
};

const hasCategoryAndPriorityProperty = (requestQuery) => {
  return (
    requestQuery.category !== undefined && requestQuery.priority !== undefined
  );
};

const hasSearchProperty = (requestQuery) => {
  return requestQuery.search_q !== undefined;
};

// API 1

app.get("/todos/", async (request, response) => {
  let data = null;
  let getTodosQuery = "";
  const { search_q = "", priority, status, category } = request.query;
  switch (true) {
    // Scenario 1
    case hasStatusProperty(request.query):
      if (status === "TO DO" || status === "IN PROGRESS" || status === "DONE") {
        getTodosQuery = `
                    SELECT 
                        *
                    FROM
                        todo
                    WHERE
                        status='${status}';`;
        data = await db.all(getTodosQuery);
        response.send(
          data.map((eachObj) => convertDbObjToResponseObj(eachObj))
        );
      } else {
        response.status(400);
        response.send("Invalid Todo Status");
      }
      break;

    // Scenario 2
    case hasPriorityProperty(request.query):
      if (priority === "HIGH" || priority === "MEDIUM" || priority === "LOW") {
        getTodosQuery = `
                    SELECT 
                        *
                    FROM
                        todo
                    WHERE
                        priority='${priority}';`;
        data = await db.all(getTodosQuery);
        response.send(
          data.map((eachObj) => convertDbObjToResponseObj(eachObj))
        );
      } else {
        response.status(400);
        response.send("Invalid Todo Priority");
      }
      break;

    // Scenario 3
    case hasPriorityAndStatusProperty(request.query):
      if (priority === "HIGH" || priority === "MEDIUM" || priority === "LOW") {
        if (
          status === "TO DO" ||
          status === "IN PROGRESS" ||
          status === "DONE"
        ) {
          getTodosQuery = `
                    SELECT 
                        *
                    FROM
                        todo
                    WHERE
                        priority='${priority}' AND
                        status ='${status}';`;
          data = await db.all(getTodosQuery);
          response.send(
            data.map((eachObj) => convertDbObjToResponseObj(eachObj))
          );
        } else {
          response.status(400);
          response.send("Invalid Todo Status");
        }
      } else {
        response.status(400);
        response.send("Invalid Todo Priority");
      }
      break;

    // Scenario 4
    case hasSearchProperty(request.query):
      getTodosQuery = `
                    SELECT 
                        *
                    FROM
                        todo
                    WHERE
                        todo LIKE '%${search_q}%';`;
      data = await db.all(getTodosQuery);
      response.send(data.map((eachObj) => convertDbObjToResponseObj(eachObj)));
      break;

    // Scenario 5
    case hasCategoryAndStatusProperty(request.query):
      if (
        category === "WORK" ||
        category === "HOME" ||
        category === "LEARNING"
      ) {
        if (
          status === "TO DO" ||
          status === "IN PROGRESS" ||
          status === "DONE"
        ) {
          getTodosQuery = `
                    SELECT 
                        *
                    FROM
                        todo
                    WHERE
                        category='${category}' AND
                        status ='${status}';`;
          data = await db.all(getTodosQuery);
          response.send(
            data.map((eachObj) => convertDbObjToResponseObj(eachObj))
          );
        } else {
          response.status(400);
          response.send("Invalid Todo Status");
        }
      } else {
        response.status(400);
        response.send("Invalid Todo Category");
      }
      break;

    // Scenario 6
    case hasCategoryProperty(request.query):
      if (
        category === "WORK" ||
        category === "HOME" ||
        category === "LEARNING"
      ) {
        getTodosQuery = `
                    SELECT 
                        *
                    FROM
                        todo
                    WHERE
                        category='${category}';`;
        data = await db.all(getTodosQuery);
        response.send(
          data.map((eachObj) => convertDbObjToResponseObj(eachObj))
        );
      } else {
        response.status(400);
        response.send("Invalid Todo Category");
      }
      break;

    // Scenario 7
    case hasCategoryAndPriorityProperty(request.query):
      if (
        category === "WORK" ||
        category === "HOME" ||
        category === "LEARNING"
      ) {
        if (
          priority === "HIGH" ||
          priority === "MEDIUM" ||
          priority === "LOW"
        ) {
          getTodosQuery = `
                    SELECT 
                        *
                    FROM
                        todo
                    WHERE
                        category='${category}' AND
                        priority ='${priority}';`;
          data = await db.all(getTodosQuery);
          response.send(
            data.map((eachObj) => convertDbObjToResponseObj(eachObj))
          );
        } else {
          response.status(400);
          response.send("Invalid Todo Priority");
        }
      } else {
        response.status(400);
        response.send("Invalid Todo Category");
      }
      break;

    default:
      getTodosQuery = `
                SELECT 
                    *
                FROM
                    todo;`;
      data = await db.all(getTodosQuery);
      response.send(data.map((eachObj) => convertDbObjToResponseObj(eachObj)));
      break;
  }
});

// API 2

app.get("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  const getTodoQuery = `
        SELECT 
            *
        FROM
            todo
        WHERE
            id=${todoId};`;
  const getTodoResponse = await db.get(getTodoQuery);
  response.send(convertDbObjToResponseObj(getTodoResponse));
});

// API 3

app.get("/agenda/", async (request, response) => {
  const { date } = request.query;
  if (isMatch(date, "yyyy-MM-dd")) {
    const newDate = format(new Date(date), "yyyy-MM-dd");
    const getAgendaQuery = `
            SELECT
                * 
            FROM
                todo
            WHERE 
                due_date = '${newDate}';`;
    const getAgendaResponse = await db.all(getAgendaQuery);
    response.send(
      getAgendaResponse.map((eachObj) => convertDbObjToResponseObj(eachObj))
    );
  } else {
    response.status(400);
    response.send("Invalid Due Date");
  }
});

// API 4

app.post("/todos/", async (request, response) => {
  const { id, todo, priority, status, category, dueDate } = request.body;
  if (priority === "HIGH" || priority === "MEDIUM" || priority === "LOW") {
    if (status === "TO DO" || status === "IN PROGRESS" || status === "DONE") {
      if (
        category === "WORK" ||
        category === "HOME" ||
        category === "LEARNING"
      ) {
        if (isMatch(dueDate, "yyyy-MM-dd")) {
          const postNewDate = format(new Date(dueDate), "yyyy-MM-dd");
          const createTodoQuery = `
                INSERT INTO
                    todo (id, todo, priority, status, category, due_date)
                VALUES(
                    ${id}, 
                    '${todo}', 
                    '${priority}', 
                    '${status}', 
                    '${category}',
                    '${postNewDate}'
                );`;
          const createTodoResponse = await db.run(createTodoQuery);
          response.send("Todo Successfully Added");
        } else {
          response.status(400);
          response.send("Invalid Due Date");
        }
      } else {
        response.status(400);
        response.send("Invalid Todo Category");
      }
    } else {
      response.status(400);
      response.send("Invalid Todo Status");
    }
  } else {
    response.status(400);
    response.send("Invalid Todo Priority");
  }
});

// API 5

app.put("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  const requestBody = request.body;
  const previousTodoQuery = `
        SELECT 
            *
        FROM
            todo
        WHERE 
            id=${todoId};`;

  const previousTodoResponse = await db.get(previousTodoQuery);

  const {
    todo = previousTodoResponse.todo,
    priority = previousTodoResponse.priority,
    status = previousTodoResponse.status,
    category = previousTodoResponse.category,
    dueDate = previousTodoResponse.due_date,
  } = request.body;

  let updateTodoQuery;

  switch (true) {
    // Scenario 1
    case requestBody.status !== undefined:
      if (status === "TO DO" || status === "IN PROGRESS" || status === "DONE") {
        updateTodoQuery = `
                    UPDATE
                        todo
                    SET 
                        todo = '${todo}',
                        priority =  '${priority}',
                        status = '${status}',
                        category = '${category}',
                        due_date = '${dueDate}'
                    WHERE
                        id=${todoId};`;
        await db.run(updateTodoQuery);
        response.send("Status Updated");
      } else {
        response.status(400);
        response.send("Invalid Todo Status");
      }
      break;

    // Scenario 2
    case requestBody.priority !== undefined:
      if (priority === "HIGH" || priority === "MEDIUM" || priority === "LOW") {
        updateTodoQuery = `
                    UPDATE
                        todo
                    SET 
                        todo = '${todo}',
                        priority =  '${priority}',
                        status = '${status}',
                        category = '${category}',
                        due_date = '${dueDate}'
                    WHERE
                        id=${todoId};`;
        await db.run(updateTodoQuery);
        response.send("Priority Updated");
      } else {
        response.status(400);
        response.send("Invalid Todo Priority");
      }
      break;

    // Scenario 3
    case requestBody.todo !== undefined:
      updateTodoQuery = `
                    UPDATE
                        todo
                    SET 
                        todo = '${todo}',
                        priority =  '${priority}',
                        status = '${status}',
                        category = '${category}',
                        due_date = '${dueDate}'
                    WHERE
                        id=${todoId};`;
      await db.run(updateTodoQuery);
      response.send("Todo Updated");
      break;

    // Scenario 4
    case requestBody.category !== undefined:
      if (
        category === "WORK" ||
        category === "HOME" ||
        category === "LEARNING"
      ) {
        updateTodoQuery = `
                    UPDATE
                        todo
                    SET 
                        todo = '${todo}',
                        priority =  '${priority}',
                        status = '${status}',
                        category = '${category}',
                        due_date = '${dueDate}'
                    WHERE
                        id=${todoId};`;
        await db.run(updateTodoQuery);
        response.send("Category Updated");
      } else {
        response.status(400);
        response.send("Invalid Todo Category");
      }
      break;

    // Scenario 5
    case requestBody.dueDate !== undefined:
      if (isMatch(dueDate, "yyyy-MM-dd")) {
        const newDate = format(new Date(dueDate), "yyyy-MM-dd");
        updateTodoQuery = `
                    UPDATE
                        todo
                    SET 
                        todo = '${todo}',
                        priority =  '${priority}',
                        status = '${status}',
                        category = '${category}',
                        due_date = '${newDate}'
                    WHERE
                        id=${todoId};`;
        await db.run(updateTodoQuery);
        response.send("Due Date Updated");
      } else {
        response.status(400);
        response.send("Invalid Due Date");
      }
  }
});

// API 6

app.delete("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  const deleteTodoQuery = `
        DELETE FROM
            todo
        WHERE
            id=${todoId};`;
  await db.run(deleteTodoQuery);
  response.send("Todo Deleted");
});

module.exports = app;
