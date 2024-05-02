const express = require('express');
const { verifyToken } = require('../auth');
const db = require('../db');
const app = express();

// Example private route for getting quizzes
app.get('/quizzes', async (req, res) => {
    try {
        const data = await db.query('SELECT quizzes.*, quiz_users.username FROM quizzes JOIN quiz_users ON quizzes.userId = quiz_users.userId');
        res.status(200).json(data.rows);
    } catch (error) {
        console.error('Error fetching quizzes:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }

});

app.get('/quizzes/:quizId', async (req, res) => {
    const quizId = req.params.quizId; // Extract quizId from request parameters

    try {
        // Fetch the quiz from the database

        const quizQuery = "SELECT quizzes.*, quiz_users.username FROM quizzes JOIN quiz_users ON quizzes.userId = quiz_users.userId WHERE quizzes.quiz_id = $1";
        const quizResult = await db.query(quizQuery, [quizId]);

        if (quizResult.rows.length === 0) {
            return res.status(404).json({ message: 'Quiz not found' });
        }

        const quiz = quizResult.rows[0];

        // Check if the quiz belongs to the user making the request


        res.status(200).json(quiz);
    } catch (error) {
        console.error('Error fetching quiz:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
});

module.exports = app; // Export the app instance


app.post('/quizzes', verifyToken, async (req, res) => {
    const { userId, username, role } = req.user;
    const { name, time } = req.body;
    if (role === 'admin' || role === 'instructor') {
        try {
            const query = 'INSERT INTO quizzes (quiz_name, quiz_time, userId) VALUES ($1, $2, $3)';
            await db.query(query, [name, time, userId]);
            res.status(201).json({ name, time, userId, username });
        } catch (error) {
            console.error('Error creating quiz:', error);
            res.status(500).json({ message: 'Internal Server Error' });
        }
    } else {
        res.status(403).json({ message: 'Forbidden' });
    }
});


app.put('/quizzes/:quizId', verifyToken, async (req, res) => {
    const { userId, username, role } = req.user;
    const { name, time } = req.body;
    const quizId = req.params.quizId; // Extract quizId from request parameters

    if (role === 'admin' || role === 'instructor') {
        try {
            if (role !== "admin") {
                // Check if the quiz belongs to the user making the request
                const checkOwnershipQuery = 'SELECT userId FROM quizzes WHERE quiz_Id = $1';
                const ownershipResult = await db.query(checkOwnershipQuery, [quizId]);


                if (ownershipResult.rows.length === 0) {
                    return res.status(404).json({ message: 'Quiz not found' });
                }

                const ownerUserId = ownershipResult.rows[0].userid;
                console.log(ownerUserId)
                if (ownerUserId !== userId) {
                    return res.status(403).json({ message: 'Unauthorized' });
                }
            }
            if (!name && !time) {
                return res.status(400).json({ message: 'At least one of name or time is required for update' });
            }

            let updateFields = [];
            let queryParams = [];

            if (name) {
                updateFields.push('quiz_name = $1');
                queryParams.push(name);
            }

            if (time) {
                updateFields.push('quiz_time = $2');
                queryParams.push(time);
            }

            // Construct the update query dynamically
            const updateQuery = `UPDATE quizzes SET ${updateFields.join(', ')} WHERE quiz_id = $${queryParams.length + 1}`;
            console.log(updateQuery)
            await db.query(updateQuery, [...queryParams, quizId]);

            res.status(200).json({ message: 'Quiz updated successfully' });
        } catch (error) {
            console.error('Error updating quiz:', error);
            res.status(500).json({ message: 'Internal Server Error' });
        }
    } else {
        res.status(403).json({ message: 'Forbidden' });
    }
});

app.delete('/quizzes/:quizId', verifyToken, async (req, res) => {
    const { userId, role } = req.user;
    const quizId = req.params.quizId; // Extract quizId from request parameters

    if (role === 'admin' || role === 'instructor') {
        try {
            if (role !== "admin") {
                // Check if the quiz belongs to the user making the request
                const ownershipQuery = 'SELECT userId FROM quizzes WHERE quiz_id = $1';
                const ownershipResult = await db.query(ownershipQuery, [quizId]);

                if (ownershipResult.rows.length === 0) {
                    return res.status(404).json({ message: 'Quiz not found' });
                }

                const ownerUserId = ownershipResult.rows[0].userid; // Check column name here
                if (ownerUserId !== userId) {
                    return res.status(403).json({ message: 'Unauthorized' });
                }
            }

            // Delete the quiz
            const deleteQuery = 'DELETE FROM quizzes WHERE quiz_id = $1';
            await db.query(deleteQuery, [quizId]);

            res.status(200).json({ message: 'Quiz deleted successfully' });
        } catch (error) {
            console.error('Error deleting quiz:', error);
            res.status(500).json({ message: 'Internal Server Error' });
        }
    } else {
        res.status(403).json({ message: 'Forbidden' });
    }
});

module.exports = app; // Export the app instance

