---
layout: post
title:  "Building Tundra Part 5: From Tokens to Syntax Trees"
date:   2026-05-14 10:00:00 +0000   # optional time and timezone
tags:
  - interpreter
  - scanning
  - parsing
  - programming language
---

## Building Tundra Part 5: From Tokens to Syntax Trees

In the last post, I wrote about TundraCore.

The project is still a language project, but it is also starting to become a small research testbed for debugging, provenance, and LLM code-reasoning experiments.

This post is about the next implementation step.

The scanner could already turn source code into tokens.

So this:
```
val x = 42;
```
could become something like this:
```
VAL IDENTIFIER EQUAL NUMBER SEMICOLON EOF
```

That was a useful milestone.

Tundra could read characters and recognize pieces of the language.

But tokens are still flat.

They do not tell us which pieces belong together. They do not know that `1 + 2 * 3` should mean `1 + (2 * 3)`. They do not know that an `if` statement has a condition and a body. They do not know that a function call has a callee and arguments.

That is what the parser is for.

The parser is the next step in the interpreter pipeline:

```text
source code
    ↓
scanner
    ↓
tokens
    ↓
parser
    ↓
syntax tree
```
The scanner gives us pieces. The parser gives those pieces shape.

## Tokens Are Flat

Take this expression:
```text
1 + 2 * 3
```
The scanner can turn it into tokens:
```text
NUMBER PLUS NUMBER STAR NUMBER
```
That is useful, but it is not enough.
The token list is flat:
```text
1   +   2   *   3
```

### But the meaning is not flat.
Humans know that multiplication happens before addition, so we read it like this:

`1 + (2 * 3)`

not like this:

`(1 + 2) * 3`

Those two shapes produce different results.

```text
1 + (2 * 3) = 7
(1 + 2) * 3 = 9
```

Same tokens. Different structure. Different meaning.

That is exactly **why parsing** matters.

## The Problem with a Too-Simple Grammar


A first attempt at an expression grammar might look like this:

```text
expression     → literal
               | unary
               | binary
               | grouping ;

literal        → NUMBER | STRING | "true" | "false" | "none" ;
grouping       → "(" expression ")" ;
unary          → ( "-" | "!" ) expression ;
binary         → expression operator expression ;

operator       → "==" | "!=" | "<" | "<=" | ">" | ">="
               | "+"  | "-"  | "*" | "/" ;

```

At first, this looks pretty reasonable.
An expression can be:

```text
a literal       42
a unary expr    -x
a binary expr   a + b
a grouping      (a + b)
```

The **problem** is that this **grammar is too loose**.

It does not say which operators should bind tighter.

So this expression:

`6 / 3 - 1`

could be understood in two different ways.

First interpretation:

`(6 / 3) - 1`

As a tree:
```
        -
       / \
      /   1
     /
    /
   /
  ÷
 / \
6   3
```
That gives:
```
(6 / 3) - 1
2 - 1
1
```
Second interpretation:
```
6 / (3 - 1)
```
As a tree:
```
        ÷
       / \
      6   -
         / \
        3   1
```
That gives:
```
6 / (3 - 1)
6 / 2
3
```
Same text. **Different** tree. **Different** answer.

So the parser **cannot** just say:

expression operator expression

It needs clearer rules.


## Precedence and Associativity

To fix this, programming languages use **precedence** and **associativity**.

### Precedence answers:

Which operator binds tighter?

For example, multiplication binds tighter than addition:
```text
1 + 2 * 3
```
means:
```text
1 + (2 * 3)
```
### Associativity answers:

When operators have the same precedence, which direction do they group?

For example:
```text
5 - 3 - 1
```
means:
```text
(5 - 3) - 1
```
not:
```text
5 - (3 - 1)
```

So **subtraction** is **left-associative**.
For TundraCore, the expression parser uses layered precedence rules. The current naming follows the grammar more directly:

```text
assignment
or
and
equality
comparison
addition
multiplication
unary
postfix
primary
```

### This table is basically a map for the parser.
It tells the parser:

- `primary` binds tighter than postfix
- `postfix` binds tighter than unary
- `unary` binds tighter than multiplication
- `multiplication` binds tighter than addition
- `addition` binds tighter than comparison
- `comparison` binds tighter than equality
- `equality` binds tighter than and
- `and` binds tighter than or
- `or` binds tighter than assignment

---
So when the parser sees:
```text
1 + 2 * 3
```
it knows the `2 * 3` part should be grouped **first**.
Tree shape:
```

        +
       / \
      1   *
         / \
        2   3
```
That tree means:
```text
1 + (2 * 3)
```

### A Better Expression Grammar

> Instead of one big ambiguous binary rule, Tundra uses a layered grammar.
Each layer handles one precedence level.

