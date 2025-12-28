---
layout: post
title:  "React useEffect vs useMemo vs useCallback — When To Use What"
date:   2025-12-28 10:00:00 +0000   # optional time and timezone
tags:
  - javascript
  - hooks
  - react
---
# React `useEffect` vs `useMemo` vs `useCallback` — When to Use What

If you’ve ever asked yourself:

- *When should I use* `useEffect`?
- *What’s the actual difference between* `useMemo` *and* `useCallback`?
- *Am I over-optimizing my React app?*

> You’re not alone.

These three hooks are some of the most misunderstood parts of React. They’re often overused, misused, or added “just in case” — which can actually hurt performance instead of helping it.

---

## Abstract

In this article, we’ll break down:

- what each hook is responsible for  
- when to use each hook  
- when **not** to use them  
- how they work together in a real-world example  

No magic. No memorization.  
Just **mental models that actually stick**.

---

## Table of Contents

1. [The Problem: Why This Gets Confusing](#the-problem-why-this-gets-confusing)
2. [`useEffect` — For Side Effects (Not Logic)](#useeffect--for-side-effects-not-logic)
3. [`useMemo` — For Caching Expensive Values](#usememo--for-caching-expensive-values)
4. [`useCallback` — For Stable Function References](#usecallback--for-stable-function-references)
5. [The Memory Trick (This One Actually Works)](#the-memory-trick-this-one-actually-works)
6. [A Real-World Example Using All Three](#a-real-world-example-using-all-three)
7. [A More Realistic Pattern](#a-more-realistic-pattern)
8. [Final Takeaway](#final-takeaway)

---

## The Problem: Why This Gets Confusing

Here’s a common situation:

- Your component re-renders constantly  
- Expensive calculations run on every render  
- Child components re-render even when nothing changed  
- API calls or side effects fire more often than expected  

Most of the time, these issues come from:

- using `useEffect` for the wrong reasons  
- overusing `useMemo`  
- using `useCallback` without understanding function identity  

---

## `useEffect` — For Side Effects (Not Logic)

### What `useEffect` Does

`useEffect` runs **after** your component renders.

Its only job is to handle **side effects** — things that interact with the world outside React’s render cycle.

```js
useEffect(() => {
  // side effect
}, [dependencies]);
```

---

## `useMemo` — For Caching Expensive Values

`useMemo` memoizes a value and recomputes it only when dependencies change.

```js
const value = useMemo(() => expensiveFn(input), [input]);
```

---

## `useCallback` — For Stable Function References

`useCallback` memoizes a function reference so it doesn’t change between renders.

```js
const handleClick = useCallback(() => {
  setCount(c => c + 1);
}, []);
```

---

## The Memory Trick (This One Actually Works)

- `useEffect` → runs side effects  
- `useMemo` → stores values  
- `useCallback` → stores functions  

---

## A Real-World Example Using All Three

```js
function App() {
  const [count, setCount] = useState(0);

  const value = useMemo(() => slowFn(count), [count]);

  const handleClick = useCallback(() => {
    setCount(c => c + 1);
  }, []);

  useEffect(() => {
    console.log(count);
  }, [count]);

  return <Child value={value} onClick={handleClick} />;
}
```
Each hook has **one clear responsibility** — and they don’t overlap.

---

## A More Realistic Pattern

```js
function App() {
  const [count, setCount] = useState(0);

  const expensiveValue = useMemo(
    () => slowFunction(count),
    [count]
  );

  const handleClick = useCallback(() => {
    setCount(c => c + 1);
  }, []);

  useEffect(() => {
    console.log("Count changed:", count);
  }, [count]);

  return (
    <div>
      <Display value={expensiveValue} />
      <Button onClick={handleClick} />
    </div>
  );
}

const Button = React.memo(function Button({ onClick }) {
  return <button onClick={onClick}>Increment</button>;
});
```
> Now the optimizations actually *matter*.
> 
---

## Final Takeaway

- run code *after render* → `useEffect`  
- cache *expensive values* → `useMemo`  
- keep *function references* stable → `useCallback`  

> Don’t optimize blindly. Optimize with intention.
