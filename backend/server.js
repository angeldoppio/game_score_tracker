const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const { Pool } = require('pg');

const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(bodyParser.json());
app.use(cors());

// PostgreSQL pool setup
const pool = new Pool({
    user: 'nattarinee',
    host: 'localhost',
    database: 'game_tracker',
    password: '1234',
    port: 5432,
});

// Test DB connection
pool.connect((err) => {
    if (err) {
        console.error('Error connecting to PostgreSQL:', err);
    } else {
        console.log('Connected to PostgreSQL!');
    }
});

// Sample route to get players
app.get('/players', async (req, res) => {
    try {
        console.log('Fetching players...');
        const result = await pool.query('SELECT * FROM players');
        console.log('Players fetched:', result.rows);
        res.status(200).json(result.rows);
    } catch (error) {
        console.error('Error fetching players:', error);
        res.status(500).json({ error: 'Failed to fetch players' });
    }
});


// Sample route to add a player
app.post('/players', async (req, res) => {
    const { name, startingScore } = req.body;
    console.log('Adding player:', { name, startingScore });
    try {
        await pool.query(
            'INSERT INTO players (name, starting_score, score) VALUES ($1, $2, $2)',
            [name, startingScore]
        );
        res.status(201).json({ message: 'Player added successfully' });
    } catch (error) {
        console.error('Error adding player:', error.message); // Log the specific error message
        res.status(500).json({ error: 'Failed to add player', details: error.message });
    }
});


// Sample route to update player's score
app.put('/players/:id', async (req, res) => {
    const { id } = req.params;
    const { score } = req.body;
    try {
        await pool.query('UPDATE players SET score = $1 WHERE id = $2', [score, id]);
        res.status(200).json({ message: 'Score updated successfully' });
    } catch (error) {
        res.status(500).json({ error: 'Failed to update score' });
    }
});

// Sample route to remove a player
app.delete('/players/:id', async (req, res) => {
    const { id } = req.params;
    try {
        await pool.query('DELETE FROM players WHERE id = $1', [id]);
        res.status(200).json({ message: 'Player removed successfully' });
    } catch (error) {
        res.status(500).json({ error: 'Failed to remove player' });
    }
});


// Start server
app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});
