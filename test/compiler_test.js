// =============================================================================
// COMPILER CORE ENGINE - TEST & VERIFICATION SCRIPT
// =============================================================================

// --- TOKEN TYPES ---
const TokenType = {
  NUMBER: 'NUMBER',
  IDENT: 'IDENT',
  PLUS: 'PLUS',
  MINUS: 'MINUS',
  MULTIPLY: 'MULTIPLY',
  DIVIDE: 'DIVIDE',
  MODULO: 'MODULO',
  POWER: 'POWER',
  ASSIGN: 'ASSIGN',
  LPAREN: 'LPAREN',
  RPAREN: 'RPAREN',
  COMMA: 'COMMA',
  EOF: 'EOF'
};

// --- CUSTOM ERROR CLASSES ---
class CompilerError extends Error {
  constructor(message, position = null, phase = 'Compiler') {
    super(message);
    this.name = phase + 'Error';
    this.position = position;
    this.phase = phase;
  }
}

class LexicalError extends CompilerError {
  constructor(message, position) {
    super(message, position, 'Lexical');
  }
}

class SyntaxErrorCustom extends CompilerError {
  constructor(message, position) {
    super(message, position, 'Syntax');
  }
}

class RuntimeErrorCustom extends CompilerError {
  constructor(message) {
    super(message, null, 'Runtime');
  }
}

// =============================================================================
// PHASE 1: LEXER (LEXICAL ANALYZER)
// =============================================================================
class Token {
  constructor(type, value, position, length = 1) {
    this.type = type;
    this.value = value;
    this.position = position;
    this.length = length;
  }
}

class Lexer {
  constructor(input) {
    this.input = input;
    this.cursor = 0;
    this.length = input.length;
  }

  peek() {
    return this.cursor < this.length ? this.input[this.cursor] : null;
  }

  advance() {
    return this.cursor < this.length ? this.input[this.cursor++] : null;
  }

  skipWhitespace() {
    while (this.cursor < this.length && /\s/.test(this.input[this.cursor])) {
      this.cursor++;
    }
  }

  tokenize() {
    const tokens = [];

    while (this.cursor < this.length) {
      this.skipWhitespace();
      if (this.cursor >= this.length) break;

      const startPos = this.cursor;
      const char = this.peek();

      // Numbers: integers, decimals (e.g. 123, 3.14, .5)
      if (/\d/.test(char) || (char === '.' && this.cursor + 1 < this.length && /\d/.test(this.input[this.cursor + 1]))) {
        let numStr = '';
        let hasDot = false;

        while (this.cursor < this.length) {
          const c = this.peek();
          if (/\d/.test(c)) {
            numStr += this.advance();
          } else if (c === '.') {
            if (hasDot) {
              throw new LexicalError(`Malformed number with multiple decimal points at position ${this.cursor}`, this.cursor);
            }
            hasDot = true;
            numStr += this.advance();
          } else {
            break;
          }
        }
        tokens.push(new Token(TokenType.NUMBER, parseFloat(numStr), startPos, numStr.length));
        continue;
      }

      // Identifiers: variables or functions ([a-zA-Z_][a-zA-Z0-9_]*)
      if (/[a-zA-Z_]/.test(char)) {
        let ident = '';
        while (this.cursor < this.length && /[a-zA-Z0-9_]/.test(this.peek())) {
          ident += this.advance();
        }
        tokens.push(new Token(TokenType.IDENT, ident, startPos, ident.length));
        continue;
      }

      // Operators and Delimiters
      switch (char) {
        case '+':
          this.advance();
          tokens.push(new Token(TokenType.PLUS, '+', startPos, 1));
          break;
        case '-':
          this.advance();
          tokens.push(new Token(TokenType.MINUS, '-', startPos, 1));
          break;
        case '*':
          this.advance();
          tokens.push(new Token(TokenType.MULTIPLY, '*', startPos, 1));
          break;
        case '/':
          this.advance();
          tokens.push(new Token(TokenType.DIVIDE, '/', startPos, 1));
          break;
        case '%':
          this.advance();
          tokens.push(new Token(TokenType.MODULO, '%', startPos, 1));
          break;
        case '^':
          this.advance();
          tokens.push(new Token(TokenType.POWER, '^', startPos, 1));
          break;
        case '=':
          this.advance();
          tokens.push(new Token(TokenType.ASSIGN, '=', startPos, 1));
          break;
        case '(':
          this.advance();
          tokens.push(new Token(TokenType.LPAREN, '(', startPos, 1));
          break;
        case ')':
          this.advance();
          tokens.push(new Token(TokenType.RPAREN, ')', startPos, 1));
          break;
        case ',':
          this.advance();
          tokens.push(new Token(TokenType.COMMA, ',', startPos, 1));
          break;
        default:
          throw new LexicalError(`Invalid character '${char}' at position ${startPos}`, startPos);
      }
    }

    tokens.push(new Token(TokenType.EOF, 'EOF', this.cursor, 0));
    return tokens;
  }
}

