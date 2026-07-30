require('dotenv').config();
const express = require('express');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.static(path.join(__dirname, 'public')));

app.get('/api/search', async (req, res) => {
  const { q, location, employment_type, remote, page } = req.query;

  
});

app.listen(PORT, () => {
  console.log(`Job Finder running on http://localhost:${PORT}`);
});
