---
layout: post
title:  "Building Tundra Language and Interpreter, Part 3: Teaching Tundra to Read"
date:   2026-04-24 10:00:00 +0000   # optional time and timezone
tags:
  - interpreter
  - scanning
  - parsing
  - programming language
---

# Building Tundra Language and Interpreter, Part 3: Teaching Tundra to Read

In the last part, I defined the shape of Tundra 0.1. Now it is time to actually start building.

The first thing the language needs to do is pretty basic: read source code. Not run it. Not understand all of it. Not evaluate expressions. Just **read** it and break it into meaningful pieces.


That first step is called **scanning**, or sometimes **lexing**.

The scanner takes raw source code like this:

`val x = 42;`
and turns it into tokens:

```
VAL
IDENTIFIER
EQUAL
NUMBER
SEMICOLON
EOF
```

Not glamorous, but it is the first real moment where Tundra starts becoming software instead of just an idea.

Characters Are Not Enough

When I look at this:


`val name = "Tundra";`

I immediately understand the pieces - a **keyword**, a **name**, an **equals sign**, a **string**, a **semicolon**. But the computer just sees characters:


`v a l   n a m e   =   " T u n d r a " ;`

So the scanner's job is to walk through those characters and group them into useful chunks called tokens:

```
val       -> VAL
name      -> IDENTIFIER
=         -> EQUAL
"Tundra"  -> STRING
;         -> SEMICOLON
```
A programming language is not magic. It is layers. First raw text, then tokens, then syntax trees, then interpretation, then hopefully something useful. 

Right now I am at the token layer.

## The Scanner Files
For this stage, I added four main files:

`TokenType.java` — defines all the kinds of tokens Tundra knows about: `VAL`, `VAR`, `IDENTIFIER`, `STRING`, `NUMBER`, `LEFT_PAREN`, `SEMICOLON`, `EOF`, and so on...

`Token.java` — stores one token, including its type, lexeme, literal value, line number, and start/end offsets. 

The offsets will come in handy later for better errors and debug information.

`Scanner.java` — does the actual work, walking through the source text character by character.

`Tundra.java` — the entry point. Right now it just reads source code, runs the scanner, and prints the tokens.


### What Tundra Can Scan So Far

The scanner recognizes the basic pieces of Tundra 0.1: delimiters `( )``{ }` `[ ]`, punctuation `,` `.` `;` `:`, operators `+` `-` `*` `/` `!` `!=` `=` `==` `<` `<=` `>` `>=`, and keywords like `val` `var` `if else` `while` for in `def` return `true` `false` `none` `and` `or`.

It also handles identifiers — name, total, splitLines, parseNumber, and so on.

One thing worth noting: `print`, `read`, `origin`, and `history` are not special syntax. They scan as plain `identifiers`. That means this:


`history(total);`

is just a normal function call as far as the scanner is concerned. Later, the runtime can decide that history is a built-in debug helper — but the scanner does not need to know that. 

Keeping that distinction out of the scanner means the language grammar stays simpler, and built-ins can be added or changed without touching the scanning rules.

### Records Need :
One Tundra-specific detail I had to handle was the colon token. Tundra 0.1 uses records:

```
val order = {
  id: "A12",
  item: "Tea",
  price: 4.50
};
```
So the scanner needs to recognize `:`. That record gets broken into pieces like:

```
VAL IDENTIFIER EQUAL LEFT_BRACE
IDENTIFIER COLON STRING COMMA
IDENTIFIER COLON STRING COMMA
IDENTIFIER COLON NUMBER
RIGHT_BRACE SEMICOLON
```

The scanner still does not know this is a record — that is the parser's job. It only knows: I saw a `{`, then a `name`, then a `:`, then a value-looking thing. That is enough for now.

### Lists and Indexing
Tundra has lists and indexing:

```
val numbers = [1, 2, 3];
val first = numbers[0];
```
Both use square brackets. The scanner does not care whether `[` starts a list or an index operation — it just emits `LEFT_BRACKET` or `RIGHT_BRACKET`. The parser will figure out the meaning based on context. This is one of those moments where the separation starts making sense: the scanner reads pieces, the parser understands structure.


### Multiline Strings
Tundra 0.1 allows multiline strings:

```
val text = "hello
world
from Tundra";
```

Because Tundra is meant to be useful for text processing, this felt like a natural fit. The scanner keeps reading until it finds the closing quote, counting lines along the way so subsequent tokens still get the right line number.

For now, strings are simple — no escape sequences, no \n, no interpolation. Just plain **double-quoted strings with real newlines allowed***. That is enough for this version.

### Comments
Tundra supports line comments:

```
// this is a comment
val x = 1; // this is also a comment
```
When the scanner sees `//`, it skips everything until the end of the line. Comments never become tokens, which means the parser and interpreter never need to care about them.

### Testing the Scanner

Once the scanner was written, I tested it with a file containing a little bit of everything:

```
val name = "Tundra";
var count = 42;

count = count + 1;
print(name);

val numbers = [1, 2, 3];
val first = numbers[0];

val order = {
  id: "A12",
  item: "Tea",
  price: 4.50
};

print(order.price);

def sum(x, y) {
  return x + y;
}

val text = "hello
world
from Tundra";

print(text);
For example, val x = 42; prints:
```
```
VAL val null [line=1, start=0, end=3]
IDENTIFIER x null [line=1, start=4, end=5]
EQUAL = null [line=1, start=6, end=7]
NUMBER 42 42.0 [line=1, start=8, end=10]
SEMICOLON ; null [line=1, start=10, end=11]
EOF  null [line=1, start=11, end=11]
I also tested bad input. val y = @; gives:
```


`[line 7] Error: Unexpected character: '@'.`

And an unfinished string gives:


`[line 10] Error: Unterminated string.`
That part matters too. A language needs to handle wrong code, not just correct code.


### A Small But Real Milestone
At this point, Tundra can read source files and turn them into tokens. It cannot execute anything, parse expressions, or build an AST yet — but it can recognize its own source code. That is the first actual working piece of the interpreter.
The next step is to take those tokens and turn them into something structured:

```
tokens
  ↓
parser
  ↓
AST
```
An **AST** is an **Abstract Syntax Tree** — where the flat token list becomes a real structure. The scanner sees `NUMBER PLUS NUMBER STAR NUMBER`, but the parser should understand `1 + (2 * 3)`. That is what comes next.

> Tundra can read. Next, it needs to understand.

--- 
The main changes: merged the choppy short paragraphs into flowing prose, cut the duplicate pipeline diagram, trimmed the filler sentiment lines to just one at the end, and added a sentence explaining why history scanning as an identifier keeps things cleaner.

For now, I am happy with this checkpoint.
**Tundra can read.**
Next, Tundra needs to understand.