```
expression      → assignment ;

assignment      → IDENTIFIER "=" assignment
                | logic_or ;

logic_or        → logic_and ( "or" logic_and )* ;

logic_and       → equality ( "and" equality )* ;

equality        → comparison ( ( "==" | "!=" ) comparison )* ;

comparison      → addition ( ( ">" | ">=" | "<" | "<=" ) addition )* ;

addition        → multiplication ( ( "+" | "-" ) multiplication )* ;

multiplication  → unary ( ( "*" | "/" ) unary )* ;

unary           → ( "!" | "-" ) unary
                | postfix ;

postfix         → primary ( "(" args? ")" | "." IDENTIFIER | "[" expression "]" )* ;

primary         → NUMBER
                | STRING
                | "true"
                | "false"
                | "none"
                | IDENTIFIER
                | "(" expression ")"
                | listLiteral
                | recordLiteral ;
```

This looks more complicated than the first grammar, but it solves the problem.
The rules are **stacked from looser to tighter**:
```
expression
  assignment
    or
      and
        equality
          comparison
            addition
              multiplication
                unary
                  postfix
                    primary
```
A primary is something simple:

```
42
"hello"
true
false
none
name
(1 + 2)
[1, 2, 3]
{ id: "A12", price: 4.50 }
```
A `postfix` expression handles things that come after a primary:
```
parseNumber(text)
order.price
items[0]
```
A `unary` expression handles:
```
-x
!ready
```
A `multiplication` expression handles:
```
a * b
a / b
```
An `addition` expression handles:
```
a + b
a - b
```
And so on...


This is much better for a hand-written parser.

## Why *Recursive Descent* Fits Tundra

For Tundra, I decided to use a **recursive descent parser**.
That means the parser is written by hand, with methods that follow the grammar rules.
This fits Tundra’s goals pretty well right now.

TundraCore is intentionally small and boring, so a hand-written parser stays manageable. The grammar is readable, and the parser can closely mirror the grammar in the docs, blog posts.

The pipeline is also easy to explain:
```
scanner
  ↓
tokens
  ↓
recursive descent parser
  ↓
AST
  ↓
interpreter
```

Another **benefit** is that it avoids adding parser-generator tooling. I do not need another build step yet. I can compile the Java files and run the project directly.

It also gives more control over error messages. That will matter later for **TundraBench** repair tasks. If I want models to debug Tundra programs, the shape of parser errors and runtime errors becomes part of the experiment.

Recursive descent also keeps future provenance and debugging work easier to reason about, because I control the AST shape directly.

For the research goal, the parser does not need to be fancy.
It needs to be **stable, understandable, and predictable**.

Recursive descent is exactly that.

The downside is that if Tundra became a large production language, maintaining a hand-written parser could get annoying. But that is not the goal right now.

This needs to be small enough to implement, test, explain, and use for controlled experiments.

## The Parser Mirrors the Grammar

The nice part is that with a recursive descent parser, each grammar rule can become a method.
For example, this grammar rule:

`addition → multiplication ( ( "+" | "-" ) multiplication )* ;`

turns into a method shaped roughly like this:
```
private Expr addition() {
    Expr expr = multiplication();

    while (match(TokenType.PLUS, TokenType.MINUS)) {
        Token operator = previous();
        Expr right = multiplication();
        expr = new Expr.Binary(expr, operator, right);
    }

    return expr;
}
```

At first, this kind of code can look a little strange.
But the idea is simple.
Start by parsing the left side:

`Expr expr = multiplication();`

Then, while there is another `+` or `-`, keep folding the next part into a bigger expression.
For this:

`a - b - c - d`

the parser builds the tree step by step.
Start:

`a`

Then:
```
a - b

      -
     / \
    a   b
```
Then:
```
(a - b) - c

        -
       / \
      -   c
     / \
    a   b
```
Then:
```
((a - b) - c) - d

          -
         / \
        -   d
       / \
      -   c
     / \
    a   b
```

### That is left associativity.
The parser keeps storing the new bigger expression back into the same variable:

`expr = new Expr.Binary(expr, operator, right);`

That one line is doing a lot.
It says:

`The expression I have parsed so far becomes the left side of the next binary expression.`

That is how the tree grows.

### A Visual Example
Take this expression:
```
1 + 2 * 3
```
The scanner sees:
```
NUMBER PLUS NUMBER STAR NUMBER
```
The parser sees the structure:
```
        +
       / \
      1   *
         / \
        2   3
```

The reason is **precedence**.
* belongs to the multiplication level.
+ belongs to the addition level.

Since multiplication is deeper and tighter, `2 * 3` gets grouped before `1 + ....`
Now take this:
```
(1 + 2) * 3
```
Tree shape:
```
        *
       / \
      +   3
     / \
    1   2
```
The parentheses force `1 + 2` to become one grouped expression.

Same numbers. Same operators. Different tree.That is the parser’s job!

## Tundra’s Parser Slice

I originally expected to start with only expressions, then slowly grow the parser from there.
But I ended up implementing a fuller first parser slice for TundraCore 0.1.

The current parser is meant to understand more than arithmetic expressions. It also handles the main grammar pieces needed before the interpreter can exist:

```
val declarations
var declarations
optional type annotations
function declarations
if statements
while statements
for statements
return statements
blocks
expression statements
assignment
and / or
equality and comparison
arithmetic
function calls
field access
indexing
list literals
record literals
```
That means Tundra can now parse examples like:
```
val score: Number = 10;
val name: String = "Ada";
val scores: List<Number> = [1, 2, 3];
```
and:
```
val user = { name: "Ada", score: "10" };
val bonus = 5;
val total = user.score + bonus;

history(total);
```
The important thing is that `history(total)` is still just a normal function call at the parser level.

