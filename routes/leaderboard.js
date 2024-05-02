const express = require('express');
const { verifyToken } = require('../auth');
const db = require('../db');
const app = express();


app.get('/leaderboard', async (req, res) => {
    try {
        // Query to get user scores
        const queryText = `
            SELECT userid, SUM(score) AS total_score 
            FROM history 
            WHERE userid IS NOT NULL  -- Ensure only valid userids are considered
            GROUP BY userid 
            ORDER BY total_score DESC
        `;
        const result = await db.query(queryText);

        // Generate leaderboard
        const leaderboard = result.rows.map((user, index) => {
            return {
                rank: index + 1,
                userid: user.userid,
                totalScore: user.total_score
                // Add more user information like username, etc., based on your database schema
            };
        });

        // Send leaderboard data as JSON response
        res.json({ leaderboard });
    } catch (err) {
        console.error('Error fetching leaderboard:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

module.exports = app; // Export the app instance
