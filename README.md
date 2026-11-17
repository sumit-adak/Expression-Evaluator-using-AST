# ⚡ Expression Evaluator using AST (Abstract Syntax Tree)
### **Compiler Design Lab Project (PBL) &bull; Developer: Sumit Adak**

---

# 🚀 **[👉 CLICK HERE TO RUN LIVE DEMO IN BROWSER 👈](https://sumit-adak.github.io/Expression-Evaluator-using-AST/)**

> ### **🌐 Live Web App URL:** **`https://sumit-adak.github.io/Expression-Evaluator-using-AST/`**
> **No installation or setup required!** Click the link above to immediately run and test the interactive AST visualizer, step-by-step evaluator animation, tokens table, traversals, and three-address code generation in your browser.

---

**Technology:** Pure Vanilla HTML5, CSS3, JavaScript (ES6+), and SVG (Single self-contained file, **no external libraries, no CDN, no npm, offline-ready**).  
**Offline Execution:** You can also clone the repository and simply double-click `index.html` to open it in any modern browser completely offline.

---

## 1. Project Overview

This project implements a complete, textbook-compliant Compiler Front-End and Execution Pipeline for mathematical statements and expressions. It parses arithmetic expressions, variable assignments, and mathematical functions into an **Abstract Syntax Tree (AST)**, displays the compiler phases visually (Tokens, AST, Traversals, Step-by-Step Evaluation, and Three-Address Code), and evaluates the expression via post-order tree traversal.

> **Strict Compiler Integrity:** No `eval()` or `Function()` constructors are used anywhere in the codebase. The Lexer, Recursive Descent Parser, AST Node hierarchy, and Post-Order Evaluator are 100% hand-crafted.

---

## 2. Compiler Pipeline Architecture

```
                    +---------------------------+
                    |  Source Input Expression  |
                    +-------------+-------------+
                                  |
                                  v
              +---------------------------------------+
              |   PHASE 1: LEXICAL ANALYZER (LEXER)   |
              |   Converts string to Token stream     |
              +-------------------+-------------------+
                                  | Tokens [ {type, val, pos} ]
                                  v
              +---------------------------------------+
              |   PHASE 2: SYNTAX ANALYZER (PARSER)   |
              |   Recursive Descent Grammar Engine    |
              +-------------------+-------------------+
                                  | Abstract Syntax Tree (AST)
                                  v
        +-------------------------+-------------------------+
        |                         |                         |
        v                         v                         v
+---------------+       +-------------------+       +---------------+
|    PHASE 3    |       |      PHASE 4      |       |    PHASE 5    |
|   EVALUATOR   |       |    TRAVERSALS     |       | TAC GENERATOR |
|  (Post-Order) |       | In / Pre / Post   |       |  (Quadruples) |
+-------+-------+       +-------------------+       +---------------+
        |
        v
+---------------+
|  SVG Display  |
|  & Animation  |
+---------------+
```

### Phase 1: Lexical Analysis (`Lexer` class)
- Scans the input character-by-character and transforms it into a stream of typed tokens:
  - `NUMBER`: Integer and decimal numbers (e.g., `42`, `3.14`, `.5`).
  - `IDENT`: Variable names or built-in function names (e.g., `x`, `radius`, `sin`, `pi`).
  - Operators: `+`, `-`, `*`, `/`, `%`, `^`, `=`.
  - Punctuation: `(`, `)`, `,`.
  - `EOF`: Sentinel token indicating end of input.
- Skips whitespace automatically.
- Tracks exact 0-indexed positions for precise lexical error reporting (e.g., `Invalid character '@' at position 5`).

### Phase 2: Syntax Analysis & AST Construction (`Parser` class)
- Implements a **Recursive Descent Parser** based on a deterministic, non-left-recursive Context-Free Grammar.
- Enforces mathematical precedence and associativity:
  - Additive operators (`+`, `-`) have lowest binary precedence.
  - Multiplicative operators (`*`, `/`, `%`) bind tighter than additive.
  - Prefix unary operators (`+`, `-`) bind tighter than multiplicative.
  - Power operator (`^`) is **right-associative** and binds tighter than binary operators.
