---
layout: post
title:  "Building Tundra Language and Interpreter, Part 4: From Grammar to Testbed"
date:   2026-05-13 10:00:00 +0000   # optional time and timezone
tags:
  - interpreter
  - scanning
  - parsing
  - programming language
---

# Building Tundra Language and Interpreter, Part 4: From Grammar to Testbed.

In the last post, Tundra learned how to read source code. The scanner could turn **characters** into **tokens**, but tokens are still flat. The next step is to give those tokens structure: grammar, parsing, and an AST.

While working on the grammar, I also started thinking more intentionally about what Tundra is actually for.

Tundra began as a small scripting language for explainable transformations and I still want it to be that. But the project is also starting to point toward something more research-oriented: a controlled environment for testing, debugging, and understanding LLM code reasoning. As I find it more appealing to test and personally have some issues with bugs and the way LLM interprets them. 

I want Tundra to become a **small research-engineering testbed**.

#### The long-term goal is to build three connected pieces:

- **Tundra** — a small programming language and interpreter.
- **TundraTrace** — a provenance-aware runtime for understanding where values came from and how they were produced.
- **TundraBench** — a benchmark for evaluating output prediction, bug localization, and program repair in a small unfamiliar language.

The first experiment I eventually want to run is simple: give an LLM the same broken Tundra program in two different ways.

- In one version, the model gets **only the program and the runtime error**.
- In the other version, the model **also gets a compact provenance trace showing where the failing value came from**.

Then I can **compare** whether provenance helps the model localize and repair the bug.
That is still ahead of where the implementation is right now, but it gives the project a more clear direction.

#### This post updates the grammar for Tundra 0.1 and introduces the idea of TundraCore: a small, stable subset of the language that can be used for experiments, benchmarks, and provenance-aware debugging.



## Why the Grammar Matters

A benchmark language needs **boring, stable** rules.
If the grammar keeps changing, experiments become difficult to compare over time. A model might fail because the language changed,.

For Tundra 0.1, I want the core language to stay **small** and **predictable**:

```text
val and var
functions with def
explicit return
records and lists
field access and indexing
optional type annotations
no classes
no modules
no imports
no field or index assignment yet
provenance through ordinary function calls like origin(value) and history(value)
```

This keeps the language understandable while still making it expressive enough for interesting reasoning and debugging tasks and Tundra should be small enough that I can implement it, test it, and explain its behavior clearly.

## Introducing **TundraCore**

TundraCore is the stable subset of Tundra used for experiments.

The full language can grow later, but TundraCore should remain small and controlled. That matters because I want Tundra to **support** two possible **research directions**.

1. TundraBench.
2. TundraTrace.

These names may change later, but the ideas are useful enough that I want to start designing with them in mind.


## TundraBench

TundraBench is a planned benchmark for testing LLM code reasoning.

> The goal is to create tasks where memorized Python or JavaScript knowledge does not help too much. **Models should have to reason from the actual semantics of the language**.
Possible benchmark categories include:

```
output prediction
variable tracing
control flow
scope
type errors
bug localization
program repair
```

Some other categories might become interesting later, such as recursion, aliasing, mutation, or hidden state. But I do not want to start there. 

The first serious version of TundraBench should probably focus on debugging and repair only.

For example:

```tundra
val user = { name: "Ada", score: "10" };
val bonus = 5;
val total = user.score + bonus;

print(total);
```

This program should fail because `user.score` is a `string` and `bonus` is a `number`.
A model might receive the program and the **runtime error**:

`Cannot add String and Number.`

Then the task is:

`Fix the program.`

That is the basic repair setting.

But with TundraTrace, the same task could include more information.


## TundraTrace
**TundraTrace** is a planned runtime provenance system for tracking value origins and execution history.
The goal is to answer questions like:

```tundra
history(total);
origin(score);
```

Instead of only asking what a program outputs, TundraTrace should help answer why a value exists, where it came from, and which operations affected it.

For the broken program above, a provenance trace might look like this:

```tundra
history(total):
- total came from user.score + bonus
- user.score came from record field user.score
- user.score was string "10"
- bonus was number 5
```

Now the model has more than just the runtime error. It has causal information about the value that failed.

That creates a cleaner experiment:

#### Condition A:
`Program + runtime error`

#### Condition B:
`Program + runtime error + provenance trace`


Then I can ask:

**Does the provenance trace help the model repair the program?**

> Maybe it helps a lot. Maybe it only helps certain bug types. Maybe it does not help at all. Maybe verbose traces distract the model. Any of those results could be interesting if the experiment is designed carefully.


**Useful:**
```tundra
read("price.txt") -> trim -> parseNumber -> + 5
```

**Less useful:**
```tundra
allocate -> assign -> call -> return -> assign -> add
```

TundraTrace should record information that helps explain the program, not every tiny internal operation.

> ! This could be useful for debugging both human-written programs and AI-generated programs. !


## Why Use a Small Language for LLM Evaluation?

Existing code benchmarks often use popular languages like Python, JavaScript, Java, or C++.

Those benchmarks are important because they are realistic. But they also make one thing hard to study: **whether a model is reasoning from program semantics or relying on familiar patterns it has seen many times before**.

Tundra gives me a different kind of test environment.

Because the language is small and unfamiliar, I can define the semantics clearly and control the kinds of programs models see. 

The idea is to **isolate specific reasoning and debugging behaviors**.

### That lets me ask questions like:

- Can a model predict the output of a Tundra program?
- Can it understand unfamiliar syntax from examples and grammar rules?
- Can it repair a broken program using only the language rules and runtime error?
- Can it use provenance traces to debug more accurately?
- Do type annotations improve repair performance?
- Which failure cases repeat across different models?
- Do smaller models benefit more from explicit traces than larger models?


## Why Add Optional Type Annotations?

At first, I was unsure about adding type annotations. Tundra is still meant to be small and dynamic.

But optional type annotations are useful for experiments.

For example:
```tundra
val score: Number = 10;
val name: String = "Ada";
val scores: List<Number> = [1, 2, 3];
```
These annotations make it possible to create **typed** and **untyped** versions of the **same benchmark task**.

### That opens up useful questions:

- Do type hints help models reason through code?
- Do models repair type errors more reliably when annotations are present?
- Can provenance traces explain where a bad value came from?
- Do smaller models benefit more from annotations than larger models?

The annotations do not need to become a full static type system immediately. In the first version, the parser can simply record them in the AST.

Later, Tundra can add stronger type checking or even a separate type-analysis pass.
For now, optional types are mostly experimental metadata. They give the parser more structure to preserve, and they give future benchmark tasks another variable to test.

The **important distinction** is:

```tundra
val x: None = none;
```
`None` is the type.

`none` is the value.

That may be useful later when testing whether models understand the difference between type-level information and runtime values.


## TundraCore 0.1

For now, TundraCore should include enough features to write small but meaningful debugging tasks.

The core language should include:

```text
numbers
strings
booleans
none
val and var
optional type annotations
arithmetic and comparison
if / else
for
maybe while
functions with def
explicit return
records
lists
field access
indexing
function calls
runtime errors
origin(value) and history(value) as normal function calls
```

TundraCore should **not** include yet:

```text
classes
this
super
anonymous functions
optional semicolons
field assignment
index assignment
async / await
macros
imports or modules
complex generics
pattern matching
inheritance
```

For the very first pilot, it may even be okay to omit some things from the implementation, such as advanced type annotations, multiline strings, or while.
I just need to build enough to run controlled debugging experiments.

## Updated Grammar

Here is the current grammar draft for TundraCore 0.1:

```
program        → statement* EOF ;

// Statements
statement      → varDecl
               | valDecl
               | funDecl
               | ifStmt
               | whileStmt
               | forStmt
               | returnStmt
               | block
               | exprStmt ;

varDecl        → "var" IDENTIFIER typeAnnotation? "=" expression ";" ;
valDecl        → "val" IDENTIFIER typeAnnotation? "=" expression ";" ;

typeAnnotation → ":" type ;
type           → "Number"
               | "String"
               | "Bool"
               | "None"
               | "Record"
               | "List" "<" type ">" ;

funDecl        → "def" IDENTIFIER "(" params? ")" block ;
params         → IDENTIFIER ( "," IDENTIFIER )* ;

ifStmt         → "if" "(" expression ")" block ( "else" block )? ;
whileStmt      → "while" "(" expression ")" block ;
forStmt        → "for" "(" IDENTIFIER "in" expression ")" block ;

returnStmt     → "return" expression? ";" ;
exprStmt       → expression ";" ;

block          → "{" statement* "}" ;

// Expressions, lowest precedence to highest precedence
expression     → assignment ;

assignment     → IDENTIFIER "=" assignment
               | logic_or ;

logic_or       → logic_and ( "or" logic_and )* ;
logic_and      → equality ( "and" equality )* ;

equality       → comparison ( ( "==" | "!=" ) comparison )* ;
comparison     → addition ( ( "<" | "<=" | ">" | ">=" ) addition )* ;
addition       → multiplication ( ( "+" | "-" ) multiplication )* ;
multiplication → unary ( ( "*" | "/" ) unary )* ;

unary          → ( "!" | "-" ) unary
               | postfix ;

postfix        → primary ( "(" args? ")" | "." IDENTIFIER | "[" expression "]" )* ;
args           → expression ( "," expression )* ;

// Primary expressions
primary        → NUMBER
               | STRING
               | "true"
               | "false"
               | "none"
               | IDENTIFIER
               | "(" expression ")"
               | listLiteral
               | recordLiteral ;

listLiteral    → "[" ( expression ( "," expression )* )? "]" ;
recordLiteral  → "{" ( field ( "," field )* )? "}" ;
field          → IDENTIFIER ":" expression ;

```

This is still a draft, but it gives the parser a clear target.

The grammar is intentionally not too fancy. I want it to be easy to implement, easy to test, and easy to explain.

## A Small Mutation Rule
One design choice I want to keep simple for now is mutation.

This is allowed:
```tundra
var total = 0;
total = total + 1;
```
But this is not part of TundraCore 0.1:

```tundra
person.name = "Ada";
items[0] = 42;
```

In other words, **variable reassignment exists, but field assignment and index assignment do not**.

That makes the language less powerful, but it also makes provenance easier to reason about. 
Once records and lists become mutable, value history becomes harder to track clearly.
Maybe field and index assignment can come later. For now, I would rather keep mutation limited and understandable.

## Why origin and history Are Still Not Keywords

Even though provenance is one of the main ideas behind Tundra, **origin and history are not special grammar forms**.

This still parses as a normal function call:

```tundra
history(total);
```

The scanner sees history as an identifier.

The parser sees a call expression.

Only the runtime decides that history is a built-in debugging helper when provenance or debug mode is enabled.

That keeps the grammar small.

It also **keeps provenance as a runtime feature instead of syntax magic**. This is important because I want normal execution and provenance-aware execution to be comparable in my later experimenta.

The same program should eventually be able to run in two modes:

1. **normal** execution
2. **provenance-aware** execution

Then TundraTrace can compare what changes when execution history is tracked.

That comparison is especially important for the benchmark. 

> If provenance becomes special syntax, then the traced and untraced programs may no longer be the same program. I want to avoid that if possible.

## The First Experiment I Want to Run

The first TundraBench experiment should be small.

For each buggy program, I want to create two versions of the same repair task.

In the first version, the model gets only the program and the runtime error.

`Program + runtime error`

In the second version, the model gets the program, the runtime error, and a provenance trace.

`Program + runtime error + history of the failing value`

For example:
```tundra
val user = { name: "Ada", score: "10" };
val bonus = 5;
val total = user.score + bonus;

print(total);

```
The normal runtime error might say:

`Cannot add String and Number.`

A provenance trace could add:
```
user.score came from record field user.score
user.score was string "10"
bonus was number 5
total came from user.score + bonus
```

Then the question becomes:

Does this extra causal information help the model repair the program?

A useful first pilot could have:

```text
30–50 repair tasks
4–6 bug types
2 conditions: error-only and provenance-assisted
2–3 models
pass/fail scoring with tests
short failure analysis
```
The bug types might include:

```text
type mismatch
wrong field
wrong index
wrong branch
incorrect accumulator
swapped function arguments
```

The first useful system needs to **run programs, produce errors, produce traces, and support a small controlled experiment**.

### What Comes Next

The next step is to move from grammar to parser and AST.
That means implementing:

- parser structure
- AST node definitions
- declaration parsing
- expression parsing
- record and list parsing
- optional type annotation parsing
- parser tests

Once the parser works, Tundra will have the foundation needed for the interpreter, runtime errors, provenance tracking, and eventually TundraBench.

The project is still early, but the direction is clearer now. YAY! 