// =============================================================================
// PHASE 2: PARSER & AST (SYNTAX ANALYSIS)
// =============================================================================
let nodeIdCounter = 0;
function nextNodeId() {
  return `node_${++nodeIdCounter}`;
}

class ASTNode {
  constructor(type, position) {
    this.id = nextNodeId();
    this.type = type;
    this.position = position;
  }
}

class NumberNode extends ASTNode {
  constructor(value, position) {
    super('Number', position);
    this.value = value;
  }
}

class VariableNode extends ASTNode {
  constructor(name, position) {
    super('Variable', position);
    this.name = name;
  }
}

class BinaryOpNode extends ASTNode {
  constructor(op, left, right, position) {
    super('BinaryOp', position);
    this.op = op;
    this.left = left;
    this.right = right;
  }
}

class UnaryOpNode extends ASTNode {
  constructor(op, operand, position) {
    super('UnaryOp', position);
    this.op = op;
    this.operand = operand;
  }
}

class FunctionCallNode extends ASTNode {
  constructor(name, args, position) {
    super('FunctionCall', position);
    this.name = name;
    this.args = args;
  }
}

class AssignNode extends ASTNode {
  constructor(name, value, position) {
    super('Assign', position);
    this.name = name;
    this.value = value;
  }
}

class Parser {
  constructor(tokens) {
    this.tokens = tokens;
    this.current = 0;
  }

  peek(offset = 0) {
    const idx = this.current + offset;
    return idx < this.tokens.length ? this.tokens[idx] : this.tokens[this.tokens.length - 1];
  }

  match(...types) {
    const token = this.peek();
    if (types.includes(token.type)) {
      this.current++;
      return token;
    }
    return null;
  }

  consume(type, expectedMsg) {
    const token = this.peek();
    if (token.type === type) {
      this.current++;
      return token;
    }
    throw new SyntaxErrorCustom(
      expectedMsg || `Expected '${type}' at position ${token.position}, found '${token.value}'`,
      token.position
    );
  }

  parse() {
    nodeIdCounter = 0;
    const stmt = this.statement();
    if (this.peek().type !== TokenType.EOF) {
      const tok = this.peek();
      throw new SyntaxErrorCustom(`Unexpected token '${tok.value}' at position ${tok.position}`, tok.position);
    }
    return stmt;
  }

  // statement → IDENT '=' expr | expr
  statement() {
    if (this.peek(0).type === TokenType.IDENT && this.peek(1).type === TokenType.ASSIGN) {
      const identTok = this.consume(TokenType.IDENT);
      this.consume(TokenType.ASSIGN);
      const exprNode = this.expr();
      return new AssignNode(identTok.value, exprNode, identTok.position);
    }
    return this.expr();
  }

  // expr → term (('+' | '-') term)*
  expr() {
    let left = this.term();
    let opToken;
    while ((opToken = this.match(TokenType.PLUS, TokenType.MINUS))) {
      const right = this.term();
      left = new BinaryOpNode(opToken.value, left, right, opToken.position);
    }
    return left;
  }

  // term → unary (('*' | '/' | '%') unary)*
  term() {
    let left = this.unary();
    let opToken;
    while ((opToken = this.match(TokenType.MULTIPLY, TokenType.DIVIDE, TokenType.MODULO))) {
      const right = this.unary();
      left = new BinaryOpNode(opToken.value, left, right, opToken.position);
    }
    return left;
  }

