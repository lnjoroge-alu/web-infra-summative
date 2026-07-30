require('dotenv').config();
const express = require('express');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.static(path.join(__dirname, 'public')));

app.get('/api/search', async (req, res) => {
  const { queryTerm, location, employment_type, remote, page } = req.query;
  
  if (!queryTerm) {
    return res.status(400).json({ error: 'Missing search query' });
  }

  
  
});

app.listen(PORT, () => {
  console.log(`Job Finder running on http://localhost:${PORT}`);
});
