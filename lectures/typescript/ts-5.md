---
title: "TypeScript — Лекция 5"
---

# TypeScript — Лекция 5

[Каталог](../README.md) · [Все лекции TypeScript](./README.md) · ← [Лекция 4](./ts-4.md)

---


## 1) Какие проблемы решают generics

### 1.1 Универсальная функция «взять элемент массива»
Перегрузками это не масштабируется (нельзя описать все варианты).
```ts
function getItem<T>(arr: T[], index: number): T {
  return arr[index];
}

const s = getItem(["a", "b"], 0); // string
const n = getItem([1, 2, 3], 1);  // number
```

### 1.2 Функции, где *все аргументы и результат одного типа*
```ts
function same<T>(a: T, b: T): T {
  return Math.random() > 0.5 ? a : b;
}

same(1, 2);     // number
same("a", "b"); // string
// same(1, "b"); // ошибка: T не может стать общим типом здесь безопасно
```

### 1.3 «Коробочки» (контейнеры) и перенос типа внутрь/наружу
Как `Promise<T>`, `Optional<T>`, `Result<T, E>` — тип данных «протекает» по API.
```ts
const p = Promise.resolve([1, 2, 3]);
p.then(xs => xs[0]) // number
```

---

## 2) Типовой параметр — это «типовая переменная» в ограниченном контексте

Дженерик объявляется в `<>`:
```ts
function map<T, R>(arr: T[], f: (x: T) => R): R[] {
  return arr.map(f);
}
```

- `T` и `R` существуют **только внутри** объявления функции/метода/класса/типа.
- Важная мысль: generics нужны, чтобы **задать зависимость** между частями сигнатуры.

### 2.1 Если `T` встречается ровно один раз — чаще всего смысла нет
```ts
function f<T>(x: T): void {}   // ok, но часто можно было бы и без T
function g<T>(x: T): T { return x; } // тут T имеет смысл (связывает вход и выход)
```

---

## 3) Типовой параметр как часть «большого типа»
```ts
// массив:
T[]          // то же, что Array<T>

// кортеж:
[T, R]

// функция:
(x: T) => R

// объект:
{ value: T; error?: R }
```

---

## 4) Перегрузки + generics: у каждой перегрузки могут быть свои типовые параметры

Пример: разные входы — разные выходы.
```ts
function pick<K, V>(m: Map<K, V>): [K, V];
function pick<V>(a: V[]): V;
function pick(x: unknown): unknown {
  if (x instanceof Map) {
    return x.entries().next().value;
  }
  if (Array.isArray(x)) {
    return x[0];
  }
  throw new Error("Unsupported");
}

const r1 = pick(new Map<number, string>([[1, "a"]]));
// r1: [number, string]

const r2 = pick([true, false]);
// r2: boolean
```

**Идея:** типовые параметры **не “делятся”** между перегрузками — каждая сигнатура со своими `T/K/V`.

### 4.1 Документация для типовых параметров в TSDoc
Используйте `@typeParam`:
```ts
/**
 * @typeParam T - тип элемента массива
 * @typeParam R - тип результата функции
 */
function map<T, R>(arr: T[], f: (x: T) => R): R[] { ... }
```

---

## 5) Вывод типов (inference) и явная подстановка type args

### 5.1 Обычно компилятор выводит тип сам
```ts
map([1, 2, 3], x => String(x)); // T=number, R=string
```

### 5.2 Можно указать типы явно при вызове
```ts
map<number, string>([1, 2, 3], x => String(x));
```

Это полезно, когда:
- inference не срабатывает,
- или вы хотите «прибить» контракт (чтобы TS проверил соответствие).

### 5.3 Аннотация vs assertion
- Аннотация (`: Type`) — *контракт*, TS проверяет совместимость.
- Assertion (`as Type`) — *вы утверждаете*, TS проверяет слабее/по правилам приведения.

---

## 6) `let`/`const`, литералы и `as const`

TS часто выводит более конкретные типы для `const`, и более широкие для `let`.

```ts
const a = 42; // a: 42
let b = 42;   // b: number
```

Для объектов:
```ts
const o1 = { mode: "dev" };         // mode: string
const o2 = { mode: "dev" } as const; // mode: "dev" + readonly
```

---

## 7) Ограничения: `T extends ...`

