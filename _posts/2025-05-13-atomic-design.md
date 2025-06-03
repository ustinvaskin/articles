---
layout: post
title:  "Atomic Design"
date:   2025-05-13 10:00:00 +0000   # optional time and timezone
tags:
  - react
  - atomic design
  - ui
---

# Structuring Your React UI with Atomic Design

> 📌 **Tip:** начинайте с минимальных «атомов» и выделяйте компоненты только при необходимости повторного использования.

Here’s a little guide to structuring your React UI using Atomic Design and balancing component granularity—and deep dives into performance overhead, indirection pitfalls, and other common trade‑offs.

---

## 1. What Is Atomic Design?

Atomic Design (Brad Frost, 2013) applies a chemistry metaphor to UIs:

- **Atoms**: Basic, single-purpose building blocks (e.g. buttons, inputs, labels).
- **Molecules**: Simple groups of atoms working together (e.g. a labeled input with a button).
- **Organisms**: Complex UI sections composed of molecules and atoms (e.g. a header with navigation and search).

This bottom‑up approach promotes consistency, reusability, and discoverability in DevTools.

---

## 2. Atoms

### Definition

Smallest, most reusable UI parts. No internal composition.

### Examples

```jsx
// Button.jsx
export function Button({ children, onClick }) {
  return <button onClick={onClick}>{children}</button>;
}

// Input.jsx
export function Input({ id, value, onChange }) {
  return <input id={id} value={value} onChange={onChange} />;
}
```

### Best Practices

- Controlled via props: All state and events passed in.
- Styling consistency: Use design tokens or a CSS framework.
- Isolated & Pure: No side‑effects; easy to unit‑test.

---

## 3. Molecules

### Definition

Combinations of atoms forming a functional unit.

### Examples

```jsx
// SearchField.jsx
import { Label } from './Label';
import { Input } from './Input';
import { Button } from './Button';

export function SearchField({ query, onChange, onSearch }) {
  return (
    <div className="flex items-center space-x-2">
      <Label htmlFor="search">Search</Label>
      <Input id="search" value={query} onChange={e => onChange(e.target.value)} />
      <Button onClick={onSearch}>Go</Button>
    </div>
  );
}
```

### Best Practices

- Encapsulation: Only manage its own layout/behavior.
- Minimal API: Expose necessary props (no leaking internals).
- Reusability: Should justify its own file only if used in more than one place.

---

## 4. Organisms

### Definition

Distinct, self‑contained UI sections.

### Examples

```jsx
// Header.jsx
import { Logo } from './Logo';
import { NavItem } from './NavItem';
import { SearchField } from './SearchField';

export function Header({ links, searchProps }) {
  return (
    <header className="flex justify-between p-4 bg-white shadow">
      <Logo />
      <nav className="flex space-x-4">
        {links.map(l => <NavItem key={l.href} {...l} />)}
      </nav>
      <SearchField {...searchProps} />
    </header>
  );
}
```

### Best Practices

- Layout only: Delegate data fetching and logic to hooks or containers.
- Configurable: Accept props to vary content.
- DevTools clarity: Clear component and file names.

---

## 5. Performance Overhead & Reconciliation Costs

Every React component incurs work during rendering and reconciliation:

- Virtual DOM diffing: More components → more nodes to diff each update.
- Reconciliation callbacks: React must determine if a component should update.
- Memory: Each component instance has its own props and state objects.

### When it matters

- Deeply nested trees of tiny components render thousands of React elements per frame.
- Animations or frequent updates (e.g. list virtualization) can reveal overhead.

### Mitigations

- `React.memo`: Wrap pure functional components to skip unnecessary re‑renders.
- `useCallback` & `useMemo`: Stabilize props for child components.
- Batch updates: Minimize state changes per frame.
- Profiling: Use React Profiler to spot hotspots.

---

## 6. Unnecessary Indirection & Over‑Extraction

Extracting a chunk of JSX into its own component when it’s only used in one place can hurt rather than help:

1. Indirection: Readers must navigate files or scroll to see implementation.
2. Prop bloat: More layers often means passing the same props through intermediate components.
3. Debugging friction: Stack traces and DevTools focus jump around.

### Rule of thumb

Only extract when:

- You need reuse across multiple UI sections.
- The logic/markup is complex enough to warrant isolation.
- Testing in isolation is a clear win.

---

## 7. Other Common Pitfalls

- **Prop‑Drilling vs. Context**: Too many props through layers signals need for Context, but overusing Context can introduce hidden dependencies and reduce testability.
- **CSS Fragmentation**: Too many component‑scoped styles can bloat your CSS output.
- **Naming Collisions**: Consistent naming conventions (e.g. atoms/, molecules/, organisms/) prevent confusion.
- **Merge Conflicts**: Micro‑components reduce conflict surface but increase the number of pull requests.

---

## 8. Balancing Act & Folder Structure

1. **Feature Folders**: Group related atoms, molecules, and organisms in a single feature directory:
    ```
    /feature/UserProfile
      Avatar.jsx       // Atom
      NameLabel.jsx    // Atom
      UserInfoGroup.jsx // Molecule
      ProfileHeader.jsx // Organism
    ```

2. **Barrel Export**:
    ```js
    // index.js
    export { Avatar } from './Avatar';
    export { UserInfoGroup } from './UserInfoGroup';
    ```

3. **Documentation & Storybook**:
    Document atoms and molecules in Storybook—helps spot unused components and visualize overhead.

---

## Bottom Line

Leverage Atomic Design to build a consistent, discoverable, and maintainable React component library. Extract components thoughtfully—avoid unneeded indirection, keep an eye on reconciliation costs, and maintain clear organization to reduce cognitive load.

