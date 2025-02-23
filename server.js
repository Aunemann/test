// Import necessary modules
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const fs = require('fs');
const path = require('path');

// Create an instance of express app
const app = express();
const PORT = 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json());

// Serve static files from the 'public' directory
app.use(express.static('public'));

// File to store votes data
const dataFilePath = 'votes.json';

// Initialize votes data if file doesn't exist
if (!fs.existsSync(dataFilePath)) {
  const initialData = { votes: {} };
  fs.writeFileSync(dataFilePath, JSON.stringify(initialData, null, 2));
}

// Helper functions
function readVotes() {
  const data = fs.readFileSync(dataFilePath);
  return JSON.parse(data);
}

function writeVotes(data) {
  fs.writeFileSync(dataFilePath, JSON.stringify(data, null, 2));
}

// Endpoint to check if a voter has already voted
app.get('/hasVoted', (req, res) => {
  const { voterId } = req.query;

  if (!voterId) {
    return res.status(400).json({ error: 'Voter ID is required.' });
  }

  const data = readVotes();

  if (data[voterId]) {
    res.json({ hasVoted: true });
  } else {
    res.json({ hasVoted: false });
  }
});

// Endpoint to submit a vote
app.post('/vote', (req, res) => {
  const { candidate, voterId } = req.body;

  if (!candidate || !voterId) {
    return res.status(400).json({ error: 'Candidate and voter ID are required.' });
  }

  const data = readVotes();

  // Check if voter has already voted
  if (data[voterId]) {
    return res.status(403).json({ error: 'You have already voted.' });
  }

  // Record the vote
  data[voterId] = candidate;
  data.votes[candidate] = (data.votes[candidate] || 0) + 1;

  writeVotes(data);

  res.json({ message: `Vote recorded for ${candidate}.` });
});

// Endpoint to get vote counts
app.get('/results', (req, res) => {
  const data = readVotes();
  res.json(data.votes);
});

// Serve index.html for all other routes
app.get('*', (req, res) => {
  res.sendFile(path.resolve(__dirname, 'public', 'index.html'));
});

// Start the server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server is running on port ${PORT}`);
});

