// user.js

const express = require('express');
const router = express.Router();
const db = require('../db'); // Assuming you have a database module
const { verifyToken } = require('../auth');

// Create a new user
// router.post('/', async (req, res) => {
//     const { username, email, password } = req.body;
//     try {
//         const newUser = await db.query('INSERT INTO users (username, email, password) VALUES ($1, $2, $3) RETURNING *', [username, email, password]);
//         res.status(201).json(newUser.rows[0]);
//     } catch (error) {
//         console.error('Error creating user:', error);
//         res.status(500).json({ message: 'Error creating user' });
//     }
// });

// Get all users
router.get('/users', async (req, res) => {
    try {
        const allUsers = await db.query('SELECT userid, username, email, role, createdAt FROM quiz_users');
        res.status(200).json(allUsers.rows);
    } catch (error) {
        console.error('Error getting users:', error);
        res.status(500).json({ message: 'Error getting users' });
    }
});

// Get a single user by ID
router.get('/users/:userId', async (req, res) => {
    const userId = req.params.userId;
    try {
        const user = await db.query('SELECT * FROM quiz_users WHERE userid = $1', [userId]);
        if (user.rows.length === 0) {
            return res.status(404).json({ message: 'User not found' });
        }
        res.status(200).json(user.rows[0]);
    } catch (error) {
        console.error('Error getting user:', error);
        res.status(500).json({ message: 'Error getting user' });
    }
});

// Update a user by ID
router.put('/users/:userId', verifyToken, async (req, res) => {
    const { role } = req.user;
    const userId = req.params.userId;
    const { username, email, userrole } = req.body;

    try {
        if (role === 'admin') {
            let updateFields = [];
            let queryParams = [];

            if (username) {
                updateFields.push('username = $' + (queryParams.length + 1));
                queryParams.push(username);
            }

            if (email) {
                updateFields.push('email = $' + (queryParams.length + 1));
                queryParams.push(email);
            }

            if (userrole) {
                updateFields.push('role = $' + (queryParams.length + 1));
                queryParams.push(userrole);
            }

            if (updateFields.length === 0) {
                return res.status(400).json({ message: 'No fields provided for update' });
            }

            // Add userId as the last parameter for the WHERE clause
            queryParams.push(userId);

            const updateQuery = 'UPDATE quiz_users SET ' + updateFields.join(', ') + ' WHERE userid = $' + queryParams.length + ' RETURNING *';

            const updatedUser = await db.query(updateQuery, queryParams);

            if (updatedUser.rows.length === 0) {
                return res.status(404).json({ message: 'User not found' });
            }
            res.status(200).json(updatedUser.rows[0]);
        }
    } catch (error) {
        console.error('Error updating user:', error);
        res.status(500).json({ message: 'Error updating user' });
    }
});

// Delete a user by ID
router.delete('/users/:userId', async (req, res) => {
    const userId = req.params.userId;
    try {
        const deletedUser = await db.query('DELETE FROM users WHERE user_id = $1 RETURNING *', [userId]);
        if (deletedUser.rows.length === 0) {
            return res.status(404).json({ message: 'User not found' });
        }
        res.status(200).json({ message: 'User deleted successfully' });
    } catch (error) {
        console.error('Error deleting user:', error);
        res.status(500).json({ message: 'Error deleting user' });
    }
});

module.exports = router;
