const fs = require('fs');
const html = fs.readFileSync('./index.html', 'utf8');

const scriptMatch = html.match(/<script>([\s\S]*?)<\/script>/);
const scriptCode = scriptMatch[1];

// Create a sandbox execution
const { JSDOM } = (() => {
  // We can construct a minimal mock environment
  return {};
})();

// We can run the classes directly by evaluating in vm
const vm = require('vm');
const mockLocalStorage = {
  store: {},
  getItem(k) { return this.store[k] || null; },
  setItem(k, v) { this.store[k] = String(v); },
  removeItem(k) { delete this.store[k]; }
};

const sandbox = {
  localStorage: mockLocalStorage,
  window: {
    addEventListener: () => {}
  },
  document: {
    addEventListener: () => {},
    getElementById: () => ({
      addEventListener: () => {},
      classList: { add: () => {}, remove: () => {} },
      style: {},
      setAttribute: () => {}
    }),
    querySelectorAll: () => []
  },
  console
};

vm.createContext(sandbox);

// Wrap code so classes are exposed
vm.runInContext(scriptCode + `
  globalThis.Lexer = Lexer;
  globalThis.Parser = Parser;
  globalThis.Evaluator = Evaluator;
  globalThis.Environment = Environment;
  globalThis.Traversals = Traversals;
  globalThis.TACGenerator = TACGenerator;
`, sandbox);

const env = new sandbox.Environment();

function runTest(name, expr, expected, expectError = false) {
  try {
    const lexer = new sandbox.Lexer(expr);
    const tokens = lexer.tokenize();
    const parser = new sandbox.Parser(tokens);
    const ast = parser.parse();
    const evaluator = new sandbox.Evaluator(env);
    const { result, steps } = evaluator.evaluate(ast);

    if (expectError) {
      console.error(`FAIL: ${name} ('${expr}') expected error, but got result: ${result}`);
      return false;
    }

    if (Math.abs(result - expected) < 1e-6) {
      console.log(`PASS: ${name} ('${expr}') = ${result} (Steps: ${steps.length})`);
      return true;
    } else {
      console.error(`FAIL: ${name} ('${expr}') expected ${expected}, got ${result}`);
      return false;
    }
  } catch (err) {
    if (expectError) {
      console.log(`PASS (Expected Error): ${name} ('${expr}') -> [${err.name}] ${err.message}`);
      return true;
    } else {
      console.error(`FAIL: ${name} ('${expr}') unexpected error: [${err.name}] ${err.message}`);
      return false;
    }
  }
}

console.log("================== COMPILER LAB TEST SUITE ==================");
let allPassed = true;
allPassed = runTest("Basic Precedence", "3 + 4 * 2", 11) && allPassed;
allPassed = runTest("Parentheses", "(3+4)*2", 14) && allPassed;
allPassed = runTest("Right-Associative Power", "2^3^2", 512) && allPassed;
allPassed = runTest("Unary with Power", "-2^2", -4) && allPassed;
allPassed = runTest("Division Float", "10 / 4", 2.5) && allPassed;
allPassed = runTest("Modulo", "10 % 3", 1) && allPassed;
allPassed = runTest("Built-in Functions", "sqrt(16) + abs(-3)", 7) && allPassed;
allPassed = runTest("Variable Assignment", "x = 5", 5) && allPassed;
allPassed = runTest("Variable Lookup", "x * 2", 10) && allPassed;
allPassed = runTest("Division by Zero Error", "5 / 0", 0, true) && allPassed;
allPassed = runTest("Syntax Error", "3 + * 4", 0, true) && allPassed;
allPassed = runTest("Missing Parenthesis Error", "(2 + 3", 0, true) && allPassed;
allPassed = runTest("Unknown Function Error", "foo(2)", 0, true) && allPassed;

// Additional comprehensive checks
allPassed = runTest("Complex Expression", "sin(pi/2) + 2^3^2", 513) && allPassed;
allPassed = runTest("Negative and Functions", "-5 + sqrt(16)", -1) && allPassed;
allPassed = runTest("Multi-arg Function", "min(10, 4, 8) + max(1, 9)", 13) && allPassed;
allPassed = runTest("Decimal Numbers", "3.5 * 2 + .5", 7.5) && allPassed;
allPassed = runTest("Modulo zero error", "10 % 0", 0, true) && allPassed;
allPassed = runTest("Negative sqrt error", "sqrt(-9)", 0, true) && allPassed;
allPassed = runTest("Invalid char error", "5 # 2", 0, true) && allPassed;

console.log("=============================================================");
console.log(allPassed ? "ALL 20 TEST CASES PASSED SUCCESSFULLY!" : "FAILURES DETECTED!");
if (!allPassed) process.exit(1);
