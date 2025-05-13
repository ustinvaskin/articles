---
layout: post
title:  "Atomic Design"
date:   2025-05-13 10:00:00 +0000   # optional time and timezone
---

# Новые методы массивов в JavaScript

JavaScript включает в себя набор новых методов массивов, созданных для того, чтобы код стал более читаемым, удобным в поддержке и эффективным. Эти методы помогают сохранять неизменяемость данных (immutability), упрощают работу с массивами и уменьшают побочные эффекты. Давайте разберёмся, какие новые мощные инструменты теперь есть в JavaScript.

## Зачем нужна неизменяемость (immutability) данных?

Всем известны методы массивов, таких как `sort()`, `reverse()` и `splice()`, они, к сожалению, изменяют оригинальный массив, что может привести к проблемам и багам, особенно в крупных приложениях, где один и тот же массив может использоваться в разных частях кода. Неизменяемость (работа с данными без их прямого изменения) помогает избежать этих проблем. Новые методы возвращают новые массивы, а не модифицируют существующие.

## Обзор новых методов

### 1. `findLast()` и `findLastIndex()`

Эти методы работают как `find()` и `findIndex()`, но ищут элементы справа налево.

```js
const numbers = [1, 5, 3, 5, 2];

const lastFive = numbers.findLast(num => num === 5); // 5
const lastFiveIndex = numbers.findLastIndex(num => num === 5); // 3
```

### 2. `toReversed()`

Возвращает новый массив с элементами в обратном порядке, не изменяя оригинальный.

```js
const originalArray = [1, 2, 3];
const reversedArray = originalArray.toReversed(); // [3, 2, 1]

console.log(originalArray); // [1, 2, 3]
```

### 3. `toSorted()`

Возвращает новый отсортированный массив, не затрагивая оригинальный.

```js
const unsortedArray = [3, 1, 4, 2];
const sortedArray = unsortedArray.toSorted(); // [1, 2, 3, 4]

console.log(unsortedArray); // [3, 1, 4, 2]
```

### 4. `toSpliced()`

Неизменяемая версия `splice()`. Позволяет удалять или добавлять элементы, создавая новый массив.

```js
const myArray = [1, 2, 3, 4];
const newArray = myArray.toSpliced(1, 2, 5, 6); // [1, 5, 6, 4]

console.log(myArray); // [1, 2, 3, 4]
```

### 5. `with()`

Позволяет заменить элемент по индексу, не изменяя оригинал.

```js
const myArray = [10, 20, 30];

// Прямое изменение (небезопасно)
myArray[1] = 25;
console.log(myArray); // [10, 25, 30]

// С `with()`
const newArray = myArray.with(1, 25);
console.log(newArray); // [10, 25, 30]
console.log(myArray);  // [10, 20, 30]
```

### 6. `group()` и `groupToMap()` (Node.js 20+, браузеры)

Группируют элементы по ключу.

```js
const users = [
  { name: "Jacob", age: 25 },
  { name: "Bob", age: 30 },
  { name: "Charlie", age: 25 }
];

const groupedByAge = users.group(user => user.age);
console.log(groupedByAge);
/*
{
  25: [{ name: "Jacob", age: 25 }, { name: "Charlie", age: 25 }],
  30: [{ name: "Bob", age: 30 }]
}
*/

const groupedMap = users.groupToMap(user => user.age);
console.log(groupedMap.get(25));
```

### 7. `at()`

Получение элементов по индексу, включая отрицательные.

```js
const myArray = [10, 20, 30, 40];

console.log(myArray.at(-1)); // 40
console.log(myArray.at(-2)); // 30
console.log(myArray.at(1));  // 20
```

### 8. `flat()` и `flatMap()`

`flat()` разворачивает вложенные массивы.

```js
const nestedArray = [1, [2, [3, 4]], 5];
console.log(nestedArray.flat(2)); // [1, 2, 3, 4, 5]
```

`flatMap()` сначала применяет функцию, затем разворачивает результат.

```js
const numbers = [1, 2, 3];
const doubled = numbers.flatMap(num => [num, num * 2]);

console.log(doubled); // [1, 2, 2, 4, 3, 6]
```

## Комбинирование методов

```js
const products = [
  { name: "Apple", price: 1.50 },
  { name: "Banana", price: 0.75 },
  { name: "Orange", price: 1.25 }
];

const sortedAndDiscounted = products
  .toSorted((a, b) => a.price - b.price)
  .with(
    0,
    {
      ...products.toSorted((a, b) => a.price - b.price)[0],
      price: products
        .toSorted((a, b) => a.price - b.price)[0].price * 0.9
    }
  );

console.log(sortedAndDiscounted);
/*
[
  { name: "Banana", price: 0.675 },
  { name: "Orange", price: 1.25 },
  { name: "Apple", price: 1.50 }
]
*/
```

## Таблица методов

| Метод                           | Описание                                           |
|---------------------------------|----------------------------------------------------|
| `findLast()`, `findLastIndex()` | Поиск элементов справа налево                     |
| `toReversed()`                  | Обратный порядок без мутации                       |
| `toSorted()`                    | Сортировка без изменения оригинала                 |
| `toSpliced()`                   | Неизменяемая версия `splice()`                     |
| `with()`                        | Замена элемента по индексу без мутации             |
| `group()`, `groupToMap()`       | Группировка по ключу                               |
| `at()`                          | Доступ по индексу, поддержка отрицательных индексов |
| `flat()`, `flatMap()`           | Разворачивание вложенных массивов                  |

## Преимущества использования новых методов

- **Улучшенная читаемость кода** – лучше передают намерения разработчика.
- **Меньше побочных эффектов** – неизменяемость предотвращает нежелательные изменения.
- **Лучшая поддержка и отладка** – меньше ошибок и проще сопровождение.
- **Функциональный стиль** – более модульный и предсказуемый код.

## Поддержка браузерами и полифилы

Все эти методы поддерживаются в современных браузерах, но для старых версий можно использовать полифилы (например, core-js или Babel).

## Заключение

Новые методы массивов в JavaScript позволяют писать более чистый, удобный и предсказуемый код. Они минимизируют сложность работы с массивами и помогают создавать более надёжные приложения. Попробуйте использовать их в своих проектах – и вы почувствуете разницу.