  // unary → ('-' | '+') unary | factor
  unary() {
    const opToken = this.match(TokenType.PLUS, TokenType.MINUS);
    if (opToken) {
      const operand = this.unary();
      return new UnaryOpNode(opToken.value, operand, opToken.position);
    }
    return this.factor();
  }

  // factor → primary ('^' unary)?    (right-associative)
  factor() {
    const left = this.primary();
    if (this.match(TokenType.POWER)) {
      const opToken = this.tokens[this.current - 1];
      const right = this.unary();
      return new BinaryOpNode('^', left, right, opToken.position);
    }
    return left;
  }

  // primary → NUMBER | IDENT | IDENT '(' args ')' | '(' expr ')'
  primary() {
    const token = this.peek();

    if (this.match(TokenType.NUMBER)) {
      return new NumberNode(token.value, token.position);
    }

    if (this.match(TokenType.IDENT)) {
      // Function call check
      if (this.match(TokenType.LPAREN)) {
        const args = [];
        if (this.peek().type !== TokenType.RPAREN) {
          while (true) {
            args.push(this.expr());
            if (this.match(TokenType.COMMA)) {
              continue;
            }
            break;
          }
        }
        this.consume(TokenType.RPAREN, `Expected ')' after function arguments at position ${this.peek().position}`);
        return new FunctionCallNode(token.value, args, token.position);
      }
      return new VariableNode(token.value, token.position);
    }

    if (this.match(TokenType.LPAREN)) {
      const node = this.expr();
      this.consume(TokenType.RPAREN, `Expected ')' at position ${this.peek().position}`);
      return node;
    }

    if (token.type === TokenType.EOF) {
      throw new SyntaxErrorCustom(`Unexpected end of expression at position ${token.position}`, token.position);
    }

    throw new SyntaxErrorCustom(
      `Unexpected token '${token.value}' at position ${token.position}. Expected number, identifier, or '('`,
      token.position
    );
  }
}

// =============================================================================
// PHASE 3: EVALUATOR (SEMANTIC ANALYSIS & EXECUTION)
// =============================================================================
class Environment {
  constructor() {
    this.variables = new Map();
    // Default mathematical constants
    this.variables.set('pi', Math.PI);
    this.variables.set('e', Math.E);
  }

  get(name) {
    if (this.variables.has(name)) {
      return this.variables.get(name);
    }
    throw new RuntimeErrorCustom(`Undefined variable '${name}'`);
  }

  set(name, value) {
    this.variables.set(name, value);
    return value;
  }

  has(name) {
    return this.variables.has(name);
  }

  reset() {
    this.variables.clear();
    this.variables.set('pi', Math.PI);
    this.variables.set('e', Math.E);
  }
}

const BUILT_IN_FUNCTIONS = {
  sin: {
    fn: (x) => Math.sin(x),
    minArgs: 1,
    maxArgs: 1
  },
  cos: {
    fn: (x) => Math.cos(x),
    minArgs: 1,
    maxArgs: 1
  },
  tan: {
    fn: (x) => Math.tan(x),
    minArgs: 1,
    maxArgs: 1
  },
  sqrt: {
    fn: (x) => {
      if (x < 0) throw new RuntimeErrorCustom(`Cannot compute square root of negative number: ${x}`);
      return Math.sqrt(x);
    },
    minArgs: 1,
    maxArgs: 1
  },
  abs: {
    fn: (x) => Math.abs(x),
    minArgs: 1,
    maxArgs: 1
  },
  log: {
    fn: (x) => {
      if (x <= 0) throw new RuntimeErrorCustom(`Logarithm base 10 undefined for non-positive number: ${x}`);
      return Math.log10(x);
    },
    minArgs: 1,
    maxArgs: 1
  },
  ln: {
    fn: (x) => {
      if (x <= 0) throw new RuntimeErrorCustom(`Natural logarithm undefined for non-positive number: ${x}`);
      return Math.log(x);
    },
    minArgs: 1,
    maxArgs: 1
  },
  exp: {
    fn: (x) => Math.exp(x),
    minArgs: 1,
    maxArgs: 1
  },
  floor: {
    fn: (x) => Math.floor(x),
    minArgs: 1,
    maxArgs: 1
  },
  ceil: {
    fn: (x) => Math.ceil(x),
    minArgs: 1,
    maxArgs: 1
  },
  round: {
    fn: (x) => Math.round(x),
    minArgs: 1,
    maxArgs: 1
  },
  min: {
    fn: (...args) => Math.min(...args),
    minArgs: 1,
    maxArgs: Infinity
  },
  max: {
    fn: (...args) => Math.max(...args),
    minArgs: 1,
    maxArgs: Infinity
  },
  pow: {
    fn: (b, e) => Math.pow(b, e),
    minArgs: 2,
    maxArgs: 2
  }
};