The scanner sees history as an identifier. The parser sees a call expression.

Only a future runtime will decide that history is a built-in provenance helper.

That **keeps provenance out of the grammar for now, which is what I want**.


## The AST- Abstract Syntax Tree.
The parser does not directly run code. Instead, it builds an AST.

*“Abstract”* means the tree keeps the important structure, not every tiny source detail.
For example:
```
1 + 2 * 3
```
becomes something like:
```
Binary +
├── Literal 1
└── Binary *
    ├── Literal 2
    └── Literal 3
```

That tree tells the future interpreter what to evaluate first.
The scanner gave us this:
```
NUMBER PLUS NUMBER STAR NUMBER
```
The parser gives us this:
```
1 + (2 * 3)
```

!That is a big upgrade.!

This is where Tundra starts understanding the shape of code.

## Writing the AST Classes
There is one design choice I changed while implementing this part.

I originally thought about using an AST generator, like the one in Crafting Interpreters. The idea would be to write a small helper program that generates repetitive Java classes like `Expr.java` and `Stmt.java`.
That is a nice approach. But for now, I decided to write the AST classes directly.

Tundra is still small enough that handwritten AST classes are manageable. Writing them directly also makes the structure explicit while the language is still changing.

A generator might still make sense later if the AST becomes annoying to maintain. But for now, I wantto keep the project simple and easy to inspect.

So the current setup is:
```
Expr.java
Stmt.java
TypeAnnotation.java
```
These define the syntax tree structures the parser builds.

There is also an `AstPrinter`, which gives the project a simple way to print the parsed tree. That is useful before the interpreter exists, because it lets me test whether the parser understood the program correctly.

## What Changed in the Repo
The core code now includes:

`src/tundra/Tundra.java`

This now parses files by default and prints AST output.
The old scanner output is still available with:

`--scan`

So this still works:

`java -cp out tundra.Tundra --scan examples/test.tds`

But the normal command now parses the file:

`java -cp out tundra.Tundra examples/test.tds`

The new parser-related files are:
```
src/tundra/Parser.java
src/tundra/Expr.java
src/tundra/Stmt.java
src/tundra/TypeAnnotation.java
src/tundra/AstPrinter.java
```
The docs were also updated:
```
README.md
docs/Formal Grammar and AST Draft for Tundra 0.1.md
docs/TundraTrace Research Plan.md
```
The examples now use `.tds` files: (looks cuter ^ - ^)
```
examples/test.tds
examples/bad_tests.tds
examples/type-annotations.tds
examples/provenance-debugging.tds
``
And the tests now include both scanner and parser checks:
```
tests/run_scanner_tests.sh
tests/run_parser_tests.sh
``

---

Before, Tundra could only recognize tokens. Now it can build syntax trees.

## Parser Tests
The parser tests are still lightweight, but they are important.
They check that the parser can handle the first useful slice of TundraCore:
```
declarations
optional type annotations
records
lists
function calls
provenance helper calls
variable reassignment
field and index assignment rejection
```
That last part matters.
The parser should accept this:
```
var total = 0;
total = total + 1;
```
But reject this:
```
person.name = "Ada";
items[0] = 42;
```
That gives the language a clear mutation boundary for now.

It also gives future **TundraBench** tasks a more stable target. If mutation rules are clear, then debugging tasks can be more controlled.

## Why This Matters for TundraTrace and TundraBench
The parser is not the exciting part by itself buut it is the foundation the research part needs.

A future runtime error like:

`Cannot add String and Number.`

will happen because the interpreter evaluates a tree like:
```
Binary +
├── FieldAccess user.score
└── Variable bonus
```
And a future provenance trace might explain:
```
user.score came from record field user.score
user.score was string "10"
bonus was number 5
total came from user.score + bonus
```


## What Comes Next

The next major milestone is a tree-walking interpreter.
Right now, Tundra can scan and parse. It can print the AST. But it does not yet execute programs. That means there are no real runtime values yet, no real runtime errors, and no real provenance traces.
The next step is to make the AST do something.
That means implementing an interpreter that can evaluate expressions and run statements:
```
literals
variables
val and var declarations
blocks
if / else
loops
functions
records
lists
field access
indexing
function calls
return
runtime errors
```

Once the interpreter works, Tundra can start producing actual behavior.
Then runtime errors become real.
Then `origin(value)` and `history(value)` can become real built-in helpers.
Then **TundraTrace** becomes more concrete.
And after that, TundraBench can start becoming more than a plan.
The pipeline is now:
```
source code
    ↓
scanner
    ↓
tokens
    ↓
parser
    ↓
AST
```
The next pipeline is:
```
source code
    ↓
scanner
    ↓
tokens
    ↓
parser
    ↓
AST
    ↓
interpreter
    ↓
runtime behavior
```

The scanner taught Tundra to read.
The parser taught Tundra to understand structure.
Next, the interpreter needs to teach Tundra what that structure means. Kudos!!! 
