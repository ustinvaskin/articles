---
layout: post
title:  "Руководство по React Hooks: Чистый и эффективный код на функциональных компонентах"
date:   2020-11-11 10:00:00 +0000   # optional time and timezone
---


# Руководство по React Hooks: Чистый и эффективный код на функциональных компонентах

**Краткое содержание**

В этом руководстве вы узнаете, зачем использовать React Hooks, как они облегчают разработку на функциональных компонентах и как создавать собственные хуки для повторного использования логики.

---


## Введение

React Hooks появились в версии 16.8 (2019) и позволили сочетать мощь функциональных компонентов с возможностями классовых (состояние, жизненные циклы) без громоздкой синтаксической обвязки `class` и `this`.

## Зачем нужны Hooks

- **Чистота и лаконичность**. Убирают boilerplate-код: нет нужды в конструкторах и `this`.  
- **Повторное использование логики**. Кастомные хуки позволяют выносить общую логику в отдельные функции.  
- **Производительность**. Функциональные компоненты с хуками часто работают быстрее и проще оптимизируются.

## От функциональных и классовых компонентов к Hooks

### Пример классического компонента

```
class Header extends React.Component {
  render() {
    return (
      <div>
        <h1>Title</h1>
        <h4>Subtitle</h4>
      </div>
    );
  }
}
```
Аналог на функциональном компоненте с Hooks
```
const Header = () => (
  <div>
    <h1>Title</h1>
    <h4>Subtitle</h4>
  </div>
);
```
Функциональный компонент короче и не требует `class`, `constructor` и `render()`.

Основные встроенные хуки

`useState`

```
import React, { useState } from 'react';

function Example() {
  const [count, setCount] = useState(0);
  return (
    <div>
      <p>Вы нажали {count} раз</p>
      <button onClick={() => setCount(count + 1)}>
        Нажми меня
      </button>
    </div>
  );
}

```
`useState(initial)` возвращает пару: текущее состояние и функцию для его обновления.

`useEffect`

```
import React, { useState, useEffect } from 'react';

function DataFetcher({ url }) {
  const [data, setData] = useState(null);

  useEffect(() => {
    fetch(url)
      .then(res => res.json())
      .then(setData);
  }, [url]);

  return data ? <pre>{JSON.stringify(data, null, 2)}</pre> : <p>Загрузка...</p>;
}
```
`useEffect(fn, deps)` запускает fn после рендера; обновляется при изменении зависимостей deps.

### Создание собственных хуков
Кастомный хук — это функция, имя которой начинается с use и использует другие хуки внутри.

```
import { useState } from 'react';

export function useCounter(start = 0, step = 1, end = Infinity) {
  const [count, setCount] = useState(start);

  function increment() {
    setCount(prev => (prev + step <= end ? prev + step : start));
  }

  return [count, increment];
}
```
### Практические примеры
Компонент Header

```
const Header = () => (
  <header>
    <h1>Мой сайт</h1>
    <p>Добро пожаловать!</p>
  </header>
);

```
Счётчик с useState

```
function ClickCounter() {
  const [count, setCount] = useState(0);
  return (
    <button onClick={() => setCount(count + 1)}>
      Вы нажали {count} раз
    </button>
  );
}
```
`useCounter` (кастомный хук)


```
function CounterDemo() {
  const [count, increment] = useCounter(0, 5, 100);
  return (
    <div>
      <p>Счёт: {count}</p>
      <button onClick={increment}>Увеличить</button>
    </div>
  );
}
```
Рекомендации и лучшие практики
Всегда указывайте зависимости в `useEffect`.

Избегайте лишних ререндеров с `React.memo` и `useCallback`.

Пишите чистые и предсказуемые хуки (без побочных эффектов внутри кастомного хука).

### Заключение
React Hooks упростили работу с состоянием и побочными эффектами в функциональных компонентах, сделав код чище и более повторно используемым.

Дополнительные ресурсы
Официальная документация: https://reactjs.org/docs/hooks-intro.html

Правила Hooks: https://reactjs.org/docs/hooks-rules.html

