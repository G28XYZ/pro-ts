---
title: "TypeScript — Лекция 7"
---

# TypeScript — Лекция 7

[Каталог](../README.md) · [Все лекции TypeScript](./README.md) · ← [Лекция 6](./ts-6.md)

---

## 1) «Функции над типами» и два `extends`
В TypeScript типовые алиасы с параметрами можно воспринимать как **функции над типами**:

```ts
type F<T> = /* вычисление типа из T */;
```

### 1.1 Бинарный `extends` — ограничение (constraint)
Ограничивает множество допустимых типов:
```ts
type Id<T extends string> = T;
```

### 1.2 Тернарный `extends` — условие (conditional type)
Это «if/else» в мире типов:
```ts
type IsString<T> = T extends string ? true : false;
```

---

## 2) Миксин без конфликтов: `Omit<T, keyof M> & M`

### 2.1 Почему просто `T & M` может быть плохо
Если у `T` и `M` совпадают ключи, пересечение иногда приводит к конфликтам и неожиданным типам (вплоть до `never` на свойствах).

### 2.2 Правило миксина «M перезаписывает T»
Сначала удаляем конфликтные ключи из `T`, затем добавляем `M`:

```ts
type Mixin<T, M> = Omit<T, keyof M> & M;
```

---

## 3) Пишем свой `Omit` и `Exclude` (практика)

### 3.1 `Exclude` — удаление значений из union
```ts
type MyExclude<T1, T2> = T1 extends T2 ? never : T1;
```

Интуиция: для каждого элемента union в `T1`:
- если он попадает в `T2` → выбрасываем (`never`)
- иначе оставляем.

### 3.2 `Omit` через `keyof` + `Exclude` + mapped types
```ts
type MyOmit<T, S> = {
  [K in MyExclude<keyof T, S>]: T[K]
};
```

---

## 4) «Миксин»-функция в runtime (почему TS ругается)
Даже если тип `Mixin<T, M>` красивый, `Object.defineProperties` в стандартных типах часто возвращает **только исходный `T`** — TS не «видит», что вы добавили новые поля.

Типичный приём:
- типовая функция `Mixin<T, M>` описывает результат,
- runtime-функция возвращает `as Mixin<T, M>` (или делаем более аккуратно через фабрики/копирование).

**Важно:** ограничивайте `T`/`M` объектами, иначе вылезут странности с примитивами:
```ts
type Obj = Record<PropertyKey, unknown>;
type SafeMixin<T extends Obj, M extends Obj> = Omit<T, keyof M> & M;
```

---

## 5) Spread в типах кортежей: `Push`
Добавить элемент в конец кортежа/массива можно через распаковку:

```ts
type Push<E, T extends any[]> = [...T, E];

type A = Push<42, ["Bob", "Elton"]>; // ["Bob", "Elton", 42]
```

### 5.1 Если вход — обычный массив
Если `T = (string | number)[]`, результат становится кортежем вида:
```ts
type R = [...(string | number)[], boolean]; // «много элементов», потом boolean
```

---

## 6) `extends any` как ограничение — это нормально
Внутри constraint’ов `extends any` часто используют как «любой тип», потому что `any` тут не «утекает» наружу как значение — это лишь ограничение.

Примеры распространённых ограничений:
```ts
type AnyFn = (...args: any[]) => any;     // «любая функция (не конструктор)»
type AnyArr = any[];                      // «любой массив/кортеж»
type AnyRecord = Record<PropertyKey, any>;// «любой объект-словарь»
```

> Нюанс: `Function` (тип) включает и вызываемые функции, и конструкторы; иногда важно различать `new (...)=...` и обычный call signature.

---

## 7) Длина кортежа/массива: `T["length"]`
```ts
type Length<T extends any[]> = T["length"];

type L1 = Length<[1, 2, 3]>;        // 3 (литерал)
type L2 = Length<number[]>;         // number
type L3 = Length<[string, ...any[]]>;// number (нефиксированный кортеж)
```

