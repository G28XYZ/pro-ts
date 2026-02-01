---
title: "TypeScript — Лекция 4"
---

# TypeScript — Лекция 4

[Каталог](../README.md) · [Все лекции TypeScript](./README.md) · ← [Лекция 3](./ts-3.md) · [Лекция 5](./ts-5.md) →

---

## 1) Type guards: как «сузить» тип (narrowing)

### 1.1 Встроенные проверки JS, которые понимает TS
TS умеет уточнять тип после проверок:
- `typeof` (для примитивов)
- `instanceof` (для классов/конструкторов)
- `in` (проверка наличия свойства)

```ts
type A =
  | { a: number; b: string }
  | { c: number; b: string };

function f(x: A) {
  x.b.toUpperCase(); // ok: b есть в обеих ветках

  if ("a" in x) {
    x.a.toFixed();   // ok: теперь ветка с a
  } else {
    x.c.toFixed();   // ok: теперь ветка с c
  }
}
```

### 1.2 Пользовательский guard: `value is T`
Можно писать свою функцию-предикат, которая **сообщает TS**, что значение — нужного типа.

```ts
interface Shape { type: string; }
interface Circle extends Shape { type: "circle"; radius: number; }
interface Rect extends Shape { type: "rect"; width: number; height: number; }

function isCircle(v: unknown): v is Circle {
  return (
    v !== null &&
    typeof v === "object" &&
    "type" in v &&
    (v as any).type === "circle" &&
    "radius" in v
  );
}

function area(s: Shape) {
  if (isCircle(s)) {
    return Math.PI * s.radius ** 2; // s: Circle
  }
  return 0;
}
```

Важно: TS **не проверяет** корректность логики внутри guard — это ваша ответственность (проверки реально выполняются в runtime).

---

## 2) Cast (type assertion) и почему downcast опасен

### 2.1 Upcast (к «родителю») обычно безопаснее
```ts
const c: Circle = { type: "circle", radius: 10 };
const s: Shape = c; // ok
```

### 2.2 Downcast может «сломаться» в runtime
```ts
const s: Shape = { type: "circle", radius: 10 } as any;

// опасно: можно «притвориться» Rect и упасть позже
const r = s as Rect;
r.width.toFixed(); // runtime: width может быть undefined
```

**Правильный подход:** использовать **guard** перед downcast.

---

## 3) `typeof` в TypeScript (type query), и чем он отличается от JS `typeof`

- JS `typeof` — runtime-оператор, возвращает строку (`"string"`, `"number"`…).
- TS `typeof` — **оператор в мире типов**: берёт **значение** и возвращает его **тип**.

```ts
const obj = {
  a: 42,
  b: "str",
  bla() { return 1; }
};

type Obj = typeof obj;
// Obj = { a: number; b: string; bla(): number }
```

### 3.1 `as const` (и почему оно полезно)
```ts
const x = 42;           // x: 42
let y = 42;             // y: number

const cfg = { mode: "dev" } as const;
// cfg.mode: "dev" (литерал), а не string
```

### 3.2 Классы: экземпляр vs конструктор
```ts
class Foo {
  bla() { return 1; }
  static bar() { return 2; }
}

function takesInstance(v: Foo) {
  v.bla();
}

// тип конструктора:
function takesCtor(C: typeof Foo) {
  C.bar();
  return new C();
}
```

---

## 4) `keyof`: получить «множество» ключей

`keyof T` даёт union всех ключей объектного типа `T`.

```ts
type User = { id: number; name: string };
type UserKeys = keyof User; // "id" | "name"
```

### 4.1 `keyof` можно применять и к примитивам (через их интерфейсы-обёртки)
```ts
type NumKeys = keyof number; // "toFixed" | "toString" | ...
```

### 4.2 `keyof` + `typeof` — частая связка
```ts
const E = { A: "a", B: "b" } as const;
type Keys = keyof typeof E; // "A" | "B"
```

---

## 5) Indexed access: `T[K]` и «union ключей → union значений»

Если `K` — union, то `T[K]` становится union значений по этим ключам.

```ts
type A = { a: string; b: number; c: boolean };

type V1 = A["a"];           // string
type V2 = A["a" | "b"];     // string | number
type VAll = A[keyof A];     // string | number | boolean
```

Практический трюк: `T[keyof T]` — объединение всех значений объекта.

---

## 6) Mapped types: `{ [K in Keys]: ... }`

Синтаксис:
```ts
type MapKeys<T> = {
  [K in keyof T]: T[K];
};
```

- Это похоже на «цикл» по ключам.
- В лекции подчёркнуто: такой синтаксис **не пишется напрямую в `interface`**, обычно делают через `type` (или через пересечение типов).

```ts
type Only012 = { [K in 0 | 1 | 2]: string };
// ключей ровно три: 0, 1, 2
```