Ограничения говорят компилятору: «T не любой, а из подмножества».

```ts
function select<T extends string>(arr: T[], x: T): T {
  return x;
}
```

- `T extends string` — значит T может быть только строковым типом (включая строковые литералы).
- `T extends string | number` — T должен быть приводим к одному из этих типов.

---

## 8) `NoInfer<T>` — исключить аргумент из механизма вывода типа

Иногда нужно, чтобы TS **не выводил** `T` по конкретному аргументу, а взял его из других мест.

Классический кейс:
- у нас есть массив допустимых значений,
- и второй аргумент должен быть **одним из них**, а не любой строкой.

```ts
// встроенный helper компилятора:
type NoInfer<T> = intrinsic;

function select<T extends string>(arr: T[], x: NoInfer<T>): T {
  return x;
}

const variants = ["foo", "bar"] as const;
select(variants, "foo"); // ok
// select(variants, "bla"); // ошибка: "bla" не входит в T
```

Важно:
- если `T` встречается *только* внутри `NoInfer<T>` и больше нигде — вывода не будет, и `T` уедет в `unknown`.

---

## 9) Условные типы (conditional types): `T extends U ? X : Y`

`extends` бывает:
- **ограничение** (`<T extends ...>`)
- **условие** (`T extends ... ? ... : ...`)

Пример: результат зависит от типа аргумента:
```ts
type Out<T> = T extends number ? number : bigint;

function sum<T extends number | bigint>(a: T, b: T): Out<T> {
  // реализация может потребовать runtime-проверок или перегрузок
  return (a as any) + (b as any);
}

sum(1, 2);     // number
sum(1n, 2n);   // bigint
```

---

## 10) `const`-type parameters (TS 5.x): сохранить «литералы» при выводе

Если вы хотите, чтобы при выводе `T` TS сильнее держался за литеральные типы (и часто добавлял readonly-оттенок),
используют `const` перед типовым параметром:

```ts
function id<const T>(x: T): T {
  return x;
}

const r = id({ a: 1, b: "x" });
// r может сохранять более конкретные литералы, чем без const-параметра
```

Используйте точечно — иногда это приводит к неожиданному `readonly` и слишком узким типам.

---

## 11) Значения по умолчанию для типовых параметров
Если вы явно пробрасываете type args, TS обычно ждёт все параметры.
Значение по умолчанию снижает «шум»:

```ts
function makePair<T, R = T>(a: T, b: R): [T, R] {
  return [a, b];
}

makePair<number>(1, 2);       // R берётся как number
makePair<number, string>(1, "x");
```

---

## 12) Generics в классах и методах

### 12.1 Типовые параметры класса
```ts
class Lazy<T> {
  private state: { kind: "empty" } | { kind: "ready"; value: T } = { kind: "empty" };

  constructor(private fn: () => T) {}

  get(): T {
    if (this.state.kind === "empty") {
      this.state = { kind: "ready", value: this.fn() };
    }
    return this.state.value;
  }
}

const lz = new Lazy(() => 123); // Lazy<number>
lz.get(); // number
```

Если `T` не фигурирует в конструкторе, тип иногда придётся задавать явно при `new`.

### 12.2 У методов могут быть свои типовые параметры
```ts
class Box<T> {
  constructor(private value: T) {}

  map<R>(f: (x: T) => R): Box<R> {
    return new Box(f(this.value));
  }
}
```

---

## 13) Типовые параметры в type-alias: «типовые функции»
Типовые алиасы с параметрами — это почти как функции на уровне типов:

```ts
type ValueOf<T> = T extends { value: infer V } ? V : never;

type A = ValueOf<{ value: 42 }>; // 42
```

В алиасах проще строить сложные композиции, вплоть до рекурсивных типов (для «type-level programming»).

---

## Быстрый чек-лист
- Generics нужны, чтобы **связать типы** (аргументы ↔ результат ↔ поля класса).
- Если `T` встречается один раз — возможно, generics не нужен.
- `T extends ...` — ограничения и/или условия (`?:`) — это два разных применения `extends`.
- Когда inference мешает — используйте явные type args или `NoInfer<T>`.
- Для конфигов/литералов: `as const`, а точечно — `const` type params.
- В классах: `T` обычно выводится из конструктора, методы могут иметь собственные `<R>`.
