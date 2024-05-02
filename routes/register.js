// register.js

const express = require('express');
const bodyParser = require('body-parser');
const bcrypt = require('bcrypt');
const db = require('../db'); // Import the db.js file

const app = express();

// Middleware
app.use(bodyParser.json());

// Register endpoint
app.post('/register', async (req, res) => {
    const { username, email, password, role } = req.body;
  
    try {
        console.log(username, email, password);
      // Check if the username or email already exists
      const userExistsQuery = 'SELECT * FROM quiz_users WHERE username = $1 OR email = $2';
      const userExistsResult = await db.query(userExistsQuery, [username, email]);
  
      if (userExistsResult.rows.length > 0) {
        return res.status(400).json({ error: 'Username or email already exists' });
      }
  
      // Hash the password
      const hashedPassword = await bcrypt.hash(password, 10);
  
      // Insert new user into the database
      const insertUserQuery = 'INSERT INTO quiz_users (username, email, password , role) VALUES ($1, $2, $3, $4) RETURNING *';
      const newUser = await db.query(insertUserQuery, [username, email, hashedPassword, role]);
  
      res.status(201).json(newUser.rows[0]);
    } catch (err) {
      console.error('Error registering user', err);
      res.status(500).send('Internal Server Error');
    }
  });

module.exports = app; // Export the app instance