---

## 7) Модификаторы в mapped types: добавлять/убирать `readonly` и `?`

### 7.1 Добавить
```ts
type MakeReadonlyOptional<T> = {
  readonly [K in keyof T]?: T[K];
};
```

### 7.2 Убрать (минусы)
```ts
type RemoveReadonlyRequired<T> = {
  -readonly [K in keyof T]-?: T[K];
};
```

### 7.3 Частично менять правила для части ключей (через `Extract`/`Exclude`)
```ts
type A = { a?: number; b?: string; c?: boolean };

type StrictAB<T> =
  // ключи a|b делаем readonly и required:
  { readonly [K in Extract<keyof T, "a" | "b">]-?: T[K] } &
  // остальные оставляем как есть:
  { [K in Exclude<keyof T, "a" | "b">]: T[K] };

type R = StrictAB<A>;
```

---

## 8) Встроенные функции над типами (conditional/utility types)

### 8.1 Для union-типов
- `Extract<A, B>` — оставить пересечение значений
- `Exclude<A, B>` — убрать значения
- `NonNullable<T>` — убрать `null | undefined`

```ts
type U = "a" | "b" | null | undefined;
type U1 = NonNullable<U>;          // "a" | "b"
type U2 = Exclude<U, "a">;         // "b" | null | undefined
type U3 = Extract<U, "b" | null>;  // "b" | null
```

### 8.2 Для объектных типов
- `Partial<T>` — все поля опциональны
- `Required<T>` — все обязательны
- `Readonly<T>` — все readonly
- `Pick<T, K>` — выбрать ключи
- `Omit<T, K>` — удалить ключи
- `Record<K, V>` — словарь: ключи `K`, значения `V`

```ts
type User = { id: number; name: string; meta?: object };

type U1 = Partial<User>;
type U2 = Required<User>;
type U3 = Readonly<User>;
type U4 = Pick<User, "id" | "name">;
type U5 = Omit<User, "meta">;
type Dict = Record<string, number>;
```

**Смысловое отличие:** `Exclude`/`Extract` работают с **union**, а `Pick`/`Omit` возвращают **объект**.

---

## 9) Переименование ключей: `as` + template literal types

Можно «перегенерировать» имена ключей.

```ts
type Getters<T> = {
  [K in keyof T as `get${Capitalize<string & K>}`]: () => T[K]
};

type A = { a: number; b: string; c: boolean };
type G = Getters<A>;
// { getA: () => number; getB: () => string; getC: () => boolean }
```

Полезные string-типы:
- `Uppercase<S>`, `Lowercase<S>`, `Capitalize<S>`, `Uncapitalize<S>`

---

## 10) Spread типов в кортежах: `...`

```ts
type A = (string | number)[];
type T = [...A, string];
// кортеж: много (string|number), затем string
```

Можно распечатывать несколько раз:
```ts
type P = [...[string, number], boolean, ...[string, number]];
// [string, number, boolean, string, number]
```

---

## 11) `satisfies`: «проверить тип, но не потерять литералы»

`satisfies` проверяет, что объект соответствует типу, но **не расширяет** литеральные значения так агрессивно, как аннотация.

```ts
type Shape = Record<string, unknown> & { foo: number };

const cfg = {
  foo: 123,
  extra: "ok"
} satisfies Shape;

// cfg.foo: 123 (литерал может сохраниться в контексте)
// при этом есть гарантия совместимости с Shape
```

Полезно для конфигов, где:
- есть обязательные поля,
- но можно хранить «лишние» (неизвестные заранее) поля.

---

## 12) Условные типы (conditional types): `extends ? :`

Базовый паттерн:
```ts
type IsNumber<T> = T extends number ? true : false;

type A = IsNumber<42>;     // true
type B = IsNumber<"x">;    // false
```

В mapped types можно делать «ветвления» для каждого ключа:
```ts
type Transform<T> = {
  [K in keyof T]:
    K extends "a" ? number :
    T[K] extends number ? boolean :
    T[K];
};
```

---

## Быстрый чек-лист
- Нужно сузить union/unknown → `typeof` / `in` / `instanceof` или **свой guard** `v is T`.
- `typeof` (TS) используй только в **позиции типа**: `type X = typeof value`.
- `keyof T` → union ключей; `T[keyof T]` → union всех значений.
- Mapped types: `{ [K in ...]: ... }`, модификаторы можно добавлять/снимать (`readonly`, `?`, `-readonly`, `-?`).
- Utility-типы: `Partial/Required/Readonly/Pick/Omit/Record`, а для union — `Extract/Exclude/NonNullable`.
- Переименование ключей: `as` + template literal types + `Capitalize/Uppercase/...`.
- `satisfies` — лучший друг конфигов: проверяет тип, но не ломает литералы.
