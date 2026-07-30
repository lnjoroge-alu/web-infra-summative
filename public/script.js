const form = document.getElementById('search-form');
const statusDiv = document.getElementById('status');
const resultsDiv = document.getElementById('results');
const sortSelect = document.getElementById('sort-by');

sortSelect.addEventListener('change', showJobs);

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
  statusDiv.classList.remove('error');
  resultsDiv.innerHTML = '';

  try {
    const response = await fetch(`/api/search?${params}`);
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Something went wrong');
    }

    currentJobs = data.jobs || [];
    statusDiv.textContent = currentJobs.length
      ? `${currentJobs.length} jobs found`
      : 'No jobs found, try a different search';
    showJobs();
  } catch (err) {
    statusDiv.textContent = err.message === 'Failed to fetch'
      ? 'Could not reach the server, please try again'
      : err.message;
    statusDiv.classList.add('error');
  }
}

function showJobs() {
  resultsDiv.innerHTML = '';

  const jobs = [...currentJobs];
  if (sortSelect.value === 'date') {
    jobs.sort((a, b) => (b.job_posted_at_timestamp || 0) - (a.job_posted_at_timestamp || 0));
  }

  for (const job of jobs) {
    const card = document.createElement('div');
    card.className = 'job-card';

    const title = document.createElement('h2');
    title.textContent = job.job_title;

    const employer = document.createElement('p');
    employer.className = 'employer';
    employer.textContent = job.employer_name;

    const meta = document.createElement('p');
    meta.className = 'meta';
    const details = [job.job_location, job.job_employment_type, job.job_posted_at];
    meta.textContent = details.filter(Boolean).join(' | ');

    if (job.job_is_remote) {
      const badge = document.createElement('span');
      badge.className = 'badge';
      badge.textContent = 'Remote';
      meta.prepend(badge);
    }
    
    const description = document.createElement('p');
    description.className = 'description';
    description.textContent = `${(job.job_description || '').slice(0, 250)}...`;

    const apply = document.createElement('a');
    apply.className = 'apply';
    apply.href = job.job_apply_link;
    apply.target = '_blank';
    apply.rel = 'noopener';
    apply.textContent = 'Apply';

    card.append(title, employer, meta, description, apply);
    resultsDiv.appendChild(card);

  }
}