- Builds an explicit **Abstract Syntax Tree (AST)** consisting of specialized node types:
  - `NumberNode`: Holds literal numeric values.
  - `VariableNode`: Holds variable identifiers.
  - `BinaryOpNode`: Holds operator, left child, and right child.
  - `UnaryOpNode`: Holds unary operator (`+` or `-`) and operand child.
  - `FunctionCallNode`: Holds function name and argument node list.
  - `AssignNode`: Holds variable name and expression node to be assigned.
- Pinpoints syntax errors with positions (e.g., `Expected ')' at position 8`, `Unexpected token '*'`).

### Phase 3: Semantic Analysis & Evaluator (`Evaluator` class)
- Evaluates the AST using a **post-order traversal** (evaluating children before computing the parent).
- Maintains a persistent **Symbol Table / Environment** (`Environment` class):
  - Preloaded with mathematical constants: `pi` ($\approx 3.14159265$) and `e` ($\approx 2.71828182$).
  - Supports user-defined variable assignments (e.g., `x = 5 * 3`, followed by `x * 2`).
  - Persists variables and history across browser sessions via `localStorage`.
- Comprehensive built-in math functions:
  - Trigonometry: `sin`, `cos`, `tan` (radians).
  - Exponential & Logarithm: `exp`, `log` (base 10), `ln` (base $e$).
  - Utility & Rounding: `sqrt`, `abs`, `floor`, `ceil`, `round`, `pow`.
  - Multi-argument functions: `min(a, b, ...)`, `max(a, b, ...)`.
- Robust runtime error checking:
  - Division by zero (`5 / 0`).
  - Modulo by zero (`10 % 0`).
  - Undefined variable (`y + 2`).
  - Domain errors (negative `sqrt`, non-positive `log`/`ln`).
  - Incorrect function argument count (`sqrt(4, 9)`).

### Phase 4: Intermediate Code Generation (`TACGenerator` class)
- Converts the high-level AST into **Three-Address Code (TAC)**, an intermediate representation where each instruction has at most one operator and at most three addresses.
- Employs temporary variables `t1`, `t2`, `t3`...
- Displays both textual assembly-like instructions and a Quadruple Table (`Op`, `Arg1`, `Arg2`, `Result`).

### Phase 5: Tree Traversals & Visualizations
- **Inorder Traversal:** Infix notation with explicit parentheses showing exact grouping.
- **Preorder Traversal:** Prefix notation (Polish notation).
- **Postorder Traversal:** Postfix notation (Reverse Polish Notation / RPN) used by stack machines.
- **Interactive SVG Tree:** Custom tidy tree layout algorithm ensuring no overlapping nodes, drag-to-pan, scroll-to-zoom, and fit-to-screen controls.
- **Step-by-Step Animation:** Replays evaluation node-by-node, highlighting active nodes in the SVG tree with intermediate calculated values.

---

## 3. Grammar & Precedence Specification

### BNF Grammar
```bnf
statement  → IDENT '=' expr | expr
expr       → term (('+' | '-') term)*
term       → unary (('*' | '/' | '%') unary)*
unary      → ('-' | '+') unary | factor
factor     → primary ('^' unary)?
primary    → NUMBER
           | IDENT
           | IDENT '(' [expr (',' expr)*] ')'
           | '(' expr ')'
```

### Operator Precedence & Associativity Table

| Precedence | Operator | Description | Associativity | Grammar Rule |
| :---: | :---: | :---: | :---: | :---: |
| **6 (Highest)** | `()`, `fn(...)` | Grouping, Function Call | Left-to-Right | `primary` |
| **5** | `^` | Exponentiation / Power | **Right-to-Left** | `factor → primary ('^' unary)?` |
| **4** | `+`, `-` (prefix) | Unary Plus / Negation | **Right-to-Left** | `unary → ('-' \| '+') unary` |
| **3** | `*`, `/`, `%` | Multiplicative | Left-to-Right | `term → unary (('*' \| '/' \| '%') unary)*` |
| **2** | `+`, `-` | Additive | Left-to-Right | `expr → term (('+' \| '-') term)*` |
| **1 (Lowest)** | `=` | Assignment | Right-to-Left | `statement → IDENT '=' expr` |

---

## 4. How to Run & Deploy

