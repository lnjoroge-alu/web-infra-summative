# Job Finder

A web application for searching real job and internship listings from across the web. Built for the ALU Web Infrastructure summative assignment.

Searching for a job usually means checking many different sites. Job Finder solves that by using the [JSearch API](https://rapidapi.com/letscrape-6bRBa3QguO5/api/jsearch), which aggregates listings from Google for Jobs (LinkedIn, Indeed, Glassdoor, Workday and many more), and presenting them in one clean, searchable interface.

## Assignment Resources

- **Demo video:** [Link to Demo Video](https://youtu.be/GmpPV6DcPp4)
- **Deployed app:** [https://www.lnjoroge.tech](https://www.lnjoroge.tech)

| Server | Address |
| ------ | ------- |
| Web 01 | http://3.83.175.36/ |
| Web 02 | http://13.222.150.198/ |
| LB 01  | http://18.204.196.251/ |

## Features

- Search jobs by title/keywords and optional location
- Filter by employment type (full-time, part-time, internship, contract)
- Filter for remote-only positions
- Sort results by relevance or newest first (client-side, no extra API calls)
- Salary insights: when you search with a location, a panel shows the typical pay for that role there (median, range, currency and source), powered by real reported salaries
- Graceful error handling: friendly messages for empty results, API failures and network problems
- Server-side caching: identical searches and salary lookups within 10 minutes are answered from cache, saving API quota and returning in milliseconds

## How it works


The Express server does two jobs: it serves the frontend, and it proxies requests to JSearch through two routes - `/api/search` (job listings, JSearch `/search-v2`) and `/api/salary` (salary estimates, JSearch `/estimated-salary`). The API key lives only on the server in a `.env` file (never in the repository or the browser), which keeps it secure.

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

- The API key is read from `.env`, which is gitignored - it is never committed or exposed to the browser.
- Job data from the API is rendered with `textContent` (never `innerHTML`), so a malicious job posting cannot inject scripts into the page (XSS protection).



## Deployment (Part Two)

The app runs on two web servers (web-01, web-02) behind a HAProxy load balancer (lb-01). Live at https://www.lnjoroge.tech.

```
Browser ──► lb-01 (HAProxy, HTTPS termination + round robin)
              ├──► web-01 (nginx :80 ──► node :3000)
              └──► web-02 (nginx :80 ──► node :3000)
```

### Web servers (same steps on web-01 and web-02)

1. Install Node.js 20 and git:

   ```bash
   sudo apt-get install -y nodejs git
   ```

2. Clone the app and install dependencies:

   ```bash
   git clone https://github.com/lnjoroge-alu/web-infra-summative.git /home/ubuntu/job-finder
   cd /home/ubuntu/job-finder && npm install
   ```

3. Copy the `.env` from the local machine (the key is not in git, so it is transferred separately over SSH) and lock its permissions:

   ```bash
   ssh web-01 "cat > /home/ubuntu/job-finder/.env" < .env
   ssh web-01 "chmod 600 /home/ubuntu/job-finder/.env"
   ```

4. Run the app as a systemd service so it starts on boot and restarts on crashes. `/etc/systemd/system/job-finder.service`:

   ```ini
   [Unit]
   Description=Job Finder app
   After=network.target

   [Service]
   User=ubuntu
   WorkingDirectory=/home/ubuntu/job-finder
   ExecStart=/usr/bin/node server.js
   Restart=on-failure

   [Install]
   WantedBy=multi-user.target
   ```

   ```bash
   sudo systemctl daemon-reload
   sudo systemctl enable job-finder
   sudo systemctl start job-finder
   ```

5. Configure nginx as a reverse proxy: port 80 forwards to the Node app on localhost:3000, keeping the `X-Served-By` header that identifies which server answered. In `/etc/nginx/sites-available/default` (original backed up as `default.bak`):

   ```nginx
   server {
       listen 80;
       listen [::]:80 default_server;
       add_header X-Served-By 7119-web-01;   # 7119-web-02 on web-02

       location / {
           proxy_pass http://127.0.0.1:3000;
           proxy_set_header Host $host;
           proxy_set_header X-Real-IP $remote_addr;
       }
   }
   ```

   ```bash
   sudo nginx -t && sudo systemctl reload nginx
   ```

### Load balancer (lb-01)

HAProxy was already configured (from earlier infrastructure work) to balance port 80/443 across both web servers with round robin and health checks, and to terminate HTTPS with a Let's Encrypt certificate for www.lnjoroge.tech, redirecting all HTTP to HTTPS. Because it balances at the HTTP level generically, deploying the new app required no HAProxy changes. The relevant config in `/etc/haproxy/haproxy.cfg`:

```
listen balancer
    bind :80
    bind *:443 ssl crt /etc/letsencrypt/live/www.lnjoroge.tech/lnjoroge.pem
    http-request redirect scheme https code 301 unless { ssl_fc }
    balance roundrobin
    server web-01 3.83.175.36:80 check
    server web-02 13.222.150.198:80 check
```

### Verifying the load balancing

Each web server adds its own `X-Served-By` header, so repeated requests through the load balancer show the traffic alternating:

```bash
$ 	curl -Is https://www.lnjoroge.tech
x-served-by: 7119-web-02
x-served-by: 7119-web-01

```

Both API routes were also verified end-to-end through the load balancer (`/api/search` and `/api/salary` return HTTP 200 with live data).

## Challenges

- The JSearch v5 API moved its search endpoint from `/search` to `/search-v2` and changed pagination from page numbers to cursors. The first requests returned 403/errors until I read the current docs on RapidAPI and updated the endpoint.
- The v2 response nests results one level deeper (`data.jobs`) than v1, which briefly produced a `jobs.jobs` structure in our own response until I unwrapped it on the server.
- Cold JSearch queries can take over 15 seconds; the 10-minute cache reduces repeat searches to a few milliseconds.
- I initially considered a separate salary API from RapidAPI, but its documentation was poor (the advertised endpoint returned 404). I discovered our existing JSearch subscription already includes an `/estimated-salary` endpoint, which kept the app on a single well-documented API and one key.
- During deployment, the first test through the load balancer returned an unexpected 301 redirect. It turned out lb-01 was already terminating HTTPS (Let's Encrypt certificate from earlier infrastructure work) and redirecting all HTTP to HTTPS - the app simply had to be tested over `https://`, and no load balancer changes were needed at all.
- `scp` to the web servers kept failing with "Connection closed", so the `.env` was transferred by streaming it over a plain SSH pipe instead (`ssh web-01 "cat > .env" < .env`).

## Credits

- Job data: [JSearch API](https://rapidapi.com/letscrape-6bRBa3QguO5/api/jsearch) by letscrape (via RapidAPI)
- Built with [Express](https://expressjs.com/) and [dotenv](https://github.com/motdotla/dotenv)
