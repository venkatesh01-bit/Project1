const { fetchUrlContent } = require('./scratch_route_mock.js');

// Mock route.js fetchUrlContent locally to verify
const fs = require('fs');
const path = require('path');

async function testFetch() {
  const url = 'https://www.homelane.com/sc-quotes-share/amR6dlJrYXY0UlhXSm8zbnZUb1B0cGhMM0pjWVpxKzU1RGlMTzN4SG5wTkEwdE5IUERiT2lUTkFPSSs5ZjNjRQ==?room=Kitchen';
  console.log("Testing scraper with URL:", url);
  try {
    // Read route.js and parse fetchUrlContent using eval or require a mock
    const content = fs.readFileSync(path.join(__dirname, 'app/api/analyze/route.js'), 'utf8');
    
    // Create a mini module file to run in node environment
    let code = content.substring(content.indexOf('async function fetchUrlContent'));
    code = code.substring(0, code.indexOf('export async function POST'));
    code = code + '\nmodule.exports = { fetchUrlContent };';
    
    fs.writeFileSync('scratch_route_mock.js', code);
    
    const { fetchUrlContent: testFn } = require('./scratch_route_mock.js');
    const result = await testFn(url);
    
    console.log("SUCCESS! Extracted Output preview:");
    console.log(result.slice(0, 1500));
    console.log("...\nTotal length:", result.length);
    
    // Clean up temporary script
    fs.unlinkSync('scratch_route_mock.js');
  } catch (err) {
    console.error("Scraper Test Failed:", err);
  }
}

testFetch();
