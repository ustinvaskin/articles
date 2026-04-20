---
layout: post
title:  "Building Tundra Language and Interpreter, Part 2: Definition and Experimentation"
date:   2026-04-20 10:00:00 +0000   # optional time and timezone
tags:
  - interpreter
  - scanning
  - parsing
  - programming language
---
# Building Tundra Language and Interpreter, Part 2: Definition and Experimentation

> Tundra Script - extention files `.tds`


#### Scanner code and tests

[GitHub repository: Tundra-lang](https://github.com/ustinvaskin/Tundra-lang)


----

Now that I have gone over the general structure of how a language and interpreter is built, it makes sense to define the language itself.

Tundra is a small dynamic language for scripting, text processing, and learning how languages are built. I want it to stay lightweight, readable, and pleasant to work on.

More specifically, **Tundra 0.1 is aimed at small transformation scripts**: reading input, reshaping it, and making the result easier to inspect when something goes wrong.

The core idea is simple:

Tundra is a language where transformed values can explain where they came from and how they were produced.

That is the identity I want to explore. Tundra is not meant to be the right language for everything. It is an experiment in **explainable transformation scripting**.

A normal script might look like this:
```
val raw = read("prices.txt");
val prices = map(splitLines(raw), parseNumber);
val total = sum(prices);

print(total);
```
In Tundra, the same program could also ask the value to explain itself:
```
print(origin(total));
print(history(total));
```
Possible output:
```
origin(total)
=> prices.txt

history(total)
=> read("prices.txt") -> splitLines -> map(parseNumber) -> sum
```

A lot of scripting work is transformation work. You read text, clean it up, split it apart, combine it, filter it, parse it, and might eventually get the wrong result. When that happens, it helps to know not only **what** a value is, but **how** it got there.

Tundra 0.1 is **dynamically typed** mostly as a scope-control decision. I want the first interpreter to be small enough to build, understand, and evolve. This is not a claim that dynamic typing is always better. For now, simplicity is more important.

The part I especially want to explore is **debug tracking**. When debug tracking is enabled, values can remember where they came from and how they were transformed. This should make debugging transformation scripts easier, without making normal execution heavier than it needs to be.

Importantly, debug tracking in Tundra is meant to be a debug feature, not a permanent runtime expense. In normal execution, tracking stays off so Tundra remains lightweight.

## 1. Design Goals
Tundra 0.1 has five main goals:

1. Stay small enough to implement and understand.
2. Support practical text and data transformation scripts.
3. Avoid surprising implicit behavior.
4. Make debugging transformations easier through optional provenance tracking.
5. Keep provenance readable, bounded, and useful instead of recording low-level interpreter noise.

#### The important identity is:

I am building a small scripting language where transformed values can explain themselves.

That gives Tundra a clearer reason to exist than simply being another small scripting language.

## 2. Hello, Tundra
Here is the classic first example:
```
print("Hello, world");
```
```
val raw = read("notes.txt");
val lines = splitLines(trim(raw));

print(lines);
print(history(lines));
```
A possible history is:
```
read("notes.txt") -> trim -> splitLines
```
Tundra uses braces because they are familiar, easy to type, and easy to read. My intention is not to make the language different just for the sake of being different. If an existing syntax is convenient, I would rather use that and not reinvent new for no reason.

Tundra also uses semicolons to end statements. For a first language, that makes the grammar and implementation much easier. I can always experiment with optional semicolons later, but for Tundra 0.1 I would rather keep the rules simple and explicit.

## 3. Tundra 0.1: The Core Language

Tundra is intentionally small. Since this is my first language, I would rather keep the design compact enough to fit in my head than try to build every feature at once.

The goal for version 0.1 is not to build the final perfect version of the language. The goal is to build a small working interpreter that proves the basic idea.

### 3.1 Dynamic Typing
Tundra is dynamically typed. A variable can hold any kind of value, and the same variable can hold different kinds of values at different points in the program.
```
var item = 42;
print(item);

item = "forty-two";
print(item);
```
If you try to do something silly, like divide a number by text, the error will happen at runtime.

That may change later if the language grows stricter, but for now simplicity matters more. Dynamic typing makes the first interpreter easier to build, but it also means some mistakes are caught later.

### 3.2 Automatic Memory Management

Tundra automatically manages memory.

Values can be created, stored in variables, placed in lists, passed to functions, and returned from functions without manual memory management. Once a value is not reachable anymore, its memory will eventually be reclaimed by the runtime.

Since the first interpreter will be written in Java, Java’s own memory management gives me this for free in the tree-walk version. If I later build a bytecode virtual machine, memory management becomes a much bigger topic.

### 3.3 Debug Mode: Values Know Their Origins

One of the main ideas I want to explore in Tundra is **traceability**.
When debug tracking is enabled, values may carry provenance information: where they first came from and what important operations produced them afterward.
```
val priceText = read("price.txt");
val price = parseNumber(priceText);
val total = price + 5;

print(history(total));
```
Conceptually, that flow looks like this:

```
[price.txt]
  ↓ read()
"10.0"
  ↓ parseNumber()
10.0
  ↓ + 5
15.0
```
A compact history might be:
```
read("price.txt") -> parseNumber -> + 5
```
For Tundra 0.1, the minimum debug helpers are:
```
origin(value);
history(value);
```
- `origin(value)` answers where a value started.
- `history(value)` answers how a value was transformed.

The goal is not to record everything forever. The goal is to record enough to explain where a value came from and why it has the value it has.

Useful history:
```
read("price.txt") -> trim -> parseNumber -> + 5
```
Unhelpful history:

```
allocate -> assign -> call -> return -> assign -> trim -> assign -> parseNumber -> assign -> add
```
Tundra should record programmer-meaningful transformations, not every tiny interpreter operation.

A reasonable first set of provenance rules is:

- assignment does not create new provenance
- arithmetic and text operations can add transformation steps
- function calls may preserve or extend provenance
- lists and records keep provenance of their values
- histories are bounded
- provenance exists only in debug mode

This is already enough to start testing whether the idea feels useful.

## 4. Core Types
The core types in Tundra 0.1 are:

- `booleans`
- `numbers`
- `strings`
- `none`
- `lists`
- `records`
- `functions`

During debugging, any ordinary runtime value may also carry provenance metadata. Provenance is not another type. It is additional metadata attached in debug mode.

### 4.1 Booleans
Tundra has two Boolean values:

- `true`
- `false`

Conditions **must** evaluate to Boolean values. Tundra does not do truthiness.

Numbers are not secretly true. Empty strings are not secretly false. none does not get to wander into control flow pretending to be a condition. 

I am choosing this for predictability. In a small language targeting debugging and transformation, explicit Boolean conditions are easier to reason about.

### 4.2 Numbers
`1234`
`12.34`

I am keeping the numeric model simple at first. Basic integers and decimals already cover a lot, and more specialized literal forms can come later if the language needs them.

### 4.3 Strings
Tundra strings are written in double quotes:

```
"I am text"
""
"123"
```
That last one is still text.

Tundra 0.1 also allows multiline strings:
```
val text = "hello
world
from Tundra";
```
This is useful because Tundra is meant to be good at small text-processing tasks. Sometimes the value being transformed is not one short line of text, but a chunk of text spread across multiple lines.
For now, strings are still simple. They use double quotes, may contain real newline characters, and end at the next double quote. Escape sequences and interpolation are not part of Tundra 0.1.

That means these are not supported yet:

```
"She said \"hello\""
"hello\nworld"
"Hello, ${name}"
```
A language that silently decides whether something is a number based on context is not a language I want to debug.

### 4.4 none
`none`

`none` represents the absence of a value.

Other languages use names like `null`. I chose none because it reads naturally and feels straightforward.

### 4.5 Lists
```
[1, 2, 3]
["red", "green", "blue"]
[]
```
Lists are included from the beginning because transformation scripts almost immediately need some kind of sequence type. They are practical enough that I would rather include them early on.


### 4.6 Records
Tundra includes records for structured data.
```
val order = {
  id: "A12",
  item: "Tea",
  price: 4.50
};
```
Records are intentionally simple. They are for structure, not for building a full object system. For the kind of transformation work Tundra is for, records are usually enough and avoid introducing extra complexity too early.

I am not trying to say that records are always better than classes. This is a local design choice for Tundra 0.1: start with the smallest structure that seems likely to cover the intended use cases. That is still something to explore and test throughout the implementation.

Because records use `:`, the scanner needs a `COLON` token in addition to commas, braces, and semicolons.

## 5. Expressions
Arithmetic, comparison, logical operators, and precedence behave in the usual way.

Tundra avoids implicit conversions. Operations either work on the correct types or fail. This keeps behavior predictable, especially when debugging.

### 5.1 Arithmetic
Tundra has the usual arithmetic operators:
```
a + b
a - b
a * b
a / b
-a
```
These operate on numbers. If you give them the wrong kinds of values, that is a runtime error.

For joining text, Tundra also uses `+`:
```
"Hello, " + name
```
I picked that because it is familiar and easy to remember. But Tundra does not silently coerce unrelated values. `+` works for number-plus-number and text-plus-text. It does not quietly convert everything into something convenient.

### 5.2 Comparison and Equality
Tundra can compare values:
```
a < b
a <= b
a > b
a >= b
a == b
a != b
```
Ordering comparisons are for numbers. Equality works across values, but different kinds of values are never equal.
```
123 == "123";   // false
314 == "pi";    // false
```

### 5.3 Logical Operators
Tundra uses a mixed style for logic: `!` for negation, and `and` and `or` for the binary operators.

```
!done
ready and valid
left or right
```
This is mostly a readability choice. I like `!` because it is compact, and I like **word operators** because they read well in small scripts.

### 5.4 Grouping and Precedence
Precedence works like this:
```
Highest precedence

    ()   calls, indexing, fields, grouping
    ! -  unary
    * /
    + -
    < > <= >=
    == !=
    and
    or

Lowest precedence
```

When you want to make precedence explicit, use parentheses:

`(min + max) / 2`

### 5.5 Calls, Fields, and Indexing

Function calls, field access, and indexing are all expressions too:
```
parse(text)
order.id
items[0]
```
These matter in real programs, so they belong in the language core from the beginning.

### 5.6 Origins and History
When debug tracking is enabled, these expose provenance information:

`origin(value)`
`history(value)`

For Tundra 0.1, these are the core debug helpers.

They are not special syntax. They parse like ordinary function calls. The runtime will define them as **built-in functions**.

## 6. Statements and Variables
Tundra distinguishes expressions from statements.

Some languages push further toward making everything an expression. I am not against that in principle, but for Tundra 0.1 I **prefer the simpler split**.

Expressions are for values and computation.

Statements are for declarations, assignment, loops, return, and control flow.

This means that if, while, and for are statements in Tundra 0.1. They control what code runs, but they do not produce values themselves.

So this is valid:
```
if (ready) {
  print("ready");
}
```
But this is not part of Tundra 0.1:
```
val message = if (ready) {
  "ready";
} else {
  "not ready";
};
```
If a function needs to return different values from different branches, it should use return:
```
def statusMessage(ready) {
  if (ready) {
    return "ready";
  }

  return "not ready";
}
```
Tundra distinguishes between values that **can** be reassigned and values that **cannot**:
```
val x = 1;
var y = 2;
```
- `val` is for names that should not be reassigned.
- `var` is for names that may change.

Tundra uses lexical scope. A name belongs to the block where it is declared and can be used inside nested blocks.
Tundra also includes an **explicit return statement** for functions:
```
return value;
return;
```
A return statement exits the nearest function immediately. A bare `return;` returns `none`.

`return` is not valid at the top level. It only makes sense inside a function body.

## 7. Control Flow
Tundra 0.1 includes:
```
if
while
for ... in
return
```
The basic conditional form looks like this:
```
if (ready) {
  print("ready");
}
```
An else branch can be used when there is an alternative path:
```
if (count == 0) {
  print("empty");
} else {
  print("not empty");
}
```
For version 0.1, conditions use parentheses. This keeps the parser close to the structure used in Crafting Interpreters and makes the first implementation easier.

Loops are included because transformation scripts often need to process sequences of values.

```
for (line in lines) {
  print(line);
}
```
Tundra also has while for cases where the loop depends on a changing condition:
```
while (index < length(items)) {
  print(items[index]);
  index = index + 1;
}
```
`if`, `while`, and `for` are statements, not value-producing expressions. This keeps the first version of the language simpler. If a branch needs to produce a function result, it should use return.
```
def parsePrice(text) {
  if (text == "") {
    return none;
  }

  return parseNumber(text);
}
```
return is included because functions need a simple way to exit early. This is especially useful where invalid input, missing data, or failed parsing should stop a function before the rest of the function runs.

## 8. Functions

Functions are values in Tundra. They can be stored in variables, passed to other functions, and returned from functions.

In Tundra 0.1, functions are introduced with named declarations using def. Anonymous function literals are not part of the language yet.

A simple function looks like this:
```
def sum(a, b) {
  return a + b;
}
```
For Tundra 0.1, I am choosing ***explicit return first***. This keeps the parser and interpreter easier to follow while I am still building the language.

A bare `return;` returns `none`:
```
def stopIfEmpty(text) {
  if (text == "") {
    return;
  }

  print(text);
}
```
The rule is simple:


- return expression; exits the nearest function and returns that expression
- return; exits the nearest function and returns none
- if no explicit return is reached, the function returns none

### Closures are supported.
```
def makeGreeter(prefix) {
  def greet(name) {
    print(prefix + name);
  }

  return greet;
}

val hello = makeGreeter("Hello, ");
hello("Tundra");
```
Here, `greet` can still use prefix even after `makeGreeter` has finished. That is useful for small scripts because it allows behavior to be packaged up and passed around without introducing classes or a larger object system.

Because Tundra 0.1 does not include anonymous function literals, **higher-order functions use named functions for now**. For example:

```
def double(x) {
  return x * 2;
}

val doubled = map(items, double);
```
That is slightly more verbose than an inline function syntax, but it keeps the first version of the parser and interpreter smaller.

> Anonymous function literals can be explored later if they become necessary.


## 9. Records Instead of Classes
Tundra uses `records` instead of `classes` in version 0.1.

This is a practical choice. Most scripts in this space deal with structured data rather than behavior-heavy objects. Records provide enough structure without introducing inheritance or a larger object model.

It is a **scoped design decision** for this language and this stage.

A simple record looks like this:
```
val person = {
  name: "Ada",
  age: 36
};

print(person.name);
```
Records can be used to represent parsed rows, configuration values, small objects, and intermediate transformation results.
Classes, methods, inheritance, and this can wait.


## 10. The Standard Library
Tundra starts small.
The initial library focuses on:

- file I/O
- text processing
- list operations
- parsing
- debugging helpers

A useful first library might include:

- `print(...)`
- `read(path)`
- `write(path, text)`
- `trim(text)`
- `split(text, sep)`
- `splitLines(text)`
- `join(items, sep)`
- `replace(text, old, new)`
- `upperCase(text)`
- `lowerCase(text)`
- `map(items, fn)`
- `filter(items, fn)`
- `fold(items, init, fn)`
- `length(items)`
- `parseNumber(text)`
- `origin(value)`
- `history(value)`

`origin` and `history` are the core debug helpers for version 0.1.

The functions `map`, `filter`, and `fold` take function values. Since Tundra 0.1 has named function declarations but not anonymous function literals, these are used with named functions:

```
def isNonEmpty(text) {
  return text != "";
}

val nonEmptyLines = filter(lines, isNonEmpty);
```
This is enough for the first version. It keeps higher-order operations possible without adding function-literal syntax immediately.

The library should stay small at first. I want to include enough tools to write useful transformation scripts and then learn from what feels missing.

## 11. Implementation Checkpoint: The Scanner
The first real implementation milestone is the scanner.

The scanner reads raw source code and turns it into tokens. It does not run the program. It does not understand variables. It does not know whether a function exists. It only breaks source text into meaningful pieces.

For Tundra 0.1, the scanner recognizes:

- punctuation like (, ), {, }, [, ], ,, ., ;, and :
- operators like +, -, *, /, !, !=, =, ==, <, <=, >, and >=
- numbers
- strings, including multiline strings
- identifiers
- keywords like `val`, `var`, `if`, `else`, `while`, `for`, `in`, `def`, `return`, `true`, `false`, and `none`
- line comments beginning with //
- an EOF token at the end of the source

A small input like this:

`val x = 42;`

becomes a token stream like this:
```
VAL
IDENTIFIER
EQUAL
NUMBER
SEMICOLON
EOF
```
The scanner also needs to report errors cleanly. 

For example, this should produce an error:

`val y = @;`
And this should produce an unterminated string error:

```
val text = "hello
world
```
The scanner has been tested with a combined file, `Tundra-lang/examples/test.tundra`, covering variables, arithmetic, comparisons, booleans, logic, control flow, loops, lists, records, functions, comments, multiline strings, and provenance helper calls.

It has also been tested with negative cases, such as an unexpected character and an unterminated string, in `Tundra-lang/examples/bad_tests.tundra`.

At this point, **Tundra can read source files and produce a correct token stream**. That is a small milestone, but it is an important one. The language is no longer only a design note. It has started becoming software.

## 12. How I Will Evaluate Tundra 0.1
Tundra 0.1 is not only a language design. It is also something I want to test through implementation.

The main question is whether debug provenance is actually useful, or whether it only sounds useful in theory.

For this version, the goal is practical: build the feature, test it on small transformation programs, and measure whether it gives useful information without making the interpreter too slow, too complicated, or too hard to understand.

For Tundra 0.1, I want to start with a small evaluation.

### Q1: Do history() and origin() reduce manual debugging work?
Without provenance, debugging usually means adding extra print statements or checking intermediate values one by one. With provenance, the question is whether `history()` shows enough information to reduce those extra steps.
#### A simple measurement is:
`manual debugging steps = number of extra print statements or inspections needed to locate the bug`

### Q2: Does provenance show the correct transformation path?
Each test program should have an expected path. For example:
read("price.txt") -> trim -> parseNumber -> + 5
Then I can compare that with the actual output of:
`history(total)`;

#### A useful measurement is:
`provenance completeness = important steps shown / important steps expected`

### Q3: Does the history output stay readable, compact, and bounded?
This is helpful:

`read("price.txt") -> trim -> parseNumber -> + 5`
This is too noisy:
`allocate -> assign -> call -> return -> assign -> trim -> assign -> parseNumber -> assign -> add`

#### Useful measurements are:
`history length = number of steps in history(value)
noise ratio = irrelevant steps / total history steps`

### Q4: Is the runtime and memory cost of debug mode acceptable?
The same scripts should be run in both modes: debug tracking off and debug tracking on.

#### Runtime overhead can be calculated like this:

`runtime overhead = ((debug time - normal time) / normal time) × 100`
#### Memory overhead can be calculated like this:

`memory overhead = ((debug memory - normal memory) / normal memory) × 100`

Some slowdown is acceptable in debug mode, but normal execution should stay lightweight when tracking is turned off.

These measurements will not prove that the design is perfect, but they will show whether the idea works well enough for Tundra 0.1.

The design is successful if origin and history make transformed values easier to understand, reduce manual debugging work, stay compact, and only add acceptable overhead.

## 13. To Implement Later
This section is for ideas that are interesting, but not necessary for Tundra 0.1.

I want to keep the bigger vision visible, while keeping the first implementation small enough to actually build.

### 13.1 lineage(value)
`lineage(value)` would answer which input values, lines, rows, or fields contributed to a value.

Example:
```
val rows = readCsv("prices.csv");
val valid = filter(rows, hasValidPrice);
val total = sum(map(valid, getPrice));

lineage(total);
```
Possible output:
```
prices.csv rows 1, 2, 3, 5, 8
```
This is stronger than history, because history says what transformations happened, while lineage says which input pieces mattered.

But this is also harder. It requires deeper collection-level tracking, especially through `map`, `filter`, and `fold`.

So lineage is a later feature.

### 13.2 explain(value)

`explain(value)` would produce a human-readable explanation that combines origin, history, and lineage.

Example:
```
total came from prices.txt. It was produced by splitting the file into lines,
parsing each line as a number, and summing the parsed values.
```
This is useful, but it depends on having good lower-level provenance first. So it should come after origin, history, and probably lineage.

### 13.3 explainMissing(collection, value)

Many transformation bugs are not just about wrong values. They are about missing values.
```
For example:
val rows = readCsv("people.csv");
val adults = filter(rows, isAdult);

print(explainMissing(adults, rows[4]));
```
Possible output:
```
people.csv row 4 was not included in adults.
Reason: filter condition isAdult(row) returned false.
row.age was 16.
```

##### This is a powerful debugging question:
Why did this row disappear?
Why was this value included?
Why did this become none?
Which input caused this output?
Which transformation changed this value?

This is one of the clearest demonstrations of why Tundra could be useful, but it is also much more advanced than the first interpreter needs to be.

### 13.4 explainIncluded(collection, value)
This would be the opposite of explainMissing.
Instead of asking why a value disappeared, it asks why a value survived a transformation.

That could be useful for debugging filters, joins, and other collection operations.

### 13.5 Lightweight Schemas
Tundra starts as a dynamic language, but provenance becomes more useful when the runtime knows something about the expected shape of data.
A later version could support lightweight schemas:
```
schema PriceRow {
  item: text,
  price: number
}

val rows = readCsv("prices.csv") as List<PriceRow>;
```
This would not need to become a **full static type system immediately**. It could begin as runtime validation plus better error messages.

For example:
```
Expected price to be number.
Found text "N/A" at prices.csv row 7, column price.
History: readCsv("prices.csv") -> as List<PriceRow>
```
This is not required for Tundra 0.1. It is a promising direction after the basic interpreter works.

### 13.6 Anonymous Function Literals
Tundra 0.1 uses named functions.

Later, it might be useful to write inline functions for `map`, `filter`, and `fold`.
Something like:

```
val doubled = map(items, fn (x) {
  return x * 2;
});
```
or maybe a shorter syntax.

But anonymous functions add parser and runtime complexity, so they can wait.

### 13.7 Optional Semicolons

Tundra 0.1 requires semicolons.

Later, I might experiment with optional semicolons. But that means the scanner and parser need clearer rules for where statements end, especially around multiline expressions.

For the first version, explicit semicolons are simpler.

### 13.8 Classes
For Tundra 0.1, records are enough.

Classes may become useful later if the language needs behavior-heavy objects, but they are not part of the first implementation plan. For now, Tundra is focused on transformation scripts, structured data, functions, and provenance.

### 13.9 Final Expression Returns

Tundra 0.1 uses explicit return:
```
def sum(a, b) {
  return a + b;
}
```
A later version could allow a function’s final expression to be returned automatically:
```
def sum(a, b) {
  a + b;
}
```
Final-expression returns are convenient, but they add extra semantics to function bodies. They can wait until the basic function system works.

### 13.10 Escape Sequences and String Interpolation

Tundra 0.1 allows multiline strings, but it does not support escape sequences or interpolation yet.
Later, I may add strings like:
```
"She said \"hello\""
"hello\nworld"
"Hello, ${name}"
```
These features are useful, but they add scanner and parser complexity. Plain multiline strings are enough for now.

## 14. Notes and Open Questions
This is not a final specification. It is the current shape of the idea.
Some decisions are based on existing work around debugging, provenance, transformation metadata, and programming environments. Others are simply practical choices for version 0.1. And some are open questions that the implementation should help answer.

The most important design decision is that Tundra should separate several kinds of explanation:

- `origin`   where did this come from?
- `history`  how was this transformed?
- `lineage`  which inputs contributed?
- `explain`  how can this be described to a human?

For Tundra 0.1, I will focus on `origin` and `history`.

The rest belongs in later versions.

#### There are still open questions:
- How much history is enough?
- Which operations should count as important transformations?
- How should provenance work inside lists and records?
- How much overhead does debug mode add?
- Should schemas be added later for better error messages?
- Should optional semicolons be added later?
- Should Tundra eventually have classes, or are records enough?
- How should multiline strings interact with future escape sequences?


This gives Tundra a stronger identity than simply being a small dynamic language.

Tundra 0.1 is the smallest version that can test the idea: a small scripting language where transformed values can begin to explain themselves.

## 15. References

1. Jonathan Edwards and Marcel Taeumel, editors. *Proceedings of the 2024 ACM SIGPLAN International Symposium on New Ideas, New Paradigms, and Reflections on Programming and Software (Onward! 2024).* ACM, 2024. <https://www.sigplan.org/OpenTOC/onward24.html>

2. Mark Marron. “A Programming Language for Data and Configuration!” *Onward! 2024*, pp. 147–161. DOI: <https://doi.org/10.1145/3689492.3690054>

3. Zhifei Chen, Lin Chen, Yibiao Yang, Qiong Feng, Xuansong Li, and Wei Song. “Risky Dynamic Typing-related Practices in Python: An Empirical Study.” *ACM Transactions on Software Engineering and Methodology*, 33(6), Article 140, 2024. DOI: <https://doi.org/10.1145/3649593>

4. Asumu Takikawa, Daniel Feltey, Ben Greenman, Max S. New, Jan Vitek, and Matthias Felleisen. “Is Sound Gradual Typing Dead?” *POPL 2016*, pp. 456–468. DOI: <https://doi.org/10.1145/2837614.2837630>

5. Juan de Lara, Esther Guerra, and Jesús Sánchez Cuadrado. “Have Model Transformation Languages Failed? On the Rise, Fall and Revival of Model Transformation Languages.” *Software and Systems Modeling*, 2026. DOI: <https://doi.org/10.1007/s10270-026-01360-2>

6. Andrei Chiş, Tudor Gîrba, and Oscar Nierstrasz. “Moldable Exceptions.” *Onward! 2024*. DOI: <https://doi.org/10.1145/3689492.3690044>

7. Karoliine Holter, Juhan Oskar Hennoste, Patrick Lam, Simmo Saan, and Vesal Vojdani. “Abstract Debuggers: Exploring Program Behaviors using Static Analysis Results.” *Onward! 2024*. DOI: <https://doi.org/10.1145/3689492.3690053>

8. Jingyuan Chen, Lei Zhang, Leon Schuermann, Gongqi Huang, Ravi Netravali, and Amit Levy. “Wherefore Art Thou? Provenance-Guided Automatic Online Debugging with Lumos.” arXiv, 2026. <https://arxiv.org/abs/2603.29013>

9. Andrew Blinn, Xiang Li, June Hyung Kim, and Cyrus Omar. “Statically Contextualizing Large Language Models with Typed Holes.” *Proceedings of the ACM on Programming Languages*, 8(OOPSLA2), 2024. DOI: <https://doi.org/10.1145/3689728>

10. George Alter, Darrell Donakowski, Jack Gager, Pascal Heus, Carson Hunter, Sanda Ionescu, Jeremy Iverson, and others. “Provenance Metadata for Statistical Data: An Introduction to Structured Data Transformation Language (SDTL).” *IASSIST Quarterly*, 44(4), 2020. DOI: <https://doi.org/10.29173/iq983>

11. Stefan Fehrenbach and James Cheney. “Language-integrated Provenance.” *PPDP 2016*, pp. 214–227. DOI: <https://doi.org/10.1145/2967973.2968604>


---
#### Code 
[-> Tundra-lang](https://github.com/ustinvaskin/Tundra-lang)

---- 
