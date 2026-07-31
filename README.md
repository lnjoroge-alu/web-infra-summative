# Job Finder

A web application for searching real job and internship listings from across the web. Built for the ALU Web Infrastructure summative assignment.

Searching for a job usually means checking many different sites. Job Finder solves that by using the [JSearch API](https://rapidapi.com/letscrape-6bRBa3QguO5/api/jsearch), which aggregates listings from Google for Jobs (LinkedIn, Indeed, Glassdoor, Workday and many more), and presenting them in one clean, searchable interface.

## Features

- Search jobs by title/keywords and optional location
- Filter by employment type (full-time, part-time, internship, contract)
- Filter for remote-only positions
- Sort results by relevance or newest first (client-side, no extra API calls)
- Salary insights: when you search with a location, a panel shows the typical pay for that role there (median, range, currency and source), powered by real reported salaries
- Graceful error handling: friendly messages for empty results, API failures and network problems
- Server-side caching: identical searches and salary lookups within 10 minutes are answered from cache, saving API quota and returning in milliseconds

## How it works


The Express server does two jobs: it serves the frontend, and it proxies requests to JSearch through two routes — `/api/search` (job listings, JSearch `/search-v2`) and `/api/salary` (salary estimates, JSearch `/estimated-salary`). The API key lives only on the server in a `.env` file (never in the repository or the browser), which keeps it secure.

## Running locally

Requirements: Node.js 18 or newer.

1. Clone the repository:

   ```bash
   git clone https://github.com/lnjoroge-alu/web-infra-summative.git
   cd web-infra-summative
   ```

2. Install dependencies:

   ```bash
   npm install
   ```

3. Create your environment file:

   ```bash
   cp .env.example .env
   ```

   Then edit `.env` and set your own RapidAPI key (get one by subscribing to [JSearch on RapidAPI](https://rapidapi.com/letscrape-6bRBa3QguO5/api/jsearch)):

   ```
   RAPIDAPI_KEY=your_key_here
   RAPIDAPI_HOST=jsearch.p.rapidapi.com
   PORT=3000
   ```

4. Start the server:

   ```bash
   npm start
   ```

5. Open http://localhost:3000 in your browser, type a job title (e.g. "software developer"), optionally a location (e.g. "Kigali"), and hit Search. Include a location to also see the salary insights panel above the results.

## API used

- [JSearch](https://rapidapi.com/letscrape-6bRBa3QguO5/api/jsearch) by letscrape, via RapidAPI. Two endpoints are used: `/search-v2` for job listings and `/estimated-salary` for salary data (sourced from Glassdoor and other publishers). Credit to the JSearch developers for the data. Official docs are on the RapidAPI page linked above.

## Security notes

- The API key is read from `.env`, which is gitignored — it is never committed or exposed to the browser.
- Job data from the API is rendered with `textContent` (never `innerHTML`), so a malicious job posting cannot inject scripts into the page (XSS protection).


## Challenges

- The JSearch v5 API moved its search endpoint from `/search` to `/search-v2` and changed pagination from page numbers to cursors. The first requests returned 403/errors until I read the current docs on RapidAPI and updated the endpoint.
- The v2 response nests results one level deeper (`data.jobs`) than v1, which briefly produced a `jobs.jobs` structure in our own response until I unwrapped it on the server.
- Cold JSearch queries can take over 15 seconds; the 10-minute cache reduces repeat searches to a few milliseconds.
- I initially considered a separate salary API from RapidAPI, but its documentation was poor (the advertised endpoint returned 404). I discovered our existing JSearch subscription already includes an `/estimated-salary` endpoint, which kept the app on a single well-documented API and one key.

## Credits

- Job data: [JSearch API](https://rapidapi.com/letscrape-6bRBa3QguO5/api/jsearch) by letscrape (via RapidAPI)
- Built with [Express](https://expressjs.com/) and [dotenv](https://github.com/motdotla/dotenv)
