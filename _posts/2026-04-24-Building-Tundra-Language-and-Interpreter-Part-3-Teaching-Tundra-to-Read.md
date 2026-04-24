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

<div style="max-width:760px;margin:1.5rem auto;padding:20px;border:1px solid #ddd;border-radius:16px;font-family:system-ui,sans-serif;">

  <div style="margin-bottom:20px">
    <div style="font-size:11px;letter-spacing:0.12em;color:#534AB7;font-weight:600;margin-bottom:4px">
      TUNDRA LANGUAGE · PART 3
    </div>
    <div style="font-size:27px;font-weight:600;line-height:1.2">
      The Scanner
    </div>
    <div style="font-size:13px;color:#666;margin-top:3px">
      How raw source code becomes tokens — the first real step
    </div>
  </div>

  <div style="display:flex;gap:10px;align-items:stretch;margin-bottom:18px;flex-wrap:wrap;">

    <div style="flex:1;min-width:220px;background:#EEEDFE;border:1px solid #AFA9EC;border-radius:12px;padding:14px 16px;">
      <div style="font-size:10px;letter-spacing:0.1em;font-weight:600;text-transform:uppercase;margin-bottom:10px;color:#3C3489">
        Source code
      </div>

      <div style="font-family:monospace;font-size:13px;line-height:2;margin-bottom:12px">
        <span style="color:#534AB7;font-weight:600">val</span>
        <span style="color:#185FA5">name</span>
        <span style="color:#3C3489">=</span>
        <span style="color:#854F0B">"Tundra"</span><span style="color:#5F5E5A">;</span>
      </div>

      <div style="border-top:1px solid #AFA9EC;padding-top:10px;font-size:10px;color:#534AB7;line-height:1.6">
        The computer sees:<br>
        <span style="font-family:monospace;letter-spacing:0.12em;opacity:0.65">
          v a l &nbsp; n a m e &nbsp; = ...
        </span>
      </div>
    </div>

    <div style="display:flex;flex-direction:column;align-items:center;justify-content:center;gap:6px;padding:0 4px;">
      <div style="font-size:18px;color:#534AB7;">→</div>
      <div style="background:#534AB7;color:#fff;border-radius:10px;padding:10px 14px;text-align:center">
        <div style="font-size:12px;font-weight:600">Scanner</div>
        <div style="font-size:10px;opacity:0.75;margin-top:2px">char by char</div>
      </div>
      <div style="font-size:18px;color:#534AB7;">→</div>
    </div>

    <div style="flex:1;min-width:220px;background:#E1F5EE;border:1px solid #5DCAA5;border-radius:12px;padding:14px 16px;">
      <div style="font-size:10px;letter-spacing:0.1em;font-weight:600;text-transform:uppercase;margin-bottom:10px;color:#085041">
        Tokens
      </div>

      <div style="display:flex;flex-direction:column;gap:6px">
        <div><span style="background:#CECBF6;color:#26215C;font-size:10px;font-weight:600;padding:2px 7px;border-radius:4px;">VAL</span> <span style="font-family:monospace;font-size:12px;">val</span></div>
        <div><span style="background:#B5D4F4;color:#042C53;font-size:10px;font-weight:600;padding:2px 7px;border-radius:4px;">IDENTIFIER</span> <span style="font-family:monospace;font-size:12px;">name</span></div>
        <div><span style="background:#D3D1C7;color:#2C2C2A;font-size:10px;font-weight:600;padding:2px 7px;border-radius:4px;">EQUAL</span> <span style="font-family:monospace;font-size:12px;">=</span></div>
        <div><span style="background:#FAC775;color:#412402;font-size:10px;font-weight:600;padding:2px 7px;border-radius:4px;">STRING</span> <span style="font-family:monospace;font-size:12px;">"Tundra"</span></div>
        <div><span style="background:#D3D1C7;color:#2C2C2A;font-size:10px;font-weight:600;padding:2px 7px;border-radius:4px;">SEMICOLON</span> <span style="font-family:monospace;font-size:12px;">;</span></div>
        <div><span style="background:#D3D1C7;color:#2C2C2A;font-size:10px;font-weight:600;padding:2px 7px;border-radius:4px;">EOF</span></div>
      </div>
    </div>

  </div>

  <div style="border-top:1px solid #ddd;margin:18px 0 16px"></div>

  <div>
    <div style="font-size:10px;letter-spacing:0.1em;font-weight:600;text-transform:uppercase;margin-bottom:10px;color:#666">
      The language pipeline
    </div>

    <div style="display:flex;align-items:center;gap:6px;flex-wrap:wrap;row-gap:8px">
      <div style="border:1px solid #ddd;border-radius:6px;padding:6px 12px;font-size:12px;">Raw text</div>
      <div>→</div>
      <div style="background:#CECBF6;border:1px solid #AFA9EC;color:#26215C;border-radius:6px;padding:6px 12px;font-size:12px;font-weight:600;">Scanner · here</div>
      <div>→</div>
      <div style="border:1px solid #ddd;border-radius:6px;padding:6px 12px;font-size:12px;">Tokens</div>
      <div>→</div>
      <div style="border:1px solid #ddd;border-radius:6px;padding:6px 12px;font-size:12px;">Parser</div>
      <div>→</div>
      <div style="border:1px solid #ddd;border-radius:6px;padding:6px 12px;font-size:12px;">AST</div>
      <div>→</div>
      <div style="border:1px solid #ddd;border-radius:6px;padding:6px 12px;font-size:12px;">Interpreter</div>
    </div>

    <div style="font-size:11px;color:#777;margin-top:8px">
      Next up: the parser gives tokens structure — 1 + 2 * 3 becomes a tree, not a list.
    </div>
  </div>

</div>

![Tundra scanner](https://raw.githubusercontent.com/ustinvaskin/articles/refs/heads/main/assets/scanner-tundra.png){: width="550" }

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
