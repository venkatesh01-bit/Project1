const fs = require('fs');

async function test() {
  const url = 'https://www.homelane.com/sc-quotes-share/amR6dlJrYXY0UlhXSm8zbnZUb1B0cGhMM0pjWVpxKzU1RGlMTzN4SG5wTkEwdE5IUERiT2lUTkFPSSs5ZjNjRQ==?room=Kitchen';
  try {
    const resp = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9'
      }
    });
    console.log('Status:', resp.status);
    const html = await resp.text();
    fs.writeFileSync('homelane_response.html', html);
    console.log('HTML saved to homelane_response.html');
  } catch (err) {
    console.error('Error fetching:', err);
  }
}

test();