class Evaluator {
  constructor(env) {
    this.env = env || new Environment();
    this.steps = [];
  }

  evaluate(ast) {
    this.steps = [];
    const result = this.evalNode(ast);
    return {
      result,
      steps: this.steps
    };
  }

  evalNode(node) {
    switch (node.type) {
      case 'Number': {
        this.recordStep(node, `${node.value}`, node.value);
        return node.value;
      }

      case 'Variable': {
        const val = this.env.get(node.name);
        this.recordStep(node, `${node.name} (${val})`, val);
        return val;
      }

      case 'Assign': {
        const val = this.evalNode(node.value);
        this.env.set(node.name, val);
        this.recordStep(node, `${node.name} = ${val}`, val);
        return val;
      }

      case 'UnaryOp': {
        const operandVal = this.evalNode(node.operand);
        let res;
        if (node.op === '+') {
          res = +operandVal;
        } else if (node.op === '-') {
          res = -operandVal;
        } else {
          throw new RuntimeErrorCustom(`Unknown unary operator: ${node.op}`);
        }
        res = this.formatFloat(res);
        this.recordStep(node, `${node.op}(${operandVal})`, res);
        return res;
      }

      case 'BinaryOp': {
        const leftVal = this.evalNode(node.left);
        const rightVal = this.evalNode(node.right);
        let res;
        switch (node.op) {
          case '+':
            res = leftVal + rightVal;
            break;
          case '-':
            res = leftVal - rightVal;
            break;
          case '*':
            res = leftVal * rightVal;
            break;
          case '/':
            if (rightVal === 0) throw new RuntimeErrorCustom('Division by zero');
            res = leftVal / rightVal;
            break;
          case '%':
            if (rightVal === 0) throw new RuntimeErrorCustom('Modulo by zero');
            res = leftVal % rightVal;
            break;
          case '^':
            res = Math.pow(leftVal, rightVal);
            break;
          default:
            throw new RuntimeErrorCustom(`Unknown binary operator: ${node.op}`);
        }
        res = this.formatFloat(res);
        this.recordStep(node, `${leftVal} ${node.op} ${rightVal}`, res);
        return res;
      }

      case 'FunctionCall': {
        const fnDef = BUILT_IN_FUNCTIONS[node.name.toLowerCase()];
        if (!fnDef) {
          throw new RuntimeErrorCustom(`Unknown function '${node.name}'`);
        }
        const evaluatedArgs = node.args.map(arg => this.evalNode(arg));
        if (evaluatedArgs.length < fnDef.minArgs) {
          throw new RuntimeErrorCustom(
            `Function '${node.name}' expects at least ${fnDef.minArgs} argument(s), but got ${evaluatedArgs.length}`
          );
        }
        if (evaluatedArgs.length > fnDef.maxArgs) {
          throw new RuntimeErrorCustom(
            `Function '${node.name}' expects at most ${fnDef.maxArgs} argument(s), but got ${evaluatedArgs.length}`
          );
        }
        let res = fnDef.fn(...evaluatedArgs);
        res = this.formatFloat(res);
        this.recordStep(node, `${node.name}(${evaluatedArgs.join(', ')})`, res);
        return res;
      }

      default:
        throw new RuntimeErrorCustom(`Unknown AST node type: ${node.type}`);
    }
  }

  recordStep(node, description, result) {
    this.steps.push({
      stepNumber: this.steps.length + 1,
      nodeId: node.id,
      nodeType: node.type,
      description,
      result
    });
  }

