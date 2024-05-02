const express = require('express');
const { verifyToken } = require('../auth');
const db = require('../db');
const app = express();

// Example private route for getting quizzes
app.get('/questions', async (req, res) => {
    try {
        const data = await db.query('SELECT questions.*, quizzes.userid FROM questions JOIN quizzes ON questions.quiz_id = quizzes.quiz_id');
        res.status(200).json(data.rows);
    } catch (error) {
        console.error('Error fetching quizzes:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }

});

app.get('/questions/:questionid', async (req, res) => {
    const questionid = req.params.questionid; // Extract quizId from request parameters

    try {
        // Fetch the quiz from the database

        // const quizQuery = "SELECT questions.*, quiz_users.username FROM questions JOIN quiz_users ON quizzes.userId = quiz_users.userId WHERE quizzes.quiz_id = $1";
        const quizQuery = "SELECT questions.*, quiz_users.username AS username FROM questions JOIN quizzes ON questions.quiz_id = quizzes.quiz_id JOIN quiz_users ON quizzes.userId = quiz_users.userId WHERE questions.question_id = $1;";
        const quizResult = await db.query(quizQuery, [questionid]);

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

app.post('/questions', verifyToken, async (req, res) => {
    const { userId, username, role } = req.user;
    const { question, ans1, ans2, ans3, ans4, correct_ans, quiz_id } = req.body;
    if (!question || !ans1 || !ans2 || !ans3 || !ans4 || !correct_ans || !quiz_id) {
        return res.status(400).json({ message: 'All fields are required' });
    }
    if (role === 'admin' || role === 'instructor') {
        try {
            // Fetch quiz details based on quiz_id
            const quizQuery = 'SELECT userId FROM quizzes WHERE quiz_id = $1';
            const quizResult = await db.query(quizQuery, [quiz_id]);


            if (quizResult.rows.length === 0) {
                return res.status(404).json({ message: 'Quiz not found' });
            }
            const { userid } = quizResult.rows[0];
            if (role !== "admin") {
                // Check if the quiz belongs to the requesting user
                if (userid !== userId) {
                    return res.status(403).json({ message: 'Forbidden - Quiz does not belong to the user' });
                }
            }
            // Insert question into the questions table
            const insertQuery = 'INSERT INTO questions (question_text, ans1, ans2, ans3, ans4, correct_ans, quiz_id) VALUES ($1, $2, $3, $4, $5, $6, $7)';
            await db.query(insertQuery, [question, ans1, ans2, ans3, ans4, correct_ans, quiz_id]);

            res.status(201).json({ message: 'Question added successfully' });
        } catch (error) {
            console.error('Error creating question:', error);
            res.status(500).json({ message: 'Internal Server Error' });
        }
    } else {
        res.status(403).json({ message: 'Forbidden' });
    }
});


app.put('/questions/:questionId', verifyToken, async (req, res) => {
    const { userId, username, role } = req.user;
    const { question, ans1, ans2, ans3, ans4, correct_ans, quiz_id } = req.body;
    const questionId = req.params.questionId; // Extract quizId from request parameters

    if (role === 'admin' || role === 'instructor') {
        try {
            if (role !== 'admin') {
                // Check if the quiz belongs to the user making the request
                const checkOwnershipQuery = 'SELECT userId FROM quizzes WHERE quiz_Id =(SELECT quiz_Id FROM questions WHERE question_id = $1)';
                const ownershipResult = await db.query(checkOwnershipQuery, [questionId]);


                if (ownershipResult.rows.length === 0) {
                    return res.status(404).json({ message: 'Quiz not found' });
                }

                const ownerUserId = ownershipResult.rows[0].userid;
                console.log(ownerUserId)
                if (ownerUserId !== userId) {
                    return res.status(403).json({ message: 'Unauthorized' });
                }
            }

            if (!question && !ans1 && !ans2 && !ans3 && !ans4 && !correct_ans && !quiz_id) {
                return res.status(400).json({ message: 'At least one of fields are required for update' });
            }

            let updateFields = [];
            let queryParams = [];

            if (question) {
                updateFields.push('question_text = $1');
                queryParams.push(question);
            }
            if (ans1) {
                updateFields.push('ans1 = $' + (queryParams.length + 1)); // Placeholder for parameterized query
                queryParams.push(ans1);
            }

            if (ans2) {
                updateFields.push('ans2 = $' + (queryParams.length + 1));
                queryParams.push(ans2);
            }

            if (ans3) {
                updateFields.push('ans3 = $' + (queryParams.length + 1));
                queryParams.push(ans3);
            }

            if (ans4) {
                updateFields.push('ans4 = $' + (queryParams.length + 1));
                queryParams.push(ans4);
            }

            if (correct_ans) {
                updateFields.push('correct_ans = $' + (queryParams.length + 1));
                queryParams.push(correct_ans);
            }

            if (quiz_id) {
                updateFields.push('quiz_id = $' + (queryParams.length + 1));
                queryParams.push(quiz_id);
            }

            // Construct the update query dynamically
            const updateQuery = `UPDATE questions SET ${updateFields.join(', ')} WHERE question_id = $${queryParams.length + 1}`;
            await db.query(updateQuery, [...queryParams, questionId]);

            res.status(200).json({ message: 'Quiz updated successfully' });
        } catch (error) {
            console.error('Error updating quiz:', error);
            res.status(500).json({ message: 'Internal Server Error' });
        }
    } else {
        res.status(403).json({ message: 'Forbidden' });
    }
});

app.delete('/questions/:questionId', verifyToken, async (req, res) => {
    const { userId, role } = req.user;
    const questionId = req.params.questionId;

    if (role === 'admin' || role === 'instructor') {

        try {
            if (role !== "admin") {
                // Check if the question belongs to the user making the request
                const ownershipQuery = 'SELECT quiz_id, userid FROM quizzes WHERE quiz_id = (SELECT quiz_id FROM questions WHERE question_id = $1)';
                const ownershipResult = await db.query(ownershipQuery, [questionId]);

                if (ownershipResult.rows.length === 0) {
                    return res.status(404).json({ message: 'Question not found' });
                }

                const ownerUserId = ownershipResult.rows[0].userid; // Check column name
                if (ownerUserId !== userId) {
                    return res.status(403).json({ message: 'Unauthorized' });
                }
            }

            // Delete the question
            const deleteQuery = 'DELETE FROM questions WHERE question_id = $1';
            await db.query(deleteQuery, [questionId]);

            res.status(200).json({ message: 'Question deleted successfully' });
        } catch (error) {
            console.error('Error deleting question:', error);
            res.status(500).json({ message: 'Internal Server Error' });
        }
    } else {
        res.status(403).json({ message: 'Forbidden' });
    }
});


module.exports = app;