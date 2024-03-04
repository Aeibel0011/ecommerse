const express = require("express");
const path = require("path");
const cookieParser = require("cookie-parser");
const logger = require("morgan");
const session = require("express-session");
const adminRouter = require("./routes/admin");
const usersRouter = require("./routes/users");
const nocache = require('nocache');
const app = express();
// Add nocache middleware to prevent caching
app.use(nocache());
// Use express-session middleware
app.use(
  session({
    secret: "your-secret-key", // Replace with a strong secret key
    resave: false,
    saveUninitialized: true,
  })
);

// view engine setup
app.set("views", path.join(__dirname, "views"));
app.set("view engine", "ejs");

app.use(logger("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, "public")));

app.use("/admin", adminRouter);
app.use("/", usersRouter);

// catch 404 and forward to error handler
app.use(function (req, res, next) {
  const err = new Error("Not Found");
  err.status = 404 ;
  next(err);
});

// error handler
app.use(function (err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get("env") === "development" ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render("error",{});
});
// Normalize a port into a number, string, or false.
function normalizePort(val) {
  const port = parseInt(val, 10);
  if (isNaN(port)) {
    // named pipe
    return val;
  }
  if (port >= 0) {
    // port number
    return port;
  }
  return false;
}

// Start the server
const port = normalizePort(process.env.PORT || "3000");
app.set("port", port);
const server = app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