---

## 8) `infer`: извлечение части типа (только внутри conditional types)

`infer` можно использовать **только** справа от `extends` в тернарном типе:

```ts
type Last<T extends any[]> =
  T extends [...any[], infer E] ? E : never;

type A = Last<[1, 2, "x"]>; // "x"
type B = Last<[]>;          // never
```

### 8.1 Это и есть «паттерн-матчинг»
Мы описываем **шаблон** (pattern) и проверяем, подходит ли `T` под него:
- `[]` не подходит под `[..., infer E]` → идём в `never`.

### 8.2 `infer` можно ограничивать (constraint на выводимое)
```ts
type ExtractNumber<S> =
  S extends `${infer N extends number}` ? N : never;

type N1 = ExtractNumber<"42">; // 42
```

---

## 9) Пример «арифметики на типах»: `Negate<number>`
Идея: переводим число в строку, делаем шаблонное сравнение и вытаскиваем значение через `infer`.

```ts
type Negate<N extends number> =
  N extends 0 ? 0 :
  `-${N}` extends `${infer V extends number}` ? V :
  `${N}` extends `-${infer V extends number}` ? V :
  never;

type A = Negate<5>;    // -5
type B = Negate<-5>;   // 5
type C = Negate<0>;    // 0
```

---

## 10) `infer` и перегрузки: важный подводный камень
Если тип функции имеет **перегрузки**, то простой pattern-match обычно «видит» **последнюю** сигнатуру.

Примерная проблема:
- `FnParameters<F>` для перегруженной функции вытаскивает параметры **последней** перегрузки.

Реальный workaround в TS — перечислять N вариантов вручную (до «разумного лимита»), например:
```ts
type FnParameters<F> =
  F extends { (...a: infer A1): any; (...a: infer A2): any } ? A1 | A2 :
  F extends (...a: infer A): any ? A :
  never;
```

(На практике часто делают 3–7 вариантов, если перегрузок много.)

---

## 11) Полезные встроенные utility-типы (чтобы не писать самому)
- `Parameters<F>` — кортеж аргументов функции
- `ReturnType<F>` — тип возвращаемого значения
- `ConstructorParameters<C>` — кортеж аргументов конструктора
- `InstanceType<C>` — тип экземпляра конструктора
- `ThisParameterType<F>` — тип `this`-параметра функции
- `OmitThisParameter<F>` — «убрать this из сигнатуры»
- `Awaited<T>` — «распаковать» `Promise`/`PromiseLike` (в т.ч. вложенные)

### 11.1 Упрощённый `Awaited`
```ts
type MyAwaited<T> = T extends Promise<infer V> ? V : T;

type A = MyAwaited<Promise<42>>; // 42
type B = MyAwaited<42>;          // 42
```

Реальный `Awaited` сложнее, потому что поддерживает `PromiseLike`/thenables и рекурсивную распаковку.

---

## 12) Порядок в `extends` важен: пример с `unknown`
Неправильная проверка:
```ts
type IsUnknown_Broken<T> = T extends unknown ? true : false; // всегда true
```

Почему: почти любой `T` «вписывается» в `unknown`.

Правильное направление:
```ts
type IsUnknown<T> = unknown extends T ? true : false;
```

> Нюанс: чтобы отличить `unknown` от `any`, обычно добавляют дополнительную проверку (иначе `any` тоже может дать `true`).

---

## Быстрый чек-лист
- Типовые алиасы с параметрами = «функции над типами».
- Тернарный `extends` = if/else; `infer` доступен только внутри него.
- `Omit<T, keyof M> & M` — способ «смешать» два объекта без конфликтов.
- `T["length"]` даёт литерал для фиксированных кортежей и `number` для массивов/нефиксированных кортежей.
- Перегрузки + `infer` — чаще всего видна последняя сигнатура; для точности приходится перечислять варианты.
- Пользуйтесь built-in `Parameters/ReturnType/Awaited/...` — они покрывают кучу нюансов.