### A. Run Online via GitHub Pages (1-Click Deployment)
This repository is configured to be hosted for free on **GitHub Pages**. To activate the live link:
1. Go to your repository on GitHub: [`https://github.com/sumit-adak/Expression-Evaluator-using-AST`](https://github.com/sumit-adak/Expression-Evaluator-using-AST)
2. Click **Settings** (tab at the top right of the repository).
3. In the left sidebar, click **Pages** (under the "Code and automation" section).
4. Under **Build and deployment > Branch**:
   - Select branch: `main`
   - Select folder: `/ (root)`
   - Click **Save**.
5. Wait 30–60 seconds. GitHub will display:
   > *Your site is live at:* **`https://sumit-adak.github.io/Expression-Evaluator-using-AST/`**
6. Anyone in the world can now click that link and run the project directly!

### B. Run Locally (Offline Mode)
1. Clone or download this repository.
2. Locate `index.html`.
3. **Double-click `index.html`** to open it immediately in Google Chrome, Microsoft Edge, Firefox, or Safari.
4. *Alternative:* Double-click `start.bat` or run `node server.js` to run the local server at `http://localhost:3000`.

### C. Deploy to Vercel / Netlify (Optional Alternative)
- **Vercel:** Import this GitHub repository into [Vercel](https://vercel.com); it detects `index.html` automatically with zero configuration.
- **Netlify:** Drag and drop the project folder directly into [Netlify Drop](https://app.netlify.com/drop).

---

## 5. Sample Test Cases & Verification

| Input Expression | Expected Output | Compiler Phase Notes |
| :--- | :--- | :--- |
| `3 + 4 * 2` | `11` | Correct precedence: `*` before `+` |
| `(3 + 4) * 2` | `14` | Parentheses override standard precedence |
| `2^3^2` | `512` | Evaluates as $2^{(3^2)} = 2^9 = 512$ (Right-associative) |
| `-2^2` | `-4` | Evaluates as $-(2^2) = -4$ |
| `10 / 4` | `2.5` | Floating-point arithmetic |
| `10 % 3` | `1` | Modulo operation |
| `sqrt(16) + abs(-3)` | `7` | Built-in single-argument functions ($4 + 3 = 7$) |
| `x = 5` | `5` | Assignment statement; stores `x: 5` in symbol table |
| `x * 2` | `10` | Symbol table variable lookup ($5 \times 2 = 10$) |
| `sin(pi/2) + 2^3^2` | `513` | Constant lookup (`pi`), trigonometric call ($1 + 512 = 513$) |
| `min(10, 4, 8) + max(1, 9)`| `13` | Multi-argument functions ($4 + 9 = 13$) |
| `5 / 0` | `RuntimeError: Division by zero` | Safe exception handling |
| `10 % 0` | `RuntimeError: Modulo by zero` | Modulo zero validation |
| `3 + * 4` | `SyntaxError: Unexpected token '*'` | Syntax error with caret pointing to position 4 |
| `(2 + 3` | `SyntaxError: Expected ')' at position 6` | Unterminated parentheses detection |
| `foo(2)` | `RuntimeError: Unknown function 'foo'` | Undeclared function lookup error |
| `3 @ 4` | `LexicalError: Invalid character '@'` | Lexical error with exact position |

---

## 6. Viva Voce Questions & In-Depth Answers

### Q1: What is an Abstract Syntax Tree (AST)?
**Answer:**  
An Abstract Syntax Tree (AST) is a condensed, hierarchical, tree-structured intermediate representation of the abstract syntactic structure of source code. In an AST:
- Each **internal node** represents an operator, operation, or language construct (e.g., `BinaryOp '+'`, `FunctionCall 'sqrt'`).
- Each **leaf node** represents an operand (e.g., a `Number` literal or `Variable` identifier).
- Unlike concrete parse trees, ASTs omit syntactic noise such as grouping parentheses, commas, and semicolons, retaining only the structural and semantic relationships needed for code generation, optimization, and evaluation.

---

### Q2: Why do compilers prefer an AST over a Concrete Syntax Tree (Parse Tree)?
**Answer:**  
1. **Space & Memory Efficiency:** A parse tree contains every grammar production rule and punctuation symbol (such as `(`, `)`, `;`), resulting in deep, bloated trees. An AST only preserves semantic nodes, drastically reducing memory usage.
2. **Simplified Traversal & Optimization:** Compilers perform semantic checks, constant folding, dead-code elimination, and intermediate code generation by traversing AST nodes. Traversing a parse tree requires navigating redundant intermediate non-terminals (e.g., `expr → term → factor → primary → NUMBER`).
3. **Decoupling:** The AST decouples the front-end parser grammar from downstream optimizer and target code generation phases.

---

### Q3: How does Recursive Descent Parsing handle Operator Precedence?
**Answer:**  
Recursive descent parsing handles operator precedence through a hierarchy of mutually recursive grammar procedures:
- Procedures corresponding to **lower precedence** operators call procedures corresponding to **higher precedence** operators.
- In our grammar:
  - `expr()` handles addition and subtraction (`+`, `-`). It calls `term()`.
  - `term()` handles multiplication, division, and modulo (`*`, `/`, `%`). It calls `unary()`.
  - `unary()` handles unary signs (`+`, `-`). It calls `factor()`.
  - `factor()` handles exponentiation (`^`). It calls `primary()`.
  - `primary()` handles atomic values (literals, identifiers, parenthesized sub-expressions).
Because higher-precedence procedures are deeper in the call stack, their AST sub-trees are constructed lower in the tree, ensuring they are evaluated first during post-order traversal.

---

### Q4: How is Right-Associativity implemented (e.g., for Exponentiation `^`)?
**Answer:**  
In Left-Associative operators (like `+` and `*`), the parser uses an iterative loop:
```js
let left = this.term();
while (this.match(PLUS, MINUS)) {
    let right = this.term();
    left = new BinaryOpNode(op, left, right);
}
```
This causes trees to grow deeper to the left: `(a + b) + c`.

In Right-Associative operators (like `^`), the parser uses **right-recursion** instead of a loop:
```js
let left = this.primary();
if (this.match(POWER)) {
    let right = this.unary(); // recursive call to higher/same level
    return new BinaryOpNode('^', left, right);
}
return left;
```
For `2 ^ 3 ^ 2`, `left` is `2`, and the right child is the recursively parsed result of `3 ^ 2`. Thus, `3 ^ 2` is evaluated first ($9$), then $2^9 = 512$.

---

### Q5: What is the fundamental difference between a Lexer and a Parser?
**Answer:**  
- **Lexer (Lexical Analyzer / Scanner):**
  - Reads raw input characters and groups them into meaningful units called **Tokens** using Regular Expressions / Finite State Automata.
  - Verifies character-level validity and discards comments and whitespace.
  - Understands **Type 3 (Regular) Grammars**.
- **Parser (Syntax Analyzer):**
  - Takes the token stream from the Lexer and verifies whether the sequence conforms to the grammatical structure of the language using a Context-Free Grammar (Pushdown Automaton).
  - Understands **Type 2 (Context-Free) Grammars** and builds the hierarchical tree structure (AST).

---

### Q6: How does Post-Order Traversal evaluate an AST?
**Answer:**  
Post-Order traversal visits nodes in the order: **Left Child $\rightarrow$ Right Child $\rightarrow$ Parent Node**.  
In an AST:
1. The left sub-expression is evaluated to a numerical value.
2. The right sub-expression is evaluated to a numerical value.
3. The parent operator node applies its operation to the two evaluated values.
This mirrors the execution model of a **stack machine** or **Reverse Polish Notation (RPN)** calculator: operands are pushed onto the stack, and an operator pops the required operands, computes the result, and pushes the result back onto the stack.

---

### Q7: What is Three-Address Code (TAC) and why is it used?
**Answer:**  
Three-Address Code (TAC) is a linearized intermediate representation (IR) where every statement has at most one operator and at most three operand addresses (two sources and one destination):
```
t1 = 4 * 2
t2 = 3 + t1
```
Compilers use TAC because:
1. It breaks complex nested expressions into simple atomic instructions close to machine assembly.
2. It makes compiler optimizations (common subexpression elimination, register allocation, loop invariant code motion) significantly easier to implement than directly manipulating an AST or raw target machine code.

---

## 7. Project File Structure

```
compilerPBL/
├── index.html          # Complete self-contained single-page compiler web application
├── README.md           # Documentation, grammar, test cases, and viva questions
└── test/               # Node.js automated verification test scripts
    ├── suite_runner.js # Automated test runner validating 20 test cases
    ├── verify_html.js  # Script verifying zero use of eval() or Function()
    └── compiler_test.js# Core unit tests
```

---

## 8. Credits
- **Project Title:** Expression Evaluator using AST
- **Author:** Sumit Adak
- **Course:** Compiler Design Laboratory (PBL)
