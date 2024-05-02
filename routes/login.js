// login.js
require('dotenv').config();

const express = require('express');
const bodyParser = require('body-parser');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const db = require('../db'); // Import the db.js file

const app = express();

// Middleware
app.use(bodyParser.json());

// Login endpoint
app.post('/login', async (req, res) => {
    const { username, password } = req.body;

    try {
        // Check if the username exists in the database
        const userQuery = 'SELECT * FROM quiz_users WHERE username = $1';
        const userResult = await db.query(userQuery, [username]);

        if (userResult.rows.length === 0) {
            return res.status(401).json({ error: 'Invalid username or password' });
        }

        // Verify password
        const user = userResult.rows[0];
        const passwordMatch = await bcrypt.compare(password, user.password);

        if (!passwordMatch) {
            return res.status(401).json({ error: 'Invalid username or password' });
        }

        // Generate JWT token
        const token = jwt.sign(
            { userId: user.userid, username: user.username, role: user.role },
            process.env.JWT_SECRET,
            { expiresIn: '10h' } // Token expires in 1 hour
        );

        res.status(200).json({
            userId: user.userid,
            username: user.username,
            email: user.email,
            role:user.role,
            token
        });
    } catch (err) {
        console.error('Error logging in user', err);
        res.status(500).send('Internal Server Error');
    }
});

module.exports = app; // Export the app instance
