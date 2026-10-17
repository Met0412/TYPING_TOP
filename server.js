const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;

// Ensure data directory exists
const dataDir = path.join(__dirname, 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const dbFilePath = path.join(dataDir, 'typing_results.json');

// Helper to read results from JSON file
function getResults() {
  try {
    if (!fs.existsSync(dbFilePath)) return [];
    const content = fs.readFileSync(dbFilePath, 'utf8');
    const parsed = JSON.parse(content);
    return Array.isArray(parsed) ? parsed : [];
  } catch (err) {
    console.error('Error reading data file:', err);
    return [];
  }
}

// Helper to write results to JSON file atomically
function saveResults(results) {
  try {
    const tempFile = `${dbFilePath}.tmp`;
    fs.writeFileSync(tempFile, JSON.stringify(results, null, 2), 'utf8');
    fs.renameSync(tempFile, dbFilePath);
    return true;
  } catch (err) {
    console.error('Error writing data file:', err);
    return false;
  }
}

// Middleware
app.use(cors());
app.use(express.json());

// Serve static project files (index.html, css/, js/)
app.use(express.static(__dirname));

// ── API Routes ──────────────────────────────────────────────────────────────

// POST /api/results → Save a new typing result
app.post('/api/results', (req, res) => {
  try {
    const { clean_wpm, raw_wpm, accuracy, correct_chars, incorrect_chars, duration, word_count } = req.body;
    if (clean_wpm == null || accuracy == null) {
      return res.status(400).json({ error: 'Missing required fields (clean_wpm, accuracy).' });
    }

    const results = getResults();
    const newId = results.length > 0 ? Math.max(...results.map(r => r.id || 0)) + 1 : 1;

    const newResult = {
      id: newId,
      clean_wpm: Math.round(Number(clean_wpm) * 10) / 10,
      raw_wpm: Math.round(Number(raw_wpm || clean_wpm) * 10) / 10,
      accuracy: Math.round(Number(accuracy) * 10) / 10,
      correct_chars: Number(correct_chars) || 0,
      incorrect_chars: Number(incorrect_chars) || 0,
      duration: Number(duration) || 30,
      word_count: Number(word_count) || 0,
      created_at: new Date().toISOString()
    };

    results.unshift(newResult);
    if (results.length > 500) results.length = 500; // Keep up to 500 entries

    saveResults(results);
    res.status(201).json({ id: newId, message: 'Result saved successfully.' });
  } catch (err) {
    console.error('Error saving result:', err);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

// GET /api/results → Get all results (most recent first, limit 50 by default)
app.get('/api/results', (req, res) => {
  try {
    const limit = parseInt(req.query.limit, 10) || 50;
    const results = getResults();
    res.json(results.slice(0, limit));
  } catch (err) {
    console.error('Error fetching results:', err);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

// GET /api/stats → Get aggregate statistics
app.get('/api/stats', (req, res) => {
  try {
    const results = getResults();
    if (results.length === 0) {
      return res.json({
        total_tests: 0,
        best_wpm: 0,
        avg_wpm: 0,
        best_accuracy: 0,
        avg_accuracy: 0
      });
    }

    const total_tests = results.length;
    const best_wpm = Math.max(...results.map(r => r.clean_wpm || 0));
    const avg_wpm = Math.round((results.reduce((acc, r) => acc + (r.clean_wpm || 0), 0) / total_tests) * 10) / 10;
    const best_accuracy = Math.max(...results.map(r => r.accuracy || 0));
    const avg_accuracy = Math.round((results.reduce((acc, r) => acc + (r.accuracy || 0), 0) / total_tests) * 10) / 10;

    res.json({
      total_tests,
      best_wpm,
      avg_wpm,
      best_accuracy,
      avg_accuracy
    });
  } catch (err) {
    console.error('Error fetching stats:', err);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

// DELETE /api/results → Clear all results
app.delete('/api/results', (req, res) => {
  try {
    saveResults([]);
    res.json({ message: 'All results cleared.' });
  } catch (err) {
    console.error('Error clearing results:', err);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

// Serve frontend for all other routes
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// Start server
app.listen(PORT, () => {
  console.log(`\n  KetikCepat server is running at http://localhost:${PORT}\n`);
});