  formatFloat(val) {
    if (typeof val !== 'number') return val;
    if (Number.isInteger(val)) return val;
    // Fix floating point precision artifacts like 0.1 + 0.2 = 0.30000000000000004
    return parseFloat(val.toFixed(10));
  }
}

// =============================================================================
// PHASE 4: TRAVERSALS
// =============================================================================
class Traversals {
  static inorder(node) {
    if (!node) return '';
    switch (node.type) {
      case 'Number': return String(node.value);
      case 'Variable': return node.name;
      case 'Assign': return `${node.name} = ${Traversals.inorder(node.value)}`;
      case 'UnaryOp': return `(${node.op}${Traversals.inorder(node.operand)})`;
      case 'BinaryOp': return `(${Traversals.inorder(node.left)} ${node.op} ${Traversals.inorder(node.right)})`;
      case 'FunctionCall': return `${node.name}(${node.args.map(a => Traversals.inorder(a)).join(', ')})`;
      default: return '';
    }
  }

  static preorder(node) {
    if (!node) return '';
    switch (node.type) {
      case 'Number': return String(node.value);
      case 'Variable': return node.name;
      case 'Assign': return `= ${node.name} ${Traversals.preorder(node.value)}`;
      case 'UnaryOp': return `${node.op} ${Traversals.preorder(node.operand)}`;
      case 'BinaryOp': return `${node.op} ${Traversals.preorder(node.left)} ${Traversals.preorder(node.right)}`;
      case 'FunctionCall': return `${node.name} ${node.args.map(a => Traversals.preorder(a)).join(' ')}`;
      default: return '';
    }
  }

  static postorder(node) {
    if (!node) return '';
    switch (node.type) {
      case 'Number': return String(node.value);
      case 'Variable': return node.name;
      case 'Assign': return `${Traversals.postorder(node.value)} ${node.name} =`;
      case 'UnaryOp': return `${Traversals.postorder(node.operand)} ${node.op}`;
      case 'BinaryOp': return `${Traversals.postorder(node.left)} ${Traversals.postorder(node.right)} ${node.op}`;
      case 'FunctionCall': return `${node.args.map(a => Traversals.postorder(a)).join(' ')} ${node.name}()`;
      default: return '';
    }
  }
}

// =============================================================================
// PHASE 5: THREE-ADDRESS CODE (TAC) GENERATOR
// =============================================================================
class TACGenerator {
  constructor() {
    this.tempCounter = 0;
    this.instructions = [];
  }

  newTemp() {
    return `t${++this.tempCounter}`;
  }

  generate(ast) {
    this.tempCounter = 0;
    this.instructions = [];
    const finalPlace = this.genNode(ast);
    return {
      instructions: this.instructions,
      finalPlace
    };
  }

  genNode(node) {
    switch (node.type) {
      case 'Number':
        return String(node.value);

      case 'Variable':
        return node.name;

      case 'Assign': {
        const valPlace = this.genNode(node.value);
        this.instructions.push({
          target: node.name,
          op: '=',
          arg1: valPlace,
          arg2: null,
          text: `${node.name} = ${valPlace}`
        });
        return node.name;
      }

      case 'UnaryOp': {
        const operandPlace = this.genNode(node.operand);
        const temp = this.newTemp();
        this.instructions.push({
          target: temp,
          op: node.op,
          arg1: operandPlace,
          arg2: null,
          text: `${temp} = ${node.op}${operandPlace}`
        });
        return temp;
      }

      case 'BinaryOp': {
        const leftPlace = this.genNode(node.left);
        const rightPlace = this.genNode(node.right);
        const temp = this.newTemp();
        this.instructions.push({
          target: temp,
          op: node.op,
          arg1: leftPlace,
          arg2: rightPlace,
          text: `${temp} = ${leftPlace} ${node.op} ${rightPlace}`
        });
        return temp;
      }

      case 'FunctionCall': {
        const argPlaces = node.args.map(arg => this.genNode(arg));
        for (const argPlace of argPlaces) {
          this.instructions.push({
            target: null,
            op: 'param',
            arg1: argPlace,
            arg2: null,
            text: `param ${argPlace}`
          });
        }
        const temp = this.newTemp();
        this.instructions.push({
          target: temp,
          op: 'call',
          arg1: node.name,
          arg2: argPlaces.length,
          text: `${temp} = call ${node.name}, ${argPlaces.length}`
        });
        return temp;
      }

      default:
        return '';
    }
  }
}

