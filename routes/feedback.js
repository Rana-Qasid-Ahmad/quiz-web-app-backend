const express = require('express');
const { verifyToken } = require('../auth');
const db = require('../db');
const app = express();



// app.get('/feedback', async (req, res) => {
//     const { userid } = req.params;
//     try {
//         const result = await db.query('SELECT * FROM history WHERE userid = $1', [userid]);
//         const rows = result.rows;

//         let totalScore = 0;
//         rows.forEach(row => {
//             totalScore += row.score;
//         });
//         res.json({ rows: result.rows, totalScore });
//     } catch (err) {
//         console.error('Error executing query', err);
//         res.status(500).send('Error fetching history');
//     }
// });
// POST request to insert quiz history


app.post('/feedback', verifyToken, async (req, res) => {
    const { role } = req.user
    const { userid, quiz_id, rate } = req.body;
    if (!userid && !quiz_id && !rate) {
        res.json({ message: 'Please enter all the feilds' });
    }
    try {
        if (role === 'student') {
            const result = await db.query('INSERT INTO feedback(userid, quiz_id, rate) VALUES($1, $2, $3) RETURNING *', [userid, quiz_id, rate]);
            res.status(200).json(result.rows[0]);
        } else (
            res.json({ message: "Not a student" })
        )
    } catch (err) {
        console.error('Error executing query', err);
        res.status(500).send('Error inserting history');
    }
});

module.exports = app; // Export the app instance
