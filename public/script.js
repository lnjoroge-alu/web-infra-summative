const form = document.getElementById('search-form');
const statusDiv = document.getElementById('status');
const resultsDiv = document.getElementById('results');

let currentJobs = [];

form.addEventListener('submit', async (event) => {
  event.preventDefault();
  await searchJobs();
});



async function searchJobs() {
  
}