// =============================================================================
// VERIFICATION TEST SUITE
// =============================================================================
const env = new Environment();

function testCase(expr, expected, shouldFail = false) {
  try {
    const lexer = new Lexer(expr);
    const tokens = lexer.tokenize();
    const parser = new Parser(tokens);
    const ast = parser.parse();
    const evaluator = new Evaluator(env);
    const { result } = evaluator.evaluate(ast);

    if (shouldFail) {
      console.error(`FAIL: '${expr}' was expected to fail, but got ${result}`);
      return false;
    }

    if (Math.abs(result - expected) < 1e-6) {
      console.log(`PASS: '${expr}' = ${result}`);
      return true;
    } else {
      console.error(`FAIL: '${expr}' expected ${expected}, got ${result}`);
      return false;
    }
  } catch (err) {
    if (shouldFail) {
      console.log(`PASS (Expected Error): '${expr}' -> ${err.name}: ${err.message}`);
      return true;
    } else {
      console.error(`FAIL: '${expr}' threw unexpected error: ${err.name}: ${err.message}`);
      return false;
    }
  }
}

console.log("=== RUNNING TEST CASES ===");
let allPassed = true;

// 1. 3 + 4 * 2 = 11
allPassed = testCase("3 + 4 * 2", 11) && allPassed;

// 2. (3+4)*2 = 14
allPassed = testCase("(3+4)*2", 14) && allPassed;

// 3. 2^3^2 = 512
allPassed = testCase("2^3^2", 512) && allPassed;

// 4. -2^2 = -4
allPassed = testCase("-2^2", -4) && allPassed;

// 5. 10 / 4 = 2.5
allPassed = testCase("10 / 4", 2.5) && allPassed;

// 6. 10 % 3 = 1
allPassed = testCase("10 % 3", 1) && allPassed;

// 7. sqrt(16) + abs(-3) = 7
allPassed = testCase("sqrt(16) + abs(-3)", 7) && allPassed;

// 8. x = 5, then x * 2 = 10
allPassed = testCase("x = 5", 5) && allPassed;
allPassed = testCase("x * 2", 10) && allPassed;

// 9. 5 / 0 -> division by zero error
allPassed = testCase("5 / 0", 0, true) && allPassed;

// 10. 3 + * 4 -> syntax error
allPassed = testCase("3 + * 4", 0, true) && allPassed;

// 11. (2 + 3 -> missing parenthesis error
allPassed = testCase("(2 + 3", 0, true) && allPassed;

// 12. foo(2) -> unknown function error
allPassed = testCase("foo(2)", 0, true) && allPassed;

// Bonus & edge cases
allPassed = testCase("sin(pi/2) + 2^3^2", 513) && allPassed;
allPassed = testCase("(10 - 2) ^ 2 / 4", 16) && allPassed;
allPassed = testCase("-5 + sqrt(16)", -1) && allPassed;
allPassed = testCase("x = 5 * 3", 15) && allPassed;
allPassed = testCase("min(10, 4, 8) + max(1, 9)", 13) && allPassed;
allPassed = testCase("pow(2, 5) % 7", 4) && allPassed;
allPassed = testCase(".5 * 8", 4) && allPassed;
allPassed = testCase("3 @ 4", 0, true) && allPassed;

console.log("\n--- Traversals and TAC check on: 3 + 4 * 2 ---");
const testTokens = new Lexer("3 + 4 * 2").tokenize();
const testAST = new Parser(testTokens).parse();
console.log("Inorder:", Traversals.inorder(testAST));
console.log("Preorder:", Traversals.preorder(testAST));
console.log("Postorder:", Traversals.postorder(testAST));
const tacGen = new TACGenerator();
const tac = tacGen.generate(testAST);
console.log("TAC:\n" + tac.instructions.map(i => i.text).join('\n'));

console.log("\nOverall Result:", allPassed ? "ALL TESTS PASSED!" : "SOME TESTS FAILED!");
