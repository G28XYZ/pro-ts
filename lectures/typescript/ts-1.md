---
title: "TypeScript — Лекция 1"
---

# TypeScript — Лекция 1

[Каталог](../README.md) · [Все лекции TypeScript](./README.md) · Следующая → [Лекция 2](./ts-2.md)

---

## 1) Зачем TypeScript
- TypeScript = **JavaScript + система типов** (проверки на этапе разработки).
- В рантайме TS **не добавляет магии**: код компилируется в JS.
- Помогает: автодополнение, рефакторинг, ранний лов ошибок.

---

## 2) Мир типов vs мир значений
- **Типы** существуют только для компилятора.
- **Значения** — то, что реально выполняется в JS.

### Аннотация типа (`:`)
```ts
let age: number = 25;
const name: string = "Alex";
```

### Вывод типов (инференс)
```ts
const n = 42;        // n: 42 (литеральный тип, если const)
let x = 42;          // x: number (может меняться)
```

---

## 3) Когда писать типы явно (практика)
- **Публичный API**: параметры и возвращаемое значение функций/методов.
- **Сложные структуры** (объекты, коллбеки) — часто лучше аннотировать.
- Внутри функций часто достаточно **инференса**.

```ts
// Хорошо: API читается без чтения реализации
export function formatPrice(value: number, currency: "EUR" | "USD"): string {
  return `${value} ${currency}`;
}
```

---

## 4) Базовые типы
Примитивы:
- `string`, `number`, `boolean`, `bigint`, `symbol`, `null`, `undefined`

Прочее:
- `object` (все неприимитивы)
- `unknown`, `any`, `void`, `never` (служебные/особые)

---

## 5) `null` / `undefined` и `strictNullChecks`
С включенным `strictNullChecks` нельзя «случайно» положить `null` куда не надо:

```ts
let s: string = "ok";
// s = null; // ошибка при strictNullChecks

let maybe: string | null = null;
maybe = "hello";
```

---

## 6) `symbol`, `unique symbol`, `typeof` в типах
`symbol` — общий тип. Конкретный `const`-символ может стать `unique symbol`.

```ts
const ID = Symbol("id");      // ID: unique symbol
let id2 = Symbol("id");       // id2: symbol

type IdType = typeof ID;      // ссылка на тип конкретного символа

const obj: Record<string, unknown> = {};
(obj as any)[ID] = 123;
```

---

## 7) Литеральные типы (типы-константы)
Тип может быть конкретным значением:

```ts
type Direction = "left" | "right" | "up" | "down";

function move(dir: Direction) {}
move("left");
// move("forward"); // ошибка
```

---

## 8) `any` vs `unknown`
### `any` — отключает безопасность
```ts
let data: any = JSON.parse('{"x": 1}');
data.toFixed(); // компилятор не ругнется, но может упасть в рантайме
```

### `unknown` — безопасное «не знаю что там»
Нужно сначала проверить тип:

```ts
function printLen(v: unknown) {
  if (typeof v === "string") {
    console.log(v.length); // ok
    return;
  }
  console.log("not a string");
}
```

---

## 9) Установка и базовый старт
```bash
npm i -D typescript
npx tsc --init
```

Компиляция:
```bash
npx tsc
```

---

## 10) Директивы: `@ts-ignore` и `@ts-expect-error`
- `@ts-ignore` — **просто глушит** ошибку (опасно).
- `@ts-expect-error` — ожидаем ошибку: если её не станет, TS сообщит.

```ts
// @ts-expect-error: временно, пока библиотека не обновится
someLegacyFn("bad-arg");
```

---

## 11) Union types (`A | B`) и сужение (narrowing)
```ts
function toUpper(v: string | number) {
  if (typeof v === "string") return v.toUpperCase();
  return v.toString();
}
```

---

## 12) Template literal types (шаблонные строковые типы)
```ts
type HttpMethod = "GET" | "POST";
type ApiPath = "/users" | "/orders";
type Endpoint = `${HttpMethod} ${ApiPath}`;

const e1: Endpoint = "GET /users";
// const e2: Endpoint = "PUT /users"; // ошибка
```

---

## 13) `void` (важная идея)
`void` — «результат не используется». Обычно: функция без полезного результата.

```ts
function log(msg: string): void {
  console.log(msg);
}

async function run(): Promise<void> {
  log("start");
}
```

---

## Мини-паттерны (очень частые)
### Тип объекта
```ts
type User = {
  id: number;
  name: string;
  email?: string; // optional
};
```

### Массив и кортеж
```ts
const nums: number[] = [1, 2, 3];
const pair: [string, number] = ["age", 30];
```

### Тип функции
```ts
type Mapper = (x: number) => string;

const map: Mapper = (x) => String(x);
```
