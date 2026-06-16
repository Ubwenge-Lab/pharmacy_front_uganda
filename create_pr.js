const fs = require('fs');

async function createPR() {
  const url = fs.readFileSync('token.txt', 'utf8').trim();
  const tokenMatch = url.match(/https:\/\/(github_pat_[^@]+)@/);
  
  if (!tokenMatch) {
    console.error('Token not found in URL');
    return;
  }
  
  const token = tokenMatch[1];
  
  const data = {
    title: "feat: standardize currency formatting to RWF globally",
    body: "Please review these changes to standardize currency across all dashboards and replace hardcoded symbols with the reusable formatCurrency utility.",
    head: "fix/standardize-currency-rwf",
    base: "dev"
  };

  const response = await fetch('https://api.github.com/repos/Ubwenge-Lab/pharmacy_front/pulls', {
    method: 'POST',
    headers: {
      'Authorization': 'Bearer ' + token,
      'Accept': 'application/vnd.github.v3+json',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(data)
  });

  const body = await response.json();
  console.log('Status code:', response.status);
  if (response.ok) {
    console.log('Success! PR created at:', body.html_url);
  } else {
    console.error('Error creating PR:', body);
  }
}

createPR();
