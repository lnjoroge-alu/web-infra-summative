require('dotenv').config();
const express = require('express');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

const cache = new Map();
const CACHE_TTL = 10 * 60 * 1000;

app.use(express.static(path.join(__dirname, 'public')));

app.get('/api/search', async (req, res) => {
  const { queryTerm, location, employment_type, remote } = req.query;

  if (!queryTerm) {
    return res.status(400).json({ error: 'Missing search query' });
  }

  const query = location ? `${queryTerm} in ${location}` : queryTerm;
  const params = new URLSearchParams({ query, num_pages: '1' });
  if (employment_type) params.set('employment_types', employment_type);
  if (remote === 'true') params.set('work_from_home', 'true');

  const cacheKey = params.toString();
  const cached = cache.get(cacheKey);
  if (cached && Date.now() - cached.time < CACHE_TTL) {
    return res.json({ jobs: cached.jobs });
  }

  try {
    const response = await fetch(`https://${process.env.RAPIDAPI_HOST}/search-v2?${params}`, {
      headers: {
        'X-RapidAPI-Key': process.env.RAPIDAPI_KEY,
        'X-RapidAPI-Host': process.env.RAPIDAPI_HOST
      }
    });
    
    if (!response.ok) {
      return res.status(502).json({ error: `Job API returned status ${response.status}` });
    }

    const data = await response.json();
    const results = data.data ? data.data.jobs : [];
    cache.set(cacheKey, { jobs: results || [], time: Date.now() });
    res.json({ jobs: results || [] });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Could not reach the job API' });
  }
  
});

app.get('/api/salary', async (req, res) => {
  const { job_title, location } = req.query;

  if (!job_title) {
    return res.status(400).json({ error: 'Missing job title' });
  }

  const params = new URLSearchParams({ job_title });
  if (location) params.set('location', location);

  const cacheKey = `salary:${params.toString()}`;
  const cached = cache.get(cacheKey);
  if (cached && Date.now() - cached.time < CACHE_TTL) {
    return res.json({ salary: cached.salary });
  }

  try {
    const response = await fetch(`https://${process.env.RAPIDAPI_HOST}/estimated-salary?${params}`, {
      headers: {
        'X-RapidAPI-Key': process.env.RAPIDAPI_KEY,
        'X-RapidAPI-Host': process.env.RAPIDAPI_HOST
      }
    });

    if (!response.ok) {
      return res.status(502).json({ error: `Salary API returned status ${response.status}` });
    }

    const data = await response.json();
    const salary = data.data && data.data.length ? data.data[0] : null;
    cache.set(cacheKey, { salary, time: Date.now() });
    res.json({ salary });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Could not reach the salary API' });
  }
});

app.listen(PORT, () => {
  console.log(`Job Finder running on http://localhost:${PORT}`);
});
