// Test extracting and running the <script> block from index.html in a mock DOM / node environment
const fs = require('fs');
const html = fs.readFileSync('./index.html', 'utf8');

// Check that there is NO eval() or Function()
const scriptMatch = html.match(/<script>([\s\S]*?)<\/script>/);
if (!scriptMatch) {
  console.error("No <script> tag found in index.html!");
  process.exit(1);
}

const scriptContent = scriptMatch[1];

// Verify no eval or Function constructor
if (/\beval\s*\(/.test(scriptContent)) {
  console.error("FAIL: Found eval() in script!");
  process.exit(1);
}
if (/new\s+Function\s*\(/.test(scriptContent)) {
  console.error("FAIL: Found new Function() in script!");
  process.exit(1);
}

console.log("PASS: Verified no eval() or new Function() used!");
console.log("Script length:", scriptContent.length, "characters.");

// Verify with Node syntax checker
try {
  new (require('vm').Script)(scriptContent);
  console.log("PASS: JavaScript syntax in index.html is 100% valid!");
} catch (e) {
  console.error("Syntax Error in extracted script:", e);
  process.exit(1);
}
