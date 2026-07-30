const form = document.getElementById('search-form');
const statusDiv = document.getElementById('status');
const resultsDiv = document.getElementById('results');

let currentJobs = [];

form.addEventListener('submit', async (event) => {
  event.preventDefault();
  await searchJobs();
});



async function searchJobs() {
  const queryTerm = document.getElementById('query').value.trim();
  const location = document.getElementById('location').value.trim();
  const employmentType = document.getElementById('employment-type').value;
  const remoteOnly = document.getElementById('remote-only').checked;

  const params = new URLSearchParams({ queryTerm });
  if (location) params.set('location', location);
  if (employmentType) params.set('employment_type', employmentType);
  if (remoteOnly) params.set('remote', 'true');

  statusDiv.textContent = 'Searching...';
  resultsDiv.innerHTML = '';

  const response = await fetch(`/api/search?${params}`);
  const data = await response.json();
  currentJobs = data.jobs || [];

  statusDiv.textContent = `${currentJobs.length} jobs found`;
  showJobs();
}

function showJobs() {
  resultsDiv.innerHTML = '';

  for (const job of currentJobs) {
    const card = document.createElement('div');
    card.className = 'job-card';

    const title = document.createElement('h2');
    title.textContent = job.job_title;

    
  }
}
