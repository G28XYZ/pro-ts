---
title: "TypeScript — Лекция 3"
---

# TypeScript — Лекция 3

[Каталог](../README.md) · [Все лекции TypeScript](./README.md) · ← [Лекция 2](./ts-2.md) · [Лекция 4](./ts-4.md) →

---

## 1) Класс в TS = класс в JS + **тип экземпляра**
- Классы в TS — это те же классы из JS (ES6+), но **объявление класса одновременно создаёт тип экземпляра**. fileciteturn7file0
- В плоскости **типов** имя класса (`Foo`) = **тип экземпляра**, а в плоскости **значений** `Foo` = **конструктор**. fileciteturn7file0

### Экземпляр vs конструктор (очень важно)
```ts
class Foo {
  bla: string = "x";
  bar(): number { return 1; }
}

// тип экземпляра:
function takesInstance(x: Foo) {
  x.bar();
}

// тип конструктора (функция-конструктор):
function takesCtor(C: typeof Foo) {
  // можно использовать static (если есть) и new:
  return new C();
}
```
Если убрать `typeof`, TS ожидает **экземпляр**, а не конструктор. fileciteturn7file3

---

## 2) Перегрузка методов в классах
В классах можно описывать перегрузки методов «как в TS обычно» (сигнатуры + реализация). fileciteturn7file0

```ts
class Api {
  get(id: number): string;
  get(id: string): string;
  get(id: number | string) {
    return String(id);
  }
}
```

---

## 3) Наследование и полиморфизм (по типу)
- Если `B extends A`, то там, где ожидается `A`, можно передать `B`. fileciteturn7file8
- Множественного наследования классов нет (обычно один базовый класс). fileciteturn7file8

```ts
class Shape { size(): number { return 0; } }
class Cube extends Shape { override size(): number { return 10; } }

function f(s: Shape) { return s.size(); }
f(new Cube()); // ok
```

---

## 4) Контракты при переопределении (идея Лисков)
- Переопределяя метод/свойство в наследнике, нельзя «ломать» контракт базового класса:
  - нельзя менять возвращаемый тип на несовместимый;
  - можно **уточнять** (делать тип более конкретным — подтип). fileciteturn7file0

```ts
class A { size(): number { return 1; } }
class B extends A {
  override size(): 42 { return 42; } // ок: 42 ⊂ number
}

// НЕЛЬЗЯ (ломает контракт):
// class Bad extends A { override size(): string { return "42"; } }
```

---

## 5) OCP (Open/Closed) + публичный API + SemVer
- Смысл: **не делать breaking changes** в публичном API (и аккуратно относиться к `protected`, т.к. на него могут завязаться наследники). fileciteturn8file0 fileciteturn8file14
- Если изменение ломает контракт — это повод для **мажорного** обновления (в терминах семантического версионирования). fileciteturn8file1 fileciteturn8file18

Практика:
- вместо «поменять тип возвращаемого значения» → добавить новый метод / перегрузку;
- публичное и protected — менять осторожно;
- private — можно рефакторить свободнее. fileciteturn8file4 fileciteturn8file14

---

## 6) Модификаторы видимости: **public / protected / private**
### В TS
- `public` по умолчанию.
- `protected` — доступно внутри класса и наследников, но недоступно снаружи. fileciteturn8file13
- `private` (TS) — проверяется **только на уровне TS**, в рантайме это обычное поле/метод. fileciteturn8file13

### Нативные приватные поля JS: `#private`
- `#foo` — реально приватно в рантайме (снаружи не достучаться). fileciteturn7file1
- Но есть нюанс: в очень старые цели (например, ES5) такие поля могут не собраться/полифилиться как ожидается. fileciteturn7file1 fileciteturn7file12

```ts
class A {
  #secret = 42;
  reveal() { return this.#secret; }
}
```

**Рекомендация из лекции:** если окружение позволяет — предпочтительнее нативное `#private`, чем `private` TS. fileciteturn7file12

---

## 7) Параметры конструктора как свойства (parameter properties)
TS умеет «сахар», который создаёт свойства из аргументов конструктора — но это влияет на рантайм и не все сборщики это понимают. fileciteturn8file16 fileciteturn7file2

