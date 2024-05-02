const express = require('express');
const db = require('./db');
require('dotenv').config();
const register = require('./routes/register');
const login = require('./routes/login');
const curdquizzes = require('./routes/curdquiz');
const curdquestions = require('./routes/curdquestion');
const history = require('./routes/history');
const feedback = require('./routes/feedback');
const leaderboard = require('./routes/leaderboard');
const users = require('./routes/users');
const app = express();
const PORT =  3000;

app.use(express.json());
app.use(register)
app.use(login)
app.use(curdquizzes)
app.use(users)
app.use(curdquestions)
app.use(history)
app.use(leaderboard)
app.use(feedback)


// Start the server
app.listen(PORT, () => {
  console.log(`Server running on port http://localhost:${PORT}`);
});