```ts
class User {
  constructor(
    public id: number,
    protected role: string,
    private name: string,
  ) {}
}
```

> Если собираете не `tsc`, а, например, “тупой” трансформер, который просто вырезает типы, этот сахар может стать проблемой. fileciteturn7file2

---

## 8) `accessor` — чтобы корректно переопределять поле через getter/setter
Проблема:
- поле инициализируется на **самом объекте** (в конструкторе),
- getter/setter живут в **прототипе**,
- поэтому «переопределить поле геттером» может не работать как кажется. fileciteturn8file3 fileciteturn8file17

Решение: использовать `accessor` (TS создаёт приватное хранилище + getter/setter). fileciteturn7file2 fileciteturn8file17

```ts
class A {
  accessor foo: number = 42;
}

class B extends A {
  override set foo(v: number) {
    super.foo = v * 10;
  }
}
```

---

## 9) `override` — защита от «сломали базовый метод»
Ставьте `override` **каждый раз**, когда переопределяете член класса: TS проверит, что вы действительно переопределяете существующий метод/свойство и даст понятную ошибку, если базовый член удалили/переименовали. fileciteturn8file1

```ts
class A { foo() { return 1; } }
class B extends A {
  override foo() { return super.foo() * 10; }
}
```

---

## 10) Модификаторы полей: `readonly`, `?`, `!`
- `readonly` — нельзя переassign. Может влиять на вывод типов (значение становится «максимально конкретным»). fileciteturn8file15
- `?` — опционально (`T | undefined`). fileciteturn8file15
- `!` — «точно будет инициализировано» (definite assignment assertion); полезно, когда TS не может доказать инициализацию (миксины/декораторы и т.п.). Использовать осторожно. fileciteturn8file15 fileciteturn8file7

```ts
class C {
  readonly a = 42; // a: 42
  b?: number;     // number | undefined
  c!: number;     // обещаем, что установим позже
}
```

---

## 11) `abstract class` и абстрактные члены
- `abstract class` нельзя инстансировать (`new Abstract()` запрещён). fileciteturn7file6
- Можно объявлять `abstract` поля/методы: реализация обязана появиться в ближайшем не-абстрактном наследнике. fileciteturn7file6 fileciteturn7file15
- В рантайме `abstract` просто «стирается» (это контракт для компилятора). fileciteturn7file15

```ts
abstract class Shape {
  abstract x: number;
  abstract y: number;
  abstract area(): number;

  // обычная реализация может быть
  isTopLeft() { return this.x === 0 && this.y === 0; }
}

class Triangle extends Shape {
  constructor(public x: number, public y: number) { super(); }
  override area() { return (this.x * this.y) / 2; }
}
```

### `protected constructor` + статический `create`
Альтернатива, когда хочется запретить `new` снаружи, но разрешить фабрики. fileciteturn8file12

```ts
class Service {
  protected constructor() {}
  static create() { return new this(); }
}
```

---

## 12) Интерфейс vs абстрактный класс (коротко)
- `interface` — контракт **публичного** API (без `private/protected`, без реализации). fileciteturn7file18
- `abstract class` — может хранить реализацию и любые модификаторы видимости. fileciteturn7file18
- Класс может `implements` сразу много интерфейсов, но `extends` — только один класс. fileciteturn7file18

---

## 13) Композиция (вместо наследования): паттерн «Стратегия»
Идея из примера: в классе хранится интерфейс-стратегия (например, “как рендерить”), и поведение меняется заменой стратегии — без переписывания класса. fileciteturn7file19

```ts
interface Renderer { render(): void; }

class Button {
  constructor(private renderer: Renderer) {}
  draw() { this.renderer.render(); }
}
```

---

## Быстрый чек-лист
- Нужен **экземпляр**? Пиши `Foo`. Нужен **конструктор**? Пиши `typeof Foo`. fileciteturn7file3
- Всегда ставь `override` при переопределении. fileciteturn8file1
- `public/protected` — это контракт, не ломай без веской причины (и без SemVer). fileciteturn8file0
- Для «настоящей приватности» предпочитай `#private`, если целевое окружение позволяет. fileciteturn7file12
- `!` (definite assignment) используй осторожно: это обещание компилятору. fileciteturn8file7
