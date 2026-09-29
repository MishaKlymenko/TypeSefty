/* Інтерактивна лекція: безпека типів у Java, C# і TypeScript. */
(function () {
  const KEYWORDS = {
    java: new Set(["public", "class", "new", "void", "return", "if", "import", "extends", "throws", "private", "static", "final", "instanceof", "null", "true", "false", "this", "super", "try", "catch", "int", "record", "long"]),
    cs: new Set(["public", "class", "new", "void", "return", "if", "is", "not", "null", "string", "var", "true", "false", "this", "namespace", "using", "static", "readonly", "object", "int", "long", "bool", "where", "decimal", "out", "throw", "record", "struct"]),
    ts: new Set(["async", "function", "const", "await", "return", "if", "import", "from", "type", "interface", "as", "string", "number", "null", "undefined", "throw", "new", "true", "false", "unknown", "any", "readonly", "class", "private", "this"]),
    json: new Set([]),
  };

  const slides = [
    {
      group: "Вступ",
      title: "Вступ",
      kind: "hero",
    },
    {
      group: "Вступ",
      title: "План",
      kind: "plan",
    },
    {
      group: "Вступ",
      title: "Що таке безпека типів",
      kind: "define",
    },
    {
      group: "Вступ",
      title: "Межа гарантії",
      kind: "bounds",
    },
    {
      group: "Вступ",
      title: "Три моделі захисту",
      kind: "trio",
    },
    {
      group: "Пам’ять",
      title: "Безпека пам’яті",
      kind: "memsafe",
    },
    {
      group: "Пам’ять",
      title: "Три рантайми",
      kind: "memlangs",
    },
    {
      group: "Пам’ять",
      title: "Межі масиву",
      kind: "mechanism",
      kicker: "Пам’ять · межі",
      heading: "Запис за length не псує сусідній об’єкт",
      lede: "Безпека пам’яті вимагає, щоб індекс поза length не став записом у чужі байти. Java і C# кидають виняток до зміни комірки. У TypeScript масив <code>number[]</code> збільшує length: це новий слот того самого об’єкта, а не перезапис сусіда в купі. Анотація <code>number[]</code> цей запис не зупиняє.",
      essay: "<p>У C індекс за розміром буфера змінює пам’ять, яку програміст не виділяв під цей масив. У керованому коді такого запису немає. ArrayIndexOutOfBoundsException і IndexOutOfRangeException зупиняють рядок. У TypeScript присвоєння <code>cells[3] = 99</code> на <code>number[]</code> з трьох елементів створює четвертий елемент: tsc приймає індекс, бо тип масиву не фіксує довжину. <code>Int32Array</code> цей індекс ігнорує і сусідніх об’єктів усе одно не чіпає.</p>",
      player: boundsMemPlayer(),
      note: "Переповнення стека від глибокої рекурсії і OutOfMemoryError лишаються: рантайм захищає розкладку об’єктів, а не від нескінченного виділення.",
    },
    {
      group: "Модель",
      title: "Номінативна і структурна",
      kind: "nominal",
    },
    {
      group: "Модель",
      title: "Доменні типи",
      kind: "domain",
    },
    {
      group: "Java",
      title: "Type Erasure у Java",
      kind: "mechanism",
      kicker: "Java · затирання",
      heading: "Затирання типів: від List<String> до сирого List",
      lede: "Список рядків оголошено як List&lt;String&gt;. Компілятор це перевіряє. У байткоді окремого класу «список рядків» немає: лишається ArrayList часів Java 1.4, а обіцянка «тут лише String» перетворюється на checkcast у місці читання.",
      essay: "<p>Дженерики з’явилися в JDK 5, коли вже існували мільйони класів зі звичайним ArrayList. Окремий клас на кожну підстановку зламав би старий байткод і роздув би бібліотеку. Затирання лишає один клас. Параметр без межі стає Object. Якщо межа є, як у <code>T extends CharSequence</code>, параметр стає цією межею.</p><p>Туторіал Oracle описує три дії javac: підставити межу або Object, вставити приведення там, де треба зберегти безпеку, і згенерувати bridge-методи, щоб поліморфізм після затирання лишився перевизначенням. Перевірку під час запису робить лише компілятор. У рантаймі add приймає Object. Тому сирий тип може покласти в список Integer. Падіння відсувається на наступне get, часто в іншому модулі. Це називають забрудненням купи.</p>",
      player: erasurePlayer(),
      note: "<strong>Як зупинити запис, якщо сирий API лишився.</strong> Атрибут Signature зберігає дженерик-підпис для рефлексії, але JVM не звіряє його в add. CERT OBJ03-J радить обгорнути список у <code>Collections.checkedList(list, String.class)</code>: тоді чужий Integer падає на записі, а не на чужому get. Наступний слайд — міст, третя дія javac.",
    },
    {
      group: "Java",
      title: "Bridge-методи",
      kind: "mechanism",
      kicker: "Java · міст",
      heading: "Міст, якого немає у вихідному коді",
      lede: "Затирання щойно стерло T. Клас IntegerNode перевизначає setData(Integer) у вузлі Node&lt;Integer&gt;. Батьківський метод після затирання стає setData(Object). Сигнатури розходяться, і JVM уже не вважала б цей метод перевизначенням.",
      essay: "<p>У байткоді метод ідентифікують ім’ям і стертими типами аргументів. Тип результату теж входить у дескриптор, тому міст і вузький метод можуть співіснувати. javac дописує synthetic setData(Object), позначає його як міст і з нього викликає setData(Integer) після checkcast.</p><p>Цей метод потрапляє в стек винятків, хоча в репозиторії його немає. Якщо в трасуванні видно IntegerNode.setData(Object), це не ручне перевантаження, а міст. Саме в ньому виникає ClassCastException, коли у вузол через сире посилання кладуть рядок.</p>",
      player: bridgePlayer(),
    },
    {
      group: "Java",
      title: "Varargs і купа",
      kind: "mechanism",
      kicker: "Java · varargs",
      heading: "ClassCastException за два кадри від місця, де зіпсували масив",
      lede: "Сирий add уже показав забруднення купи на списку рядків. Узагальнений varargs робить те саме тихіше: після затирання T нереіфіковний, тож масив збирають як Object[]. Якщо метод віддає цей масив назовні, падіння відбувається на присвоєнні в String[], хоча в тексті цього рядка немає жодного приведення.",
      essay: "<p>JLS називає забрудненням купи ситуацію, коли змінна параметризованого типу вказує на об’єкт іншого параметризованого типу. Неперевірене приведення, змішування із сирим типом і generic varargs — типові джерела. CERT OBJ03-J вимагає не лишати таке попередження без рішення. Effective Java (item 32) формулює практичне правило: не змішувати узагальнення зі змінною арністю, якщо масив може вийти за межі методу.</p><p>@SafeVarargs ставлять лише на метод, який не віддає назовні масив, зібраний зі змінної арності, і не пише в нього чужий тип. Інакше анотація ховає попередження, а не дірку. Якщо метод ваш і компілятор попереджає, перевіряють тіло. Якщо метод чужий, на межі не придушують unchecked мовчки.</p>",
      player: varargsPlayer(),
    },
    {
      group: "C#",
      title: "Значення і посилання в C#",
      kind: "mechanism",
      kicker: "C# · пам’ять",
      heading: "Значення в стеку, в коробці і в списку",
      lede: "У Java після затирання long у списку став би Object і кожне число довелося б пакувати. C# розрізняє значущий і посилальний типи саме тому. Локальний long, рядок у купі, пакування в object і List&lt;long&gt; показують цю різницю без окремого сюжету.",
      essay: "<p>Локальна змінна значущого типу тримає саме число. Поле структури, вкладеної в клас, лежить усередині об’єкта в купі: формула «struct завжди в стеку» для полів не діє. Посилальна змінна тримає адресу, а байти рядка живуть окремо.</p><p>Приведення <code>long</code> до <code>object</code> виділяє об’єкт-коробку й копіює в неї значення. Зворотне приведення вимагає точного типу коробки: Microsoft прямо пише, що розпаковувати можна лише той самий значущий тип, який пакували. Саме тому <code>(int)</code> на коробці <code>long</code> дає InvalidCastException, хоча 42 вміщується в int. До узагальнень ArrayList тримав Object: додавання пакувало, читання розпаковувало, а компілятор не знав тип елемента. List&lt;long&gt; закриває обидві дірки.</p>",
      player: memoryPlayer(),
      note: "<strong>Це відповідь CLR на затирання Java.</strong> Після erasure параметр стає Object. CLR для List&lt;long&gt; спеціалізує сховище: елемент — 8 байтів у масиві, без окремого об’єкта на кожне число. Наступний слайд покаже, що аргумент типу лишається доступним і під час виконання.",
    },
    {
      group: "C#",
      title: "Reified Generics",
      kind: "mechanism",
      kicker: "C# · реіфікація",
      heading: "List<long> і List<string> — різний машинний код",
      lede: "Той самий текст List&lt;T&gt; у C# після JIT не є одним шматком коду на всі T. Для long і decimal середовище будує окремі версії. Для string і класу Person машинний код спільний, але аргумент типу в об’єкта різний, тож typeof(T) усередині методу повертає справжній тип.",
      essay: "<p>Документація .NET формулює це прямо: узагальнення доступні під час виконання, і середовище знає, який тип лежить у структурі. Тому List&lt;int&gt; зберігає елементи в масиві int, а не в масиві object. Перша підстановка значущого типу породжує спеціалізований машинний код і розкладку полів. Кожен наступний значущий тип, навіть тієї самої ширини, отримує власну версію. Усі посилальні аргументи мають одну спільну версію: ширина посилання однакова.</p><p>З цього випливає те, чого немає в Java. Узагальнений метод може запитати typeof(T) і виконати value is string. Обмеження where T : new() дозволяє new T(). У Java параметр T після компіляції не існує як значення, тому ні new T(), ні instanceof T написати не можна.</p>",
      player: reifiedPlayer(),
      note: "<strong>Спільний код не означає спільний тип.</strong> List&lt;string&gt; і List&lt;Person&gt; не є одним типом для присвоєння. Ділиться лише машинний код. Об’єкт списку пам’ятає свій аргумент.",
    },
    {
      group: "TypeScript",
      title: "Структурна типізація",
      kind: "mechanism",
      kicker: "TypeScript · форма",
      heading: "Person і Named мають одну форму",
      lede: "Java і C# питали ім’я типу. TypeScript питає форму. Інтерфейс Named вимагає поле name. Клас Person ніде не оголошує, що виконує цю вимогу, але має name. Для tsc цього досить. Номінальна мова таке присвоєння відхилила б, доки немає implements.",
      essay: "<p>Перевірка рекурсивна. Якщо поле саме є об’єктом, порівнюють і його члени. Імена параметрів функцій не порівнюють, лише позиції й типи. Порожній інтерфейс не вимагає жодного члена, тому приймає майже будь-яке значення. Таким типом публічний контракт не позначають.</p><p>Окреме, вужче правило діє для свіжого літерала: зайвий ключ є помилкою. Так ловлять друкарську помилку nmae замість name. Якщо той самий об’єкт спершу покласти в змінну, правило зайвого ключа вже не застосовується. Зайве поле тоді просто живе далі в JavaScript.</p>",
      player: structuralPlayer(),
    },
    {
      group: "TypeScript",
      title: "Затирання TypeScript",
      kind: "mechanism",
      kicker: "TypeScript · стирання",
      heading: "as не перетворює значення",
      lede: "Структурна перевірка живе лише до tsc. Оператор as змінює тип виразу для наступних рядків файлу. Значення в пам’яті він не читає і не переписує. Після трансляції з файлу зникають інтерфейс, анотації й сам as. У рантаймі лишається виклик методу на тому об’єкті, який реально прийшов.",
      essay: "<p>Тому TypeScript не має відповідника checkcast. Помилка з’являється лише тоді, коли код торкається відсутнього поля або викликає метод не на тому значенні. До цього моменту об’єкт може пройти пів системи під чужим типом.</p><p>Це свідомий компроміс мови: типи не повинні вимагати окремої машини виконання. Ціна в тому, що дані з мережі, localStorage і відповіді бази лишаються діркою на межі процесу, якщо їх не перевірити вже в JavaScript.</p>",
      player: tsErasePlayer(),
    },
    {
      group: "Варіантність",
      title: "Коваріантність і контраваріантність",
      kind: "mechanism",
      kicker: "Підстановка",
      heading: "Читач приймає підтип, споживач — надтип",
      lede: "Три платформи вже на місці. Спільне питання: коли список собак можна віддати туди, де чекають тварин. Підтип можна показати як надтип, лише поки зі списку читають. Функцію, яка вміє прийняти будь-яку тварину, можна поставити туди, де передадуть собаку. Список, у який і пишуть, і з якого читають, так підміняти не можна.",
      essay: "<p>Напрямок випливає з принципу підстановки Лісков. Якщо з послідовності дістають значення, конкретніший елемент безпечно показувати як загальніший: кожний Dog є Animal. Якщо у функцію передають значення, функція, готова до будь-якого Animal, впорається з Dog. Якщо доступні обидва напрямки, як у List&lt;T&gt;, потрібен точний збіг типів. Інакше в список собак можна дописати Cat.</p><p>Java записує це на місці використання: <code>? extends Animal</code> там, звідки лише читають, <code>? super Dog</code> там, куди лише пишуть. Звідси мнемоніка Bloch: PECS, producer extends, consumer super. C# записує напрямок на оголошенні інтерфейсу чи делегата: <code>out T</code> і <code>in T</code>. Звичайний список в обох мовах інваріантний. Масиви історично коваріантні. У Java і C# запис чужого елемента перехоплює рантайм. У JavaScript тип комірки ніхто не пам’ятає: це наслідок стирання, яке ми щойно бачили.</p>",
      player: variancePlayer(),
    },
    {
      group: "Варіантність",
      title: "Захоплення wildcard",
      kind: "mechanism",
      kicker: "Java · PECS",
      heading: "Чому в список «якихось чисел» не можна дописати Number",
      lede: "Правило «producer extends» щойно прозвучало. Метод приймає List&lt;? extends Number&gt;, щоб прочитати і цілі, і дробові. get повертає Number. add(new Integer(1)) не компілюється, хоча Integer начебто підходить під extends Number.",
      essay: "<p>Компілятор замінює ? на свіжу змінну захоплення. У тексті помилки її часто названо capture#1. Для конкретного виклику це якийсь невідомий підтип Number: сьогодні Integer, завтра Double. Прочитати його як Number можна. Записати Number не можна: Number не є тим невідомим підтипом.</p><p>Якщо get і set мають бачити один тип, захоплення виносять у допоміжний метод із параметром T. Тоді get і set бачать той самий T. Два різні списки, List&lt;? extends Number&gt; цілих і List&lt;? extends Number&gt; дробових, таким методом не змішати: захоплення в кожного списку своє. Повідомлення «capture of» у javac якраз про це, а не про зламаний компілятор.</p>",
      player: wildcardPlayer(),
    },
    {
      group: "Варіантність",
      title: "Коваріантні масиви",
      kind: "mechanism",
      kicker: "Кейс · масиви",
      heading: "String[] відданий як Object[]",
      lede: "PECS забороняє писати в коваріантний список. Масиви в Java і C# цю заборону історично обходять. String[] присвоюється в Object[]. Запис числа компілюється: статичний тип комірки вже Object.",
      essay: "<p>Фактичний масив при цьому пам’ятає, що його компонент — String. Байткод запису, aastore у Java і stelem у CLR, звіряє клас значення з цим компонентом і відмовляє до того, як комірка зміниться. Дані масиву лишаються рядками. Виняток зриває рядок запису, і стек вказує на місце аліаса, а не на рядок, де масив створили.</p><p>Коваріантність масивів зберегли ще з появи мов: інакше не можна було б передати String[] у метод, написаний для Object[], а дженериків ще не було. Коли з’явився List&lt;T&gt;, дірку закрили інваріантністю, а масиви лишилися сумісними зі старим кодом. У TypeScript ArrayStoreException немає: масив JavaScript не зберігає тип комірки. Це не баг компілятора, а навмисна несуцільність, яку розберемо після виправлення через List.</p>",
      player: arrayPlayer(),
    },
    {
      group: "Варіантність",
      title: "Інваріантний List",
      kind: "mechanism",
      kicker: "Кейс · List",
      heading: "List<T> зупиняє підміну ще в компіляторі",
      lede: "Той самий список рядків, зібраний як List&lt;string&gt; або List&lt;String&gt;, не присвоюється в List&lt;Object&gt;. Компілятор відхиляє рядок присвоєння. Запис числа в цей список неможливий: програми, яка б його виконала, немає.",
      essay: "<p>Якщо треба лише прочитати елементи, у Java передають List&lt;? extends String&gt;, у C# — IEnumerable&lt;string&gt;, бо IEnumerable оголошено як IEnumerable&lt;out T&gt;. Запис через таке посилання недоступний, тому підстановка безпечна: це те саме PECS, яке щойно заборонило add у список «якихось чисел». Якщо треба і додавати елементи, потрібен точний T. Для спадкового сирого API лишається checkedList: рантайм-брама на записі, а не сподівання, що викликач більше не покладе Integer.</p>",
      player: listPlayer(),
    },
    {
      group: "Варіантність",
      title: "Навмисна несуцільність",
      kind: "unsound",
    },
    {
      group: "Варіантність",
      title: "Метод і функція",
      kind: "mechanism",
      kicker: "TypeScript · методи",
      heading: "Один і той самий колбек у двох позиціях",
      lede: "List закрив дірку в Java і C#. У TypeScript масив лишається коваріантним, бо push оголошено методом. Функція, яка читає bark у Dog, не вміє обробити Cat. Якщо передати її туди, де обіцяли прийняти будь-який Animal, виклик bark на кішці впаде. Із strictFunctionTypes компілятор бачить це для типу функції й навмисно пропускає метод.",
      essay: "<p>З TypeScript 2.6 прапорець strictFunctionTypes, який входить у strict, перевіряє параметри функцій контраваріантно. Присвоєння (Dog) =&gt; void у (Animal) =&gt; void стає помилкою: функція приймає вужчий аргумент, ніж той, який їй може передати викликач. Handbook називає біваріантність параметрів несуцільною і лишає її для поширених шаблонів JavaScript.</p><p>Методи з цієї перевірки виключені свідомо: інакше Dog[] перестав би бути підтипом Animal[], бо push у масиві — метод. FAQ репозиторію TypeScript фіксує це як «баг, який не є багом». У публічному контракті тип методу слабший за тип функційної властивості з тією самою сигнатурою: слухач події краще оголошувати як властивість <code>handler: (e: Event) =&gt; void</code>, а не як метод.</p>",
      player: fnTypesPlayer(),
    },
    {
      group: "Відсутність",
      title: "Null safety",
      kind: "nulls",
    },
    {
      group: "Відсутність",
      title: "NullReferenceException",
      kind: "mechanism",
      kicker: "Кейс · null",
      heading: "Дві крапки, два різні null",
      lede: "Вираз client.Address.City має два розіменування. Якщо порожній сам client, виняток виникає на читанні Address. Якщо клієнт є, а адреси немає, читання Address вдається й повертає null, а падає вже доступ до City. У журналі обидва випадки виглядають як NullReferenceException на одному рядку.",
      essay: "<p>У ланцюжку два розіменування. Якщо порожній сам клієнт, виняток виникає на читанні Address. Якщо клієнт є, а адреси немає, читання поля Address вдається й повертає null, а падає вже доступ до City. У журналі обидва випадки виглядають як NullReferenceException на одному рядку, хоча причини різні.</p><p>Тоні Гоар назвав null помилкою на мільярд доларів саме через це: у типі відсутність значення не відрізняється від наявності, і збій відсувається до випадкового читання під навантаженням.</p>",
      player: nrePlayer(),
    },
    {
      group: "Відсутність",
      title: "Nullable reference types",
      kind: "mechanism",
      kicker: "Кейс · nullable",
      heading: "Відсутність стає видимою в типі",
      lede: "Після увімкнення nullable reference types адреса, якої може не бути, позначається Address?. Метод приймає Client? і не читає місто, доки шаблон не підтвердить увесь ланцюжок. Якщо клієнта або адреси немає, гілка виводу просто не виконується.",
      essay: "<p>Знак питання розширює тип, а не додає перевірку в CLR сам по собі. Компілятор забороняє розіменування, доки код не звузить значення через if, ??, ?. або шаблон. Оператор ?. повертає null, коли ланка порожня, і не кидає виняток. Шаблон <code>is { Address: { City: string cityName } }</code> одночасно перевіряє обидві ланки і зв’язує місто з ім’ям.</p><p>Попередження nullable можна заглушити знаком !. Це знову дірка, рівносильна припущенню «тут точно не null». Її лишають на межі, де інваріант уже доведено вище по стеку, і в коментарі пояснюють, чому.</p>",
      player: nrtPlayer(),
    },
    {
      group: "Відсутність",
      title: "Анотації null",
      kind: "nrtlead",
    },
    {
      group: "Межа процесу",
      title: "Межа довіри",
      kind: "trust",
    },
    {
      group: "Межа процесу",
      title: "as і any",
      kind: "mechanism",
      kicker: "Кейс · as",
      heading: "Відповідь API, яку привели через as",
      lede: "Тип закінчився на межі процесу: JSON зібрав не цей компілятор. Клієнтський код описав тіло в TypeScript і привів його через as. Сервер випустив версію, де поле називається name, а не displayName. Проєкт компілюється.",
      essay: "<p>response.json() і req.json() у типах DOM мають тип any. any вимикає перевірку полів на цьому значенні. as фіксує бажаний тип для решти файлу і не дивиться в об’єкт. Далі код читає undefined як рядок і викликає метод на відсутньому значенні.</p><p>Гірше за саме падіння — тихе спотворення. Вираз <code>value || 0</code> або <code>value || \"\"</code> перетворює відсутнє поле на правдоподібний нуль чи порожній рядок. Обробка проходить, дані вже хибні, а винятка немає. Тип у репозиторії цей сценарій не забороняє.</p>",
      player: unsafeFetchPlayer(),
    },
    {
      group: "Межа процесу",
      title: "unknown і схема",
      kind: "mechanism",
      kicker: "Кейс · схема",
      heading: "Схема відсікає значення до використання",
      lede: "as щойно показав, що тип файлу не бачить JSON. Тіло відповіді тримають як unknown, доки схема не підтвердить потрібні поля. safeParse або повертає звужений об’єкт, або помилку. Використання даних стоїть лише на гілці success.",
      essay: "<p>unknown навмисно не має полів. Щоб прочитати властивість, значення треба звузити перевіркою. Бібліотека на кшталт Zod лише збирає ці перевірки в одне місце. Вузький type predicate із typeof робить ту саму роботу без залежності.</p><p>У Java й C# парсер JSON у клас теж не замінює змістовної перевірки: відсутнє поле часто стає null або нулем за налаштуванням мапера. Контракт перевіряють після розбору, до використання. Статичний тип тоді описує вже перевірене значення, а не сподівання на зовнішнє API.</p>",
      player: zodPlayer(),
    },
    {
      group: "Межа процесу",
      title: "Нуль від мапера",
      kind: "mechanism",
      kicker: "Кейс · мапер",
      heading: "Відсутнє поле стає законним нулем",
      lede: "Той самий розрив, лише вже не TypeScript. Поле maxRetries типу int у Java і властивість int у C# без значення в JSON лишаються 0. Це не помилка розбору: мапер підставив значення за замовчуванням мови. Нуль проходить перевірку типів, бо 0 є коректним int.",
      essay: "<p>Падіння на виклику методу відсутнього рядка принаймні видно в журналі. Нульовий примітив не видний, доки інваріант предметної області не розійдеться. Тому для обов’язкового числа примітив без окремої перевірки, чи поле взагалі було в документі, гірший за виняток.</p><p>У Java поле роблять Integer або беруть конструктор рекорда, де параметр обов’язковий, і перевіряють значення до використання. У C# для обов’язкового JSON є required і JsonRequiredAttribute; відсутність тоді помилка розбору, а не нуль. Тип int? відрізняє «не прийшло» від «прийшов нуль», якщо мапер не підставляє значення за замовчуванням мовчки.</p>",
      player: mapperZeroPlayer(),
    },
    {
      group: "Межа процесу",
      title: "Небезпечне приведення",
      kind: "mechanism",
      kicker: "Кейс · приведення",
      heading: "Базовий тип і хибний підклас",
      lede: "Схема вже відсікає форму JSON. Інша дірка — коли API повертає базовий тип, а код здогадується про клас. Реєстр віддає Animal. Для собаки це Dog, для птаха — Bird із методом fly. Явне приведення до Bird компілюється, бо інколи в реєстрі справді лежить цей клас. Чи лежить він зараз, компілятор не знає.",
      essay: "<p>Статичний тип після get — базовий клас. Фактичний клас записаний в об’єкті. checkcast у Java й інструкція castclass у CLR звіряють їх у момент приведення. Невдача дає ClassCastException або InvalidCastException ще до виклику методу підкласу.</p><p>Безпечна форма не звужує тип заздалегідь. У Java це <code>instanceof Bird bird</code>, у C# — <code>is Bird bird</code>. Гілка виконується лише після підтвердження класу. Якщо поведінки справді різні, краще окремий метод на інтерфейсі, ніж гілка за типом: тоді новий підклас не змушує шукати всі приведення по репозиторію.</p>",
      player: downcastPlayer(),
    },
    {
      group: "Межа процесу",
      title: "Ім’я типу з JSON",
      kind: "poly",
    },
    {
      group: "Практика",
      title: "Задача 1 · список",
      kind: "mechanism",
      kicker: "Практика · задача 1",
      heading: "Геттер віддав саме поле — чужий код пише всередину",
      essayAfter: true,
      lede: "<p><b>Суть.</b> Приватний список лишається приватним, лише поки його не віддали тим самим посиланням. Після <code>return names</code> викликач і клас дивляться на один об’єкт. Далі число 42 потрапляє в список «рядків».</p><p><b>Поломка.</b> Java: сирий <code>List</code> і <code>add(42)</code>, падає <code>get</code>. C#: <code>IList.Add(42)</code> у <code>List&lt;object&gt;</code>, падає приведення до <code>string</code>. TypeScript: <code>as any[]</code> і <code>push(42)</code>, винятка немає — у змінній лишається число.</p><p><b>Виправлення.</b> Віддати копію без права запису: <code>List.copyOf</code>, <code>AsReadOnly</code>, <code>Object.freeze(slice())</code>. Оберіть мову і пройдіть обидва сценарії.</p>",
      essay: "<p><b>Правило.</b> Метод, що повертає внутрішню колекцію, віддає право запису. Виправлення — нова колекція або знімок без запису. Де саме падає запис чужого типу, залежить від мови: Java часто на <code>get</code>, C# на приведенні, TypeScript може не падати взагалі.</p>",
      player: leakListPlayer(),
    },
    {
      group: "Практика",
      title: "Задача 2 · нуль",
      kind: "mechanism",
      kicker: "Практика · задача 2",
      heading: "Пошук для int підставляє 0, коли елемента немає",
      essayAfter: true,
      lede: "<p><b>Суть.</b> Для цілого числа «немає елемента» теж треба якось повернути. Якщо підставити <code>0</code>, його не відрізнити від нуля, який лежить у списку. Програма множить і йде далі.</p><p><b>Поломка.</b> Список <code>0, 3, 5</code>, шукаємо число більше за 10. Java: <code>orElse(0)</code>. C#: <code>FirstOrDefault</code>. TypeScript: <code>find(...) ?? 0</code>.</p><p><b>Виправлення.</b> Окремий сигнал відсутності: порожній <code>Optional</code>, індекс <code>-1</code>, <code>undefined</code>. Оберіть мову і пройдіть обидва сценарії.</p>",
      essay: "<p><b>Правило.</b> Нуль — валідне значення <code>int</code>, ним не позначають відсутність. Потрібен окремий результат: <code>Optional</code> / <code>OptionalInt</code>, індекс або <code>bool</code>, у TypeScript — <code>undefined</code> без <code>?? 0</code>.</p>",
      player: firstDefaultPlayer(),
    },
    {
      group: "Практика",
      title: "Задача 3 · UserId",
      kind: "mechanism",
      kicker: "Практика · задача 3",
      heading: "UserId із сирого числа минає перевірку",
      essayAfter: true,
      lede: "<p><b>Суть.</b> <code>load</code> хоче <code>UserId</code>, не будь-яке число. Компілятор це тримає, поки ми самі не збудуємо <code>UserId</code> із JSON або мапи без перевірки значення.</p><p><b>Поломка.</b> Java і C#: <code>new UserId(42)</code> з поля мапи. TypeScript: <code>as UserId</code> після <code>JSON.parse</code>. Усі три збірки проходять, значення не дивились.</p><p><b>Виправлення.</b> Одна функція <code>parseUserId</code>: спочатку перевірити, що це додатне ціле, і лише тоді створити <code>UserId</code>. Оберіть мову і пройдіть обидва сценарії.</p>",
      essay: "<p><b>Правило.</b> Номінативний тип у Java і C# відсікає голе число на виклику <code>load</code>. Дірка — конструктор із зовнішніх байтів. У TypeScript бренд існує лише до трансляції, тому <code>as</code> знімає перевірку ще раніше. На межі процесу потрібен розбір значення, не приведення.</p>",
      player: brandIdPlayer(),
    },
    {
      group: "Практика",
      title: "Висновки",
      kind: "close",
    },
  ];

  function leakListPlayer() {
    const bugStages = [
      { id: "alias", label: "return names", sub: "віддали саме поле" },
      { id: "raw", label: "Сирий аліас", sub: "тип елемента знято" },
      { id: "write", label: "add(42)", sub: "число потрапило всередину" },
      { id: "read", label: "читання", sub: "очікували рядок" },
    ];
    const fixStages = [
      { id: "copy", label: "Копія", sub: "нова колекція" },
      { id: "alias", label: "аліас", sub: "дивиться на копію" },
      { id: "write", label: "add(42)", sub: "запис заборонено" },
    ];
    return {
      tracks: [
        {
          id: "java",
          label: "Java",
          lang: "java",
          file: "NameBook.java",
          scenarios: [
            {
              id: "bug",
              label: "Поломка",
              code: `class NameBook {
    private final List<String> names = new ArrayList<>();
    public List<String> names() {
        return names;
    }
}
NameBook book = new NameBook();
List raw = book.names();
raw.add(Integer.valueOf(42));
String label = book.names().get(0);`,
              stages: bugStages,
              steps: [
                {
                  stage: "alias",
                  lines: [3, 4, 8],
                  tone: "warn",
                  artifactTitle: "Це той самий список, не копія",
                  artifact: "names() повернув поле класу\nзмінна raw дивиться на той самий ArrayList\nхто завгодно тепер може в нього писати",
                  trace: "метод віддав внутрішній список",
                },
                {
                  stage: "raw",
                  lines: [8],
                  tone: "warn",
                  artifactTitle: "У raw уже не написано «лише рядки»",
                  artifact: "List без <String> приймає будь-який об’єкт\nкомпілятор лише попереджає\nadd більше не вимагає рядок",
                  trace: "змінну оголошено як сирий List",
                },
                {
                  stage: "write",
                  lines: [9],
                  tone: "bad",
                  artifactTitle: "Число вже лежить у списку імен",
                  artifact: "add(42) виконався без винятка\nу списку зараз Integer, не рядок\nNameBook цього не бачить: запис був ззовні",
                  trace: "запис пройшов",
                },
                {
                  stage: "read",
                  lines: [10],
                  tone: "bad",
                  artifactTitle: "Падає читання, бо тип уже збрехав",
                  artifact: "get(0) дістав число 42\nпрограма хоче покласти його в String label\nClassCastException на цьому рядку\nрядок add уже давно виконався",
                  trace: "виняток на get, не на add",
                  fail: true,
                },
              ],
            },
            {
              id: "fix",
              label: "Виправлення",
              code: `class NameBook {
    private final List<String> names = new ArrayList<>();
    public List<String> names() {
        return List.copyOf(names);
    }
}
NameBook book = new NameBook();
List raw = book.names();
raw.add(Integer.valueOf(42));
String label = book.names().get(0);`,
              stages: fixStages,
              steps: [
                {
                  stage: "copy",
                  lines: [3, 4],
                  tone: "ok",
                  artifactTitle: "Метод віддає знімок, не поле",
                  artifact: "List.copyOf створює новий список\nу нього не можна писати\nполе names лишається всередині класу",
                  trace: "повернули копію без права запису",
                },
                {
                  stage: "alias",
                  lines: [8],
                  tone: "info",
                  artifactTitle: "raw більше не є полем NameBook",
                  artifact: "book.names і raw — різні об’єкти\nнавіть сирий List бачить уже копію\nполе класу з цього рядка не зміниться",
                  trace: "аліас стоїть на копії",
                },
                {
                  stage: "write",
                  lines: [9],
                  tone: "ok",
                  artifactTitle: "add падає тут, get не виконується",
                  artifact: "UnsupportedOperationException на add\nчисло 42 у поле не потрапило\nрядок get(0) не дійшов до виконання",
                  trace: "запис відхилено на межі копії",
                },
              ],
            },
          ],
        },
        {
          id: "cs",
          label: "C#",
          lang: "cs",
          file: "NameBook.cs",
          scenarios: [
            {
              id: "bug",
              label: "Поломка",
              code: `class NameBook {
    private readonly List<object> names = new List<object>();
    public List<object> Names() {
        return names;
    }
}
NameBook book = new NameBook();
IList raw = book.Names();
raw.Add(42);
string label = (string)book.Names()[0];`,
              stages: bugStages,
              steps: [
                {
                  stage: "alias",
                  lines: [3, 4, 8],
                  tone: "warn",
                  artifactTitle: "Це той самий список, не копія",
                  artifact: "Names() повернув поле класу\nзмінна raw дивиться на той самий List\nхто завгодно тепер може в нього писати",
                  trace: "метод віддав внутрішній список",
                },
                {
                  stage: "raw",
                  lines: [8],
                  tone: "warn",
                  artifactTitle: "IList.Add приймає object",
                  artifact: "IList ховає List<object>\nAdd(42) збирається: аргумент object\nрядок компілюється, хоча поле задумане під імена",
                  trace: "змінну оголошено як IList",
                },
                {
                  stage: "write",
                  lines: [9],
                  tone: "bad",
                  artifactTitle: "Число вже лежить у списку імен",
                  artifact: "Add(42) виконався: 42 пакується в object\nу списку зараз int, не рядок\nNameBook цього не бачить: запис був ззовні",
                  trace: "запис пройшов",
                },
                {
                  stage: "read",
                  lines: [10],
                  tone: "bad",
                  artifactTitle: "Падає приведення до string",
                  artifact: "Names()[0] дістав упаковане 42\n(string) не проходить\nInvalidCastException на цьому рядку\nрядок Add уже давно виконався",
                  trace: "виняток на приведенні, не на Add",
                  fail: true,
                },
              ],
            },
            {
              id: "fix",
              label: "Виправлення",
              code: `class NameBook {
    private readonly List<object> names = new List<object>();
    public IList Names() {
        return names.AsReadOnly();
    }
}
NameBook book = new NameBook();
IList raw = book.Names();
raw.Add(42);
string label = (string)book.Names()[0];`,
              stages: fixStages,
              steps: [
                {
                  stage: "copy",
                  lines: [3, 4],
                  tone: "ok",
                  artifactTitle: "Метод віддає знімок без запису",
                  artifact: "AsReadOnly обгортає список\nAdd на обгортці заборонено\nполе names лишається всередині класу",
                  trace: "повернули знімок без права запису",
                },
                {
                  stage: "alias",
                  lines: [8],
                  tone: "info",
                  artifactTitle: "raw більше не є полем NameBook",
                  artifact: "raw — ReadOnlyCollection\nнавіть через IList це вже не поле\nполе класу з цього рядка не зміниться",
                  trace: "аліас стоїть на знімку",
                },
                {
                  stage: "write",
                  lines: [9],
                  tone: "ok",
                  artifactTitle: "Add падає тут, читання не виконується",
                  artifact: "NotSupportedException на Add\nчисло 42 у поле не потрапило\nрядок з приведенням до string не дійшов",
                  trace: "запис відхилено на межі знімка",
                },
              ],
            },
          ],
        },
        {
          id: "ts",
          label: "TypeScript",
          lang: "ts",
          file: "name-book.ts",
          scenarios: [
            {
              id: "bug",
              label: "Поломка",
              code: `class NameBook {
    private names: string[] = [];
    names(): string[] {
        return this.names;
    }
}
const book = new NameBook();
const raw = book.names() as any[];
raw.push(42);
const label: string = book.names()[0];`,
              stages: bugStages,
              steps: [
                {
                  stage: "alias",
                  lines: [3, 4, 8],
                  tone: "warn",
                  artifactTitle: "Це той самий масив, не копія",
                  artifact: "names() повернув поле класу\nзмінна raw дивиться на той самий масив\nхто завгодно тепер може в нього писати",
                  trace: "метод віддав внутрішній масив",
                },
                {
                  stage: "raw",
                  lines: [8],
                  tone: "warn",
                  artifactTitle: "as any[] знімає string[]",
                  artifact: "as не копіює масив і не перевіряє елементи\npush тепер приймає будь-що\nкомпілятор замовк",
                  trace: "масив оголошено як any[]",
                },
                {
                  stage: "write",
                  lines: [9],
                  tone: "bad",
                  artifactTitle: "Число вже лежить у масиві імен",
                  artifact: "push(42) виконався без винятка\nу масиві зараз 42, не рядок\nNameBook цього не бачить: запис був ззовні",
                  trace: "запис пройшов",
                },
                {
                  stage: "read",
                  lines: [10],
                  tone: "bad",
                  artifactTitle: "Винятка немає, у label лежить 42",
                  artifact: "book.names()[0] повертає 42\nтип string після tsc уже стерто\nlabel тримає число, програма йде далі",
                  trace: "читання пройшло, тип збрехав мовчки",
                  fail: true,
                },
              ],
            },
            {
              id: "fix",
              label: "Виправлення",
              code: `class NameBook {
    private names: string[] = [];
    names(): readonly string[] {
        return Object.freeze(this.names.slice());
    }
}
const book = new NameBook();
const raw = book.names() as any[];
raw.push(42);
const label: string = book.names()[0];`,
              stages: fixStages,
              steps: [
                {
                  stage: "copy",
                  lines: [3, 4],
                  tone: "ok",
                  artifactTitle: "Метод віддає знімок, не поле",
                  artifact: "slice копіює масив\nfreeze забороняє push\nполе names лишається всередині класу",
                  trace: "повернули заморожену копію",
                },
                {
                  stage: "alias",
                  lines: [8],
                  tone: "info",
                  artifactTitle: "raw більше не є полем NameBook",
                  artifact: "as any[] стоїть уже на копії\nполе класу з цього рядка не зміниться\nfreeze лишається на об’єкті після tsc",
                  trace: "аліас стоїть на копії",
                },
                {
                  stage: "write",
                  lines: [9],
                  tone: "ok",
                  artifactTitle: "push падає тут, читання не виконується",
                  artifact: "TypeError на push у суворому режимі\nчисло 42 у поле не потрапило\nрядок label не дійшов до виконання",
                  trace: "запис відхилено на замороженій копії",
                },
              ],
            },
          ],
        },
      ],
    };
  }

  function firstDefaultPlayer() {
    const bugStages = [
      { id: "src", label: "Список", sub: "0, 3, 5" },
      { id: "pred", label: "Пошук", sub: "більше за 10 — немає" },
      { id: "def", label: "Нічого не знайшли", sub: "підставили 0" },
      { id: "use", label: "Множення", sub: "програма думає, що знайшла" },
    ];
    const fixStages = [
      { id: "src", label: "Список", sub: "0, 3, 5" },
      { id: "idx", label: "Окремий сигнал", sub: "немає ≠ 0" },
      { id: "miss", label: "Зупинка", sub: "множення не виконується" },
    ];
    return {
      tracks: [
        {
          id: "java",
          label: "Java",
          lang: "java",
          file: "Counts.java",
          scenarios: [
            {
              id: "bug",
              label: "Поломка",
              code: `List<Integer> counts = List.of(0, 3, 5);
int found = counts.stream().filter(n -> n > 10).findFirst().orElse(0);
int scaled = found * 2;`,
              stages: bugStages,
              steps: [
                {
                  stage: "src",
                  lines: [1],
                  tone: "info",
                  artifactTitle: "У списку три числа",
                  artifact: "перше число — 0\nдруге — 3\nтретє — 5\n0 тут звичайний елемент",
                  trace: "список створено",
                },
                {
                  stage: "pred",
                  lines: [2],
                  tone: "info",
                  artifactTitle: "Жодне число не більше за 10",
                  artifact: "0 > 10? ні\n3 > 10? ні\n5 > 10? ні\nшукати більше нічого",
                  trace: "підхожого числа немає",
                },
                {
                  stage: "def",
                  lines: [2],
                  tone: "warn",
                  artifactTitle: "orElse підставив 0",
                  artifact: "findFirst дав порожній Optional\norElse(0) закриває порожнечу нулем\nу списку теж є 0 — їх не розрізнити",
                  trace: "found = 0, хоча більшого за 10 не було",
                },
                {
                  stage: "use",
                  lines: [3],
                  tone: "bad",
                  artifactTitle: "0 множать і ніхто не падає",
                  artifact: "found = 0\nscaled = 0\nдля int це нормально, винятка немає\nпрограма вважає, що число знайшли",
                  trace: "результат виглядає як успішний пошук",
                  fail: true,
                },
              ],
            },
            {
              id: "fix",
              label: "Виправлення",
              code: `List<Integer> counts = List.of(0, 3, 5);
Optional<Integer> found = counts.stream().filter(n -> n > 10).findFirst();
if (found.isEmpty())
    throw new IllegalStateException("немає такого числа");
int scaled = found.get() * 2;`,
              stages: fixStages,
              steps: [
                {
                  stage: "src",
                  lines: [1],
                  tone: "info",
                  artifactTitle: "Той самий список",
                  artifact: "0, 3, 5\nнуль як і раніше звичайне число\nпитання: чи є щось більше за 10",
                  trace: "список створено",
                },
                {
                  stage: "idx",
                  lines: [2],
                  tone: "info",
                  artifactTitle: "Optional окремо каже «порожньо»",
                  artifact: "findFirst без orElse\nfound.isEmpty() = true\nнуль зі списку сюди не потрапив",
                  trace: "Optional порожній",
                },
                {
                  stage: "miss",
                  lines: [3, 4],
                  tone: "ok",
                  artifactTitle: "Відсутність видно окремо",
                  artifact: "isEmpty → кидаємо виняток\nрядок scaled не виконується\n0 зі списку ніхто не прийняв за «знайшли»",
                  trace: "програма зупинилась, бо елемента немає",
                },
              ],
            },
          ],
        },
        {
          id: "cs",
          label: "C#",
          lang: "cs",
          file: "Counts.cs",
          scenarios: [
            {
              id: "bug",
              label: "Поломка",
              code: `var counts = new List<int> { 0, 3, 5 };
int found = counts.FirstOrDefault(n => n > 10);
int scaled = found * 2;`,
              stages: bugStages,
              steps: [
                {
                  stage: "src",
                  lines: [1],
                  tone: "info",
                  artifactTitle: "У списку три числа",
                  artifact: "перше число — 0\nдруге — 3\nтретє — 5\n0 тут звичайний елемент",
                  trace: "список створено",
                },
                {
                  stage: "pred",
                  lines: [2],
                  tone: "info",
                  artifactTitle: "Жодне число не більше за 10",
                  artifact: "0 > 10? ні\n3 > 10? ні\n5 > 10? ні\nшукати більше нічого",
                  trace: "підхожого числа немає",
                },
                {
                  stage: "def",
                  lines: [2],
                  tone: "warn",
                  artifactTitle: "FirstOrDefault підставив 0",
                  artifact: "коли нічого не знайдено, для int це default = 0\nце заглушка, не елемент зі списку\nу списку теж є 0 — їх не розрізнити",
                  trace: "found = 0, хоча більшого за 10 не було",
                },
                {
                  stage: "use",
                  lines: [3],
                  tone: "bad",
                  artifactTitle: "0 множать і ніхто не падає",
                  artifact: "found = 0\nscaled = 0\nдля int це нормально, винятка немає\nпрограма вважає, що число знайшли",
                  trace: "результат виглядає як успішний пошук",
                  fail: true,
                },
              ],
            },
            {
              id: "fix",
              label: "Виправлення",
              code: `var counts = new List<int> { 0, 3, 5 };
int index = counts.FindIndex(n => n > 10);
if (index < 0)
    throw new InvalidOperationException("немає такого числа");
int scaled = counts[index] * 2;`,
              stages: fixStages,
              steps: [
                {
                  stage: "src",
                  lines: [1],
                  tone: "info",
                  artifactTitle: "Той самий список",
                  artifact: "0, 3, 5\nнуль як і раніше звичайне число\nпитання: чи є щось більше за 10",
                  trace: "список створено",
                },
                {
                  stage: "idx",
                  lines: [2],
                  tone: "info",
                  artifactTitle: "FindIndex відповідає позицією",
                  artifact: "жодне число не більше за 10\nметод повертає -1\n-1 не є індексом, 0 був би першим елементом",
                  trace: "index = -1",
                },
                {
                  stage: "miss",
                  lines: [3, 4],
                  tone: "ok",
                  artifactTitle: "Відсутність видно окремо",
                  artifact: "index < 0 → кидаємо виняток\nрядок scaled не виконується\n0 зі списку ніхто не прийняв за «знайшли»",
                  trace: "програма зупинилась, бо елемента немає",
                },
              ],
            },
          ],
        },
        {
          id: "ts",
          label: "TypeScript",
          lang: "ts",
          file: "counts.ts",
          scenarios: [
            {
              id: "bug",
              label: "Поломка",
              code: `const counts = [0, 3, 5];
const found = counts.find(n => n > 10) ?? 0;
const scaled = found * 2;`,
              stages: bugStages,
              steps: [
                {
                  stage: "src",
                  lines: [1],
                  tone: "info",
                  artifactTitle: "У масиві три числа",
                  artifact: "перше число — 0\nдруге — 3\nтретє — 5\n0 тут звичайний елемент",
                  trace: "масив створено",
                },
                {
                  stage: "pred",
                  lines: [2],
                  tone: "info",
                  artifactTitle: "Жодне число не більше за 10",
                  artifact: "0 > 10? ні\n3 > 10? ні\n5 > 10? ні\nfind повертає undefined",
                  trace: "підхожого числа немає",
                },
                {
                  stage: "def",
                  lines: [2],
                  tone: "warn",
                  artifactTitle: "?? підставив 0",
                  artifact: "undefined ?? 0 дає 0\nце заглушка, не елемент з масиву\nу масиві теж є 0 — їх не розрізнити",
                  trace: "found = 0, хоча більшого за 10 не було",
                },
                {
                  stage: "use",
                  lines: [3],
                  tone: "bad",
                  artifactTitle: "0 множать і ніхто не падає",
                  artifact: "found = 0\nscaled = 0\nдля number це нормально, винятка немає\nпрограма вважає, що число знайшли",
                  trace: "результат виглядає як успішний пошук",
                  fail: true,
                },
              ],
            },
            {
              id: "fix",
              label: "Виправлення",
              code: `const counts = [0, 3, 5];
const found = counts.find(n => n > 10);
if (found === undefined)
    throw new Error("немає такого числа");
const scaled = found * 2;`,
              stages: fixStages,
              steps: [
                {
                  stage: "src",
                  lines: [1],
                  tone: "info",
                  artifactTitle: "Той самий масив",
                  artifact: "0, 3, 5\nнуль як і раніше звичайне число\nпитання: чи є щось більше за 10",
                  trace: "масив створено",
                },
                {
                  stage: "idx",
                  lines: [2],
                  tone: "info",
                  artifactTitle: "find лишає undefined",
                  artifact: "без ?? 0 результат — undefined\nце окремо від числа 0\nнуль з масиву сюди не потрапив",
                  trace: "found = undefined",
                },
                {
                  stage: "miss",
                  lines: [3, 4],
                  tone: "ok",
                  artifactTitle: "Відсутність видно окремо",
                  artifact: "undefined → кидаємо виняток\nрядок scaled не виконується\n0 з масиву ніхто не прийняв за «знайшли»",
                  trace: "програма зупинилась, бо елемента немає",
                },
              ],
            },
          ],
        },
      ],
    };
  }

  function brandIdPlayer() {
    const bugStages = [
      { id: "parse", label: "Сирі дані", sub: "прийшло число 42" },
      { id: "cast", label: "Без перевірки", sub: "просто зробили UserId" },
      { id: "call", label: "load", sub: "виклик проходить" },
    ];
    const fixStages = [
      { id: "gate", label: "parseUserId", sub: "спочатку перевірка" },
      { id: "parse", label: "Сирі дані", sub: "ще не UserId" },
      { id: "call", label: "load", sub: "лише після перевірки" },
    ];
    return {
      tracks: [
        {
          id: "java",
          label: "Java",
          lang: "java",
          file: "UserId.java",
          scenarios: [
            {
              id: "bug",
              label: "Поломка",
              code: `record UserId(long value) {}
long load(UserId id) {
    return id.value();
}
Map<String, Object> raw = Map.of("id", 42);
UserId id = new UserId(((Number) raw.get("id")).longValue());
load(id);`,
              stages: bugStages,
              steps: [
                {
                  stage: "parse",
                  lines: [5],
                  tone: "warn",
                  artifactTitle: "З мапи прийшло звичайне число",
                  artifact: "Map.of не знає про UserId\nполе id має тип Object, фактично Integer 42\nload(42) тут би не зібрався",
                  trace: "з мапи отримали Number",
                },
                {
                  stage: "cast",
                  lines: [6],
                  tone: "warn",
                  artifactTitle: "Конструктор нічого не перевіряє",
                  artifact: "new UserId(42) лише пакує long\nякби в мапі було -1, конструктор теж пропустив би\nкомпілятор бачить уже UserId",
                  trace: "створили UserId без розбору",
                },
                {
                  stage: "call",
                  lines: [7],
                  tone: "bad",
                  artifactTitle: "load викликали, ніби id уже перевірений",
                  artifact: "рядок збирається і виконується\nload отримує UserId(42)\nномінативний тип тут уже нічого не стоїть",
                  trace: "виклик пройшов без перевірки числа",
                  fail: true,
                },
              ],
            },
            {
              id: "fix",
              label: "Виправлення",
              code: `record UserId(long value) {}
UserId parseUserId(Object raw) {
    if (!(raw instanceof Number n) || n.longValue() <= 0)
        throw new IllegalArgumentException("очікували UserId");
    return new UserId(n.longValue());
}
long load(UserId id) {
    return id.value();
}
Map<String, Object> raw = Map.of("id", 42);
load(parseUserId(raw.get("id")));`,
              stages: fixStages,
              steps: [
                {
                  stage: "gate",
                  lines: [2, 3, 4, 5],
                  tone: "ok",
                  artifactTitle: "UserId ставлять після перевірки значення",
                  artifact: "функція дивиться: це Number і long > 0\nлише тоді new UserId\nякби прийшло -1 або рядок, кинули б виняток",
                  trace: "брама на межі процесу",
                },
                {
                  stage: "parse",
                  lines: [10],
                  tone: "info",
                  artifactTitle: "Мапа лишається сирою",
                  artifact: "raw.get(\"id\") ще Object\nу load його не передають напряму\nспочатку parseUserId",
                  trace: "з мапи узяли сире поле id",
                },
                {
                  stage: "call",
                  lines: [11],
                  tone: "ok",
                  artifactTitle: "42 пройшло перевірку, потім load",
                  artifact: "parseUserId(42) — ціле і додатне\nконструктор тепер після брами\nload отримує вже розібраний id",
                  trace: "виклик після розбору",
                },
              ],
            },
          ],
        },
        {
          id: "cs",
          label: "C#",
          lang: "cs",
          file: "UserId.cs",
          scenarios: [
            {
              id: "bug",
              label: "Поломка",
              code: `readonly record struct UserId(long Value);
long Load(UserId id) {
    return id.Value;
}
var raw = new Dictionary<string, object> { ["id"] = 42L };
var id = new UserId(Convert.ToInt64(raw["id"]));
Load(id);`,
              stages: bugStages,
              steps: [
                {
                  stage: "parse",
                  lines: [5],
                  tone: "warn",
                  artifactTitle: "З словника прийшло звичайне число",
                  artifact: "Dictionary не знає про UserId\nполе id має тип object, фактично 42L\nLoad(42) тут би не зібрався",
                  trace: "зі словника отримали object",
                },
                {
                  stage: "cast",
                  lines: [6],
                  tone: "warn",
                  artifactTitle: "Конструктор нічого не перевіряє",
                  artifact: "new UserId(42) лише пакує long\nякби в словнику було -1, конструктор теж пропустив би\nкомпілятор бачить уже UserId",
                  trace: "створили UserId без розбору",
                },
                {
                  stage: "call",
                  lines: [7],
                  tone: "bad",
                  artifactTitle: "Load викликали, ніби id уже перевірений",
                  artifact: "рядок збирається і виконується\nLoad отримує UserId(42)\nномінативний тип тут уже нічого не стоїть",
                  trace: "виклик пройшов без перевірки числа",
                  fail: true,
                },
              ],
            },
            {
              id: "fix",
              label: "Виправлення",
              code: `readonly record struct UserId(long Value);
UserId ParseUserId(object raw) {
    if (raw is not long n || n <= 0)
        throw new ArgumentException("очікували UserId");
    return new UserId(n);
}
long Load(UserId id) {
    return id.Value;
}
var raw = new Dictionary<string, object> { ["id"] = 42L };
Load(ParseUserId(raw["id"]));`,
              stages: fixStages,
              steps: [
                {
                  stage: "gate",
                  lines: [2, 3, 4, 5],
                  tone: "ok",
                  artifactTitle: "UserId ставлять після перевірки значення",
                  artifact: "функція дивиться: це long і > 0\nлише тоді new UserId\nякби прийшло -1 або рядок, кинули б виняток",
                  trace: "брама на межі процесу",
                },
                {
                  stage: "parse",
                  lines: [10],
                  tone: "info",
                  artifactTitle: "Словник лишається сирим",
                  artifact: "raw[\"id\"] ще object\nу Load його не передають напряму\nспочатку ParseUserId",
                  trace: "зі словника узяли сире поле id",
                },
                {
                  stage: "call",
                  lines: [11],
                  tone: "ok",
                  artifactTitle: "42 пройшло перевірку, потім Load",
                  artifact: "ParseUserId(42L) — long і додатне\nконструктор тепер після брами\nLoad отримує вже розібраний id",
                  trace: "виклик після розбору",
                },
              ],
            },
          ],
        },
        {
          id: "ts",
          label: "TypeScript",
          lang: "ts",
          file: "userid.ts",
          scenarios: [
            {
              id: "bug",
              label: "Поломка",
              code: `type UserId = number & { readonly brand: unique symbol };
function load(id: UserId): number {
    return id;
}
const raw = JSON.parse('{"id":42}') as { id: number };
load(raw.id as UserId);`,
              stages: bugStages,
              steps: [
                {
                  stage: "parse",
                  lines: [5],
                  tone: "warn",
                  artifactTitle: "З файлу прийшло звичайне число",
                  artifact: "JSON.parse не знає про UserId\nпісля as { id: number } поле id має тип number\nце знову просто 42\nload(42) без as тут би не зібрався",
                  trace: "з JSON отримали number",
                },
                {
                  stage: "cast",
                  lines: [6],
                  tone: "warn",
                  artifactTitle: "as нічого не перевіряє",
                  artifact: "as UserId лише закриває рот компілятору\nу пам’яті лишається 42\nякби в JSON було -1, as теж пропустив би",
                  trace: "приведення не дивиться на значення",
                },
                {
                  stage: "call",
                  lines: [6],
                  tone: "bad",
                  artifactTitle: "load викликали, ніби це вже UserId",
                  artifact: "рядок збирається і виконується\nload отримує 42\nмітка UserId тут уже нічого не стоїть",
                  trace: "виклик пройшов без перевірки числа",
                  fail: true,
                },
              ],
            },
            {
              id: "fix",
              label: "Виправлення",
              code: `type UserId = number & { readonly brand: unique symbol };
function parseUserId(raw: unknown): UserId {
    if (typeof raw !== "number" || !Number.isInteger(raw) || raw <= 0)
        throw new Error("очікували UserId");
    return raw as UserId;
}
function load(id: UserId): number {
    return id;
}
const raw = JSON.parse('{"id":42}');
load(parseUserId(raw.id));`,
              stages: fixStages,
              steps: [
                {
                  stage: "gate",
                  lines: [2, 3, 4, 5],
                  tone: "ok",
                  artifactTitle: "Бренд ставлять після перевірки значення",
                  artifact: "функція дивиться: це число, ціле, більше за 0\nлише тоді raw as UserId\nякби прийшло -1 або рядок, кинули б Error",
                  trace: "брама на межі процесу",
                },
                {
                  stage: "parse",
                  lines: [10],
                  tone: "info",
                  artifactTitle: "JSON лишається сирим",
                  artifact: "parse дає звичайний об’єкт\nraw.id ще не UserId\nу load його не передають напряму",
                  trace: "з JSON узяли сире поле id",
                },
                {
                  stage: "call",
                  lines: [11],
                  tone: "ok",
                  artifactTitle: "42 пройшло перевірку, потім load",
                  artifact: "parseUserId(42) — ціле і додатне\nтепер as законний: значення вже звірене\nload отримує id після брами, не після голого as",
                  trace: "виклик після розбору",
                },
              ],
            },
          ],
        },
      ],
    };
  }

  function boundsMemPlayer() {
    return {
      lang: "java",
      file: "Bounds.java",
      scenarios: [
        {
          id: "java",
          label: "Java",
          code: `int[] cells = { 10, 20, 30 };
int mid = cells[1];
cells[3] = 99;`,
          stages: [
            { id: "alloc", label: "Створення", sub: "length = 3" },
            { id: "read", label: "Читання", sub: "індекс 1 у межах" },
            { id: "write", label: "Запис", sub: "індекс 3 поза length" },
          ],
          steps: [
            {
              stage: "alloc",
              lines: [1],
              tone: "info",
              artifactTitle: "Масив знає свою довжину",
              artifact: "компонент int, length = 3\n[0]=10 [1]=20 [2]=30\nрозкладку об’єкта вибрав рантайм, не програміст\nадреси сусідніх об’єктів у змінній немає",
              trace: "JVM тримає length у заголовку масиву",
            },
            {
              stage: "read",
              lines: [2],
              tone: "ok",
              artifactTitle: "Індекс 1 проходить перевірку",
              artifact: "0 ≤ 1 < 3\nmid = 20\nбайткод iaload звіряє індекс із length\nсусідні об’єкти в купі не читаються",
              trace: "читання в межах length",
            },
            {
              stage: "write",
              lines: [3],
              tone: "bad",
              artifactTitle: "Запис відхилено до зміни пам’яті",
              artifact: "індекс 3 не менший за length 3\nArrayIndexOutOfBoundsException\nкомірки лишилися 10, 20, 30\nсусідній об’єкт у купі не змінюється",
              trace: "перевірка меж зупиняє рядок",
              fail: true,
            },
          ],
        },
        {
          id: "cs",
          label: "C#",
          lang: "cs",
          file: "Bounds.cs",
          code: `int[] cells = { 10, 20, 30 };
int mid = cells[1];
cells[3] = 99;`,
          stages: [
            { id: "alloc", label: "Створення", sub: "Length = 3" },
            { id: "read", label: "Читання", sub: "індекс 1 у межах" },
            { id: "write", label: "Запис", sub: "індекс 3 поза Length" },
          ],
          steps: [
            {
              stage: "alloc",
              lines: [1],
              tone: "info",
              artifactTitle: "Керований масив у CLR",
              artifact: "елемент int, Length = 3\n[0]=10 [1]=20 [2]=30\nбез unsafe немає вказівника, який можна зсунути на чотири байти",
              trace: "Length зберігає сам об’єкт масиву",
            },
            {
              stage: "read",
              lines: [2],
              tone: "ok",
              artifactTitle: "Індекс 1 проходить перевірку",
              artifact: "0 ≤ 1 < 3\nmid = 20\nSpan<int> на цей масив має ту саму перевірку індексу",
              trace: "читання в межах Length",
            },
            {
              stage: "write",
              lines: [3],
              tone: "bad",
              artifactTitle: "CLR відхиляє індекс до запису",
              artifact: "індекс 3 не менший за Length 3\nIndexOutOfRangeException\nкомірки лишилися 10, 20, 30\nу блоці unsafe така перевірка вже не стоїть",
              trace: "керований запис не виходить за Length",
              fail: true,
            },
          ],
        },
        {
          id: "ts",
          label: "TypeScript",
          lang: "ts",
          file: "bounds.ts",
          code: `const cells: number[] = [10, 20, 30];
const mid: number = cells[1];
cells[3] = 99;`,
          stages: [
            { id: "alloc", label: "Створення", sub: "length = 3" },
            { id: "read", label: "Читання", sub: "індекс 1" },
            { id: "write", label: "Запис", sub: "масив росте" },
          ],
          steps: [
            {
              stage: "alloc",
              lines: [1],
              tone: "info",
              artifactTitle: "number[] після tsc лишається масивом",
              artifact: "статичний тип cells: number[]\nlength = 3\ntsc не фіксує довжину в типі\nсусідній об’єкт у купі рушія окремий",
              trace: "TypeScript прийняв оголошення number[]",
            },
            {
              stage: "read",
              lines: [2],
              tone: "ok",
              artifactTitle: "Індекс 1 існує",
              artifact: "cells[1] → 20\nmid: number = 20\nякби індекс був 9, mid отримав би undefined, хоча тип каже number\nчитання не виходить у чужий об’єкт",
              trace: "читання індексу 1, тип number не перевіряється в рантаймі",
            },
            {
              stage: "write",
              lines: [3],
              tone: "warn",
              artifactTitle: "Четвертий слот того самого масиву",
              artifact: "cells[3] = 99 компілюється: number[] не знає length\nпісля tsc length стає 4\nце новий слот того самого масиву\nсусідній об’єкт у купі не перезаписується\nInt32Array цей індекс проігнорував би, теж без запису в сусіда",
              trace: "tsc не зупинив запис, купа лишилася ціла",
            },
          ],
        },
      ],
    };
  }

  function memoryPlayer() {
    return {
      lang: "cs",
      file: "Boxing.cs",
      code: `long count = 42;
string title = "Report";
object boxed = count;
int wrong = (int)boxed;
var items = new List<long>();
items.Add(count);`,
      stages: [
        { id: "local", label: "Значуща локальна", sub: "8 байтів без заголовка" },
        { id: "heap", label: "Рядок у купі", sub: "змінна тримає адресу" },
        { id: "box", label: "Пакування в object", sub: "копія в об’єкті" },
        { id: "unbox", label: "Розпакування", sub: "тип коробки точний" },
        { id: "list", label: "List<long>", sub: "без коробки на рядок" },
      ],
      memory: true,
      steps: [
        {
          stage: "local",
          lines: [1],
          tone: "info",
          artifactTitle: "42 як long",
          artifact: "count = 42\nце значення, не об’єкт: немає заголовка й окремого виділення в купі\nлокальну змінну JIT може тримати й у регістрі",
          trace: "число лежить безпосередньо в кадрі методу",
          mem: { stack: { n: "on" }, heap: {} },
        },
        {
          stage: "heap",
          lines: [2],
          tone: "info",
          artifactTitle: "Рядок у купі",
          artifact: "стек: title → #a17\nкупа #a17: string «Report»\nзмінна і дані розділені: кілька змінних можуть вказувати на той самий рядок",
          trace: "посилальний тип тримає адресу, байти рядка в купі",
          mem: { stack: { n: "ok", title: "on" }, heap: { str: "on" } },
        },
        {
          stage: "box",
          lines: [3],
          tone: "warn",
          artifactTitle: "Пакування в object",
          artifact: "boxed → #b02\nкупа #b02: System.Int64 { 42 }\nлокальна count не змінилася: у коробці копія\nна цей запис припадає виділення об’єкта",
          trace: "приведення long до object пакує значення",
          mem: { stack: { n: "ok", title: "ok", boxed: "on" }, heap: { str: "ok", box: "on" } },
        },
        {
          stage: "unbox",
          lines: [4],
          tone: "bad",
          artifactTitle: "Розпакування перевіряє тип, не діапазон",
          artifact: "(int)boxed вимагає коробку System.Int32\nфактична коробка — System.Int64\n42 вмістилося б у int, але приведення цього не перевіряє\nInvalidCastException",
          trace: "чужий числовий тип не розпаковується",
          fail: true,
          mem: { stack: { n: "ok", title: "ok", boxed: "bad" }, heap: { str: "ok", box: "bad" } },
        },
        {
          stage: "list",
          lines: [5, 6],
          tone: "ok",
          artifactTitle: "Список без коробки на кожен елемент",
          artifact: "List<long> зберігає long[]\nAdd копіює 8 байтів у масив\nмільйон елементів не створює мільйон об’єктів\nцей шлях не проходить через рядок (int)boxed",
          trace: "спеціалізований список тримає значення як є",
          mem: { stack: { n: "ok", title: "ok", boxed: "ok", list: "on" }, heap: { str: "ok", box: "ok", arr: "on" } },
        },
      ],
    };
  }

  function erasurePlayer() {
    return {
      lang: "java",
      file: "Names.java",
      code: `List<String> names = new ArrayList<String>();
names.add("Ada");
String first = names.get(0);

List raw = names;
raw.add(Integer.valueOf(42));
String broken = names.get(1);`,
      stages: [
        { id: "check", label: "javac: перевірка", sub: "T = String" },
        { id: "erase", label: "Затирання", sub: "T → Object" },
        { id: "cast", label: "Вставка checkcast", sub: "на читанні" },
        { id: "jvm", label: "JVM", sub: "сирий ArrayList" },
        { id: "pollute", label: "Сирий тип", sub: "забруднення купи" },
      ],
      steps: [
        {
          stage: "check",
          lines: [1, 2],
          tone: "ok",
          artifactTitle: "Компілятор бачить список рядків",
          artifact: "add очікує String, аргумент «Ada»\nокремий клас ArrayList<String> не породжується\nперевірка живе лише в цьому компіляційному проході",
          trace: "запис рядка прийнято статично",
        },
        {
          stage: "erase",
          lines: [1],
          tone: "info",
          artifactTitle: "Один ArrayList на всі підстановки",
          artifact: "List names = new ArrayList();\nT без межі замінено на Object\nстарий клас java.util.ArrayList лишається сумісним із кодом Java 1.4",
          trace: "параметр типу стерто до Object",
        },
        {
          stage: "cast",
          lines: [3],
          tone: "info",
          artifactTitle: "Обіцянку String перенесено на читання",
          artifact: "get() у байткоді повертає Object\nдалі компілятор сам ставить checkcast java/lang/String\nastore first\nна add такого касту немає",
          trace: "каст з’явився в місці get, не в місці add",
        },
        {
          stage: "jvm",
          lines: [3],
          tone: "ok",
          artifactTitle: "Перший рядок читається",
          artifact: "купа: [0] → «Ada»\ncheckcast бачить клас String\nfirst = «Ada»\nсписок іще узгоджений із оголошенням",
          trace: "читання першого елемента проходить",
        },
        {
          stage: "pollute",
          lines: [5, 6],
          tone: "warn",
          artifactTitle: "Сирий тип дозволяє чужий клас",
          artifact: "List без параметра має add(Object)\nInteger 42 підходить під Object\nкомпілятор дає unchecked warning і не вставляє checkcast\nу масиві поруч із рядком з’являється число",
          trace: "запис Integer проходить повз статичну обіцянку",
        },
        {
          stage: "pollute",
          lines: [7],
          tone: "bad",
          artifactTitle: "Падіння далеко від місця запису",
          artifact: "get(1) повертає Integer 42\ncheckcast до String не проходить\nClassCastException: java.lang.Integer\nстек вказує на читача списку, а не на сирий add",
          trace: "захист спрацьовує на читанні, не на забрудненні",
          fail: true,
        },
      ],
    };
  }

  function bridgePlayer() {
    return {
      lang: "java",
      file: "IntegerNode.java",
      code: `class Node<T> {
    public void setData(T data) { /* зберігає поле */ }
}
class IntegerNode extends Node<Integer> {
    public void setData(Integer data) { super.setData(data); }
}
Node<Integer> node = new IntegerNode();
node.setData(Integer.valueOf(42));`,
      stages: [
        { id: "src", label: "Вихідна ієрархія", sub: "override Integer" },
        { id: "erase", label: "Сигнатури після erasure", sub: "вони розходяться" },
        { id: "bridge", label: "Bridge-метод", sub: "synthetic setData(Object)" },
        { id: "call", label: "Віртуальний виклик", sub: "через тип Node" },
        { id: "bad", label: "Чужий аргумент", sub: "каст у мості" },
      ],
      steps: [
        {
          stage: "src",
          lines: [1, 5],
          tone: "info",
          artifactTitle: "Як це написано в репозиторії",
          artifact: "Node.setData(T) зберігає значення вузла\nIntegerNode.setData(Integer) перевизначає його для цілого вузла\nдо затирання сигнатури ще збігаються, тож override законний",
          trace: "до затирання перевизначення збігається",
        },
        {
          stage: "erase",
          lines: [2, 5],
          tone: "warn",
          artifactTitle: "Після затирання сигнатури розходяться",
          artifact: "Node.setData(Object)\nIntegerNode.setData(Integer)\nдля JVM другий метод уже не override першого\nвиклик через посилання Node пішов би в батьківську реалізацію",
          trace: "поліморфізм за стертою сигнатурою зламався б",
        },
        {
          stage: "bridge",
          lines: [5],
          tone: "info",
          artifactTitle: "Синтетичний метод у класі",
          artifact: "synthetic IntegerNode.setData(Object data) {\n    setData((Integer) data);\n}\nміст позначено ACC_BRIDGE | ACC_SYNTHETIC\nсаме він займає слот override у таблиці методів",
          trace: "компілятор дописує міст зі стертою сигнатурою",
        },
        {
          stage: "call",
          lines: [7, 8],
          tone: "ok",
          artifactTitle: "Ціле 42 доходить до підкласу",
          artifact: "статичний тип виклику — Node, шукаємо setData(Object)\nтаблиця IntegerNode веде в міст\ncheckcast Integer проходить\nміст делегує в setData(Integer), написаний у репозиторії",
          trace: "віртуальний виклик відновлено мостом",
        },
        {
          stage: "bad",
          lines: [8],
          tone: "bad",
          artifactTitle: "Рядок у цілому вузлі",
          artifact: "сире посилання могло передати String\nміст виконує (Integer) data\nClassCastException\nу стеку видно IntegerNode.setData(Object), хоча такого методу у вихіднику немає",
          trace: "перевірка типу стоїть у згенерованому мості",
          fail: true,
        },
      ],
    };
  }

  function reifiedPlayer() {
    return {
      lang: "cs",
      file: "Reify.cs",
      code: `var counts = new List<long>();
var totals = new List<decimal>();
var names = new List<string>();
var people = new List<Person>();

void Inspect<T>(T value) {
    Console.WriteLine(typeof(T));
    if (value is string text) Console.WriteLine(text.Length);
}`,
      stages: [
        { id: "ask", label: "Запит інстанціації", sub: "List<T> + аргумент" },
        { id: "value", label: "Value type", sub: "окремий код і layout" },
        { id: "ref", label: "Reference type", sub: "спільний машинний код" },
        { id: "meta", label: "Метадані типу", sub: "T доступний у рантаймі" },
      ],
      steps: [
        {
          stage: "ask",
          lines: [1],
          tone: "info",
          artifactTitle: "Перший запит List<long>",
          artifact: "завантажувач шукає List<long> у кеші інстанціацій\nготової версії ще немає\nlong — значущий тип, спільний код посилань йому не підходить",
          trace: "для T = long потрібна власна спеціалізація",
        },
        {
          stage: "value",
          lines: [1, 2],
          tone: "ok",
          artifactTitle: "long і decimal не мають спільного коду",
          artifact: "List<long>: масив 8-байтових значень, без boxing\nList<decimal>: інша розкладка, decimal — теж struct\nнавіть однакова ширина двох value types не гарантує спільний код",
          trace: "кожен значущий аргумент отримує власну версію",
        },
        {
          stage: "ref",
          lines: [3, 4],
          tone: "info",
          artifactTitle: "Person має спільний код із рядком",
          artifact: "List<string> створює версію, де T замінено посиланням\nList<Person> бере той самий машинний код\nширина посилання однакова, розкладка полів списку збігається\nтип об’єкта при цьому різний: присвоїти один список іншому не можна",
          trace: "нової копії коду для Person немає",
        },
        {
          stage: "meta",
          lines: [6, 8],
          tone: "ok",
          artifactTitle: "Аргумент типу відомий під час виконання",
          artifact: "Inspect(«Ada») друкує System.String\nгілку value is string виконує CLR, компілятор її не викидає\nу Java ні typeof(T), ні instanceof T після затирання не написати",
          trace: "T у C# існує як значення метаданих, не лише як перевірка javac",
        },
      ],
    };
  }

  function structuralPlayer() {
    return {
      lang: "ts",
      file: "shape.ts",
      scenarios: [
        {
          id: "fit",
          label: "Форма підходить",
          code: `interface Named { name: string }
class Person {
    name = "Ada";
    age = 36;
}
const who: Named = new Person();`,
          stages: [
            { id: "need", label: "Вимога Named", sub: "поле name" },
            { id: "have", label: "Форма Person", sub: "name і age" },
            { id: "ok", label: "Сумісно", sub: "implements не потрібен" },
          ],
          steps: [
            {
              stage: "need",
              lines: [1],
              tone: "info",
              artifactTitle: "Що вимагає цільовий тип",
              artifact: "name має бути string\nімені класу в вимозі немає",
              trace: "порівнюють члени, не оголошення implements",
            },
            {
              stage: "have",
              lines: [2, 5],
              tone: "info",
              artifactTitle: "Клас має потрібну форму",
              artifact: "Person.name: string — є\nage для Named зайвий і не заважає\nрядка implements Named у класі немає",
              trace: "зайве поле age не ламає сумісність",
            },
            {
              stage: "ok",
              lines: [7],
              tone: "ok",
              artifactTitle: "Named приймає Person",
              artifact: "присвоєння дозволено\nу Java чи C# Person не став би Named без оголошеного зв’язку\nдалі who.age уже не видно: статичний тип його не має",
              trace: "структурна сумісність вирішена до запуску",
            },
          ],
        },
        {
          id: "excess",
          label: "Друкарська помилка",
          code: `interface Named { name: string }
const fresh: Named = { nmae: "Ada" };
const box = { nmae: "Ada" };
const later: Named = box;`,
          stages: [
            { id: "lit", label: "Свіжий літерал", sub: "excess property check" },
            { id: "var", label: "Проміжна змінна", sub: "лише структура" },
          ],
          steps: [
            {
              stage: "lit",
              lines: [2],
              tone: "bad",
              artifactTitle: "Літерал ловить nmae",
              artifact: "Object literal may only specify known properties\nnmae немає в Named, очікували name\nлітерал із цією друкарською помилкою не компілюється\nбез цього правила поле name лишилося б відсутнім",
              trace: "свіжий літерал перевіряють суворіше за структуру",
              fail: true,
            },
            {
              stage: "var",
              lines: [3, 4],
              tone: "warn",
              artifactTitle: "Та сама друкарська помилка через змінну",
              artifact: "box має поле nmae, поля name немає\nnmae для структурної перевірки зайвий\nвідсутність name уже не помилка, якщо значення не літерал\nзмінна later компілюється, а під час виконання later.name буде undefined",
              trace: "проміжна змінна обходить excess property check",
            },
          ],
        },
      ],
    };
  }

  function tsErasePlayer() {
    return {
      lang: "ts",
      file: "named.ts",
      code: `interface Named { name: string }
function greet(who: Named): string {
    return who.name.toLowerCase();
}
const value = { name: "Ada" } as Named;
greet(value);`,
      stages: [
        { id: "tsc", label: "tsc", sub: "перевірка форми" },
        { id: "strip", label: "Стирання", sub: "інтерфейс і as зникають" },
        { id: "js", label: "JavaScript", sub: "жодного checkcast" },
      ],
      steps: [
        {
          stage: "tsc",
          lines: [1, 5],
          tone: "ok",
          artifactTitle: "tsc приймає форму і мовчить на as",
          artifact: "літерал уже має name\nas Named не читає поля ще раз\nвін лише закріплює тип виразу для рядків нижче\nякби name не було, as усе одно змусив би компілятор замовкнути",
          trace: "приведення не додає другої перевірки",
        },
        {
          stage: "strip",
          lines: [1, 5],
          tone: "info",
          artifactTitle: "Що залишає транслятор",
          artifact: "зникли interface Named і анотація : Named\nзник as Named\nлишилося тіло: who.name.toLowerCase()\nжодної інструкції перевірки типу у виводі немає",
          trace: "із файлу прибрано всю систему типів",
        },
        {
          stage: "js",
          lines: [3, 6],
          tone: "warn",
          artifactTitle: "Браузер бачить звичайний виклик",
          artifact: "function greet(who) {\n  return who.name.toLowerCase();\n}\ngreet({ name: \"Ada\" }) → \"ada\"\nякщо name відсутнє, падіння станеться тут, без касту й без імені Named",
          trace: "після tsc захищає лише сам JavaScript",
        },
      ],
    };
  }

  function variancePlayer() {
    return {
      lang: "cs",
      file: "Variance.cs",
      scenarios: [
        {
          id: "cov",
          label: "Коваріантність",
          code: `IEnumerable<Dog> dogs = new List<Dog>();
IEnumerable<Animal> animals = dogs;
Animal first = animals.First();`,
          stages: [
            { id: "prod", label: "Джерело out T", sub: "лише читання" },
            { id: "assign", label: "Присвоєння", sub: "Dog → Animal" },
            { id: "read", label: "Читання", sub: "результат Animal" },
          ],
          steps: [
            {
              stage: "prod",
              lines: [1],
              tone: "info",
              artifactTitle: "Джерело не пише в список",
              artifact: "IEnumerable<out T> не має Add\nкожний Dog є Animal, тож читач тварин не дістане чужий клас\nнапрям: конкретніший елемент показують як загальніший",
              trace: "джерело коваріантне, бо з нього лише читають",
            },
            {
              stage: "assign",
              lines: [2],
              tone: "ok",
              artifactTitle: "Список собак стає джерелом тварин",
              artifact: "IEnumerable<Dog> → IEnumerable<Animal> дозволено\nу Java List<Dog> не піде в List<Animal>\nале піде в List<? extends Animal>",
              trace: "присвоєння джерела компілюється",
            },
            {
              stage: "read",
              lines: [3],
              tone: "ok",
              artifactTitle: "Перша тварина зі списку",
              artifact: "First() статично має тип Animal\nфактичний об’єкт лишається Dog\nчерез animals до списку нічого дописати не можна",
              trace: "читання не розширює набір операцій",
            },
          ],
        },
        {
          id: "contra",
          label: "Контраваріантність",
          code: `Action<Animal> feed = animal => animal.Eat();
Action<Dog> feedDog = feed;
feedDog(new Dog());`,
          stages: [
            { id: "cons", label: "Споживач in T", sub: "лише приймає аргумент" },
            { id: "assign", label: "Присвоєння", sub: "Animal → Dog" },
            { id: "call", label: "Виклик", sub: "усередину йде Dog" },
          ],
          steps: [
            {
              stage: "cons",
              lines: [1],
              tone: "info",
              artifactTitle: "Споживач готовий до будь-якої тварини",
              artifact: "Action<in T> лише приймає аргумент\nфункція, яка вміє викликати Eat для Animal, зуміє це і для Dog\nце зворотний напрям відносно значення, яке повертають",
              trace: "споживач контраваріантний",
            },
            {
              stage: "assign",
              lines: [2],
              tone: "ok",
              artifactTitle: "Загальний споживач стоїть на собаках",
              artifact: "Action<Animal> → Action<Dog> дозволено\nу Java Consumer<? super Dog> прийме Consumer<Animal>\nтіло як і раніше бачить аргумент як Animal",
              trace: "загальніший параметр стоїть у конкретнішій змінній",
            },
            {
              stage: "call",
              lines: [3],
              tone: "ok",
              artifactTitle: "У тіло входить собака",
              artifact: "feedDog передає Dog\nоригінальне тіло бачить його як Animal\nEat() для собаки визначено в тварині\nвужчий аргумент безпечний для ширшого параметра",
              trace: "підстановка аргументу вужча за очікування тіла",
            },
          ],
        },
        {
          id: "inv",
          label: "Інваріантність",
          code: `List<Dog> dogs = new List<Dog>();
List<Animal> animals = dogs;
animals.Add(new Cat());`,
          stages: [
            { id: "both", label: "І читання, і запис", sub: "List<T>" },
            { id: "reject", label: "Відмова компілятора", sub: "точний збіг T" },
          ],
          steps: [
            {
              stage: "both",
              lines: [1, 3],
              tone: "warn",
              artifactTitle: "Кішка в списку собак",
              artifact: "якби обидва посилання вели в один список,\nAdd(Cat) дописав би кішку в List<Dog>\nнаступне читання Dog отримало б чужий клас",
              trace: "список і читають, і пишуть, тому він інваріантний",
            },
            {
              stage: "reject",
              lines: [2],
              tone: "bad",
              artifactTitle: "Присвоєння відхилено до запуску",
              artifact: "cannot convert List<Dog> to List<Animal>\nрядок Add навіть не досягає виконання\nтой самий захист у Java для List<T>",
              trace: "статична перевірка закриває дірку масивів",
              fail: true,
            },
          ],
        },
        {
          id: "js",
          label: "Масив у JS",
          lang: "ts",
          file: "arrays.ts",
          code: `const dogs: Dog[] = [new Dog()];
const animals: Animal[] = dogs;
animals.push(new Cat());
const dog = dogs[1];`,
          stages: [
            { id: "assign", label: "Присвоєння масивів", sub: "дозволено, хоча запис небезпечний" },
            { id: "write", label: "Запис кішки", sub: "рантайм не перевіряє" },
            { id: "read", label: "Читання як Dog", sub: "тип уже розійшовся з купою" },
          ],
          steps: [
            {
              stage: "assign",
              lines: [2],
              tone: "warn",
              artifactTitle: "Масиви TypeScript навмисно діряві",
              artifact: "змінні масиви коваріантні, щоб не ламати поширені шаблони JavaScript\nкомпілятор приймає Dog[] як Animal[]\nstrictFunctionTypes це не виправляє: прапорець стосується параметрів функцій, не масивів",
              trace: "статичний дозвіл не означає безпечний запис",
            },
            {
              stage: "write",
              lines: [3],
              tone: "bad",
              artifactTitle: "Кішка опиняється в масиві собак",
              artifact: "dogs[0] = Dog\ndogs[1] = Cat\nArrayStoreException немає: масив JavaScript не зберігає тип комірки\nзапис не відкочується",
              trace: "чужий клас записано без винятка",
              fail: true,
            },
            {
              stage: "read",
              lines: [4],
              tone: "bad",
              artifactTitle: "Читач довіряє типу, якого вже немає",
              artifact: "статичний тип dog — Dog\nфактичне значення — Cat\nвиклик методу, який є лише в собаки, дасть TypeError\nна відміну від Java, дірку не закрили перевіркою запису",
              trace: "система типів і купа розійшлися",
              fail: true,
            },
          ],
        },
      ],
    };
  }

  function arrayPlayer() {
    return {
      lang: "java",
      file: "Arrays.java",
      scenarios: [
        {
          id: "java",
          label: "Java",
          code: `String[] names = { "Ada", "Ida" };
Object[] slot = names;
slot[0] = Integer.valueOf(1);`,
          stages: [
            { id: "alloc", label: "Створення масиву", sub: "компонент String" },
            { id: "alias", label: "Друге ім’я", sub: "коваріантне присвоєння" },
            { id: "static", label: "Статичний запис", sub: "комірку бачать як Object" },
            { id: "store", label: "aastore", sub: "перевірка компонента" },
          ],
          steps: [
            {
              stage: "alloc",
              lines: [1],
              tone: "info",
              artifactTitle: "Масив рядків у купі",
              artifact: "componentType = String\n[0] Ada\n[1] Ida\nтип компонента записано в заголовок масиву, не в змінну",
              trace: "масив пам’ятає, що елемент — рядок",
              mem: {
                stack: { strings: "on" },
                heap: { a0: "on", a1: "ok" },
              },
            },
            {
              stage: "alias",
              lines: [2],
              tone: "warn",
              artifactTitle: "Друге ім’я на той самий масив",
              artifact: "names → #arr\nslot → #arr\nкомпілятор дозволяє: String[] є підтипом Object[]\nдругого масиву не створюють",
              trace: "коваріантне присвоєння відкриває аліас",
              mem: {
                stack: { strings: "ok", objects: "on" },
                heap: { a0: "ok", a1: "ok" },
              },
            },
            {
              stage: "static",
              lines: [3],
              tone: "warn",
              artifactTitle: "Число проходить статичну перевірку",
              artifact: "статичний тип slot[0] — Object\nInteger є Object, тож javac мовчить\nкомпонент String у цю перевірку не входить",
              trace: "компілятор дивиться на тип аліаса, не на заголовок масиву",
            },
            {
              stage: "store",
              lines: [3],
              tone: "bad",
              artifactTitle: "Запис числа відхилено",
              artifact: "байткод aastore звіряє Integer із componentType String\nArrayStoreException: java.lang.Integer\nкомірки лишилися Ada і Ida\nвиняток зриває запис, елементи масиву цілі",
              trace: "дані масиву цілі, виконання рядка ні",
              fail: true,
              mem: {
                stack: { strings: "ok", objects: "bad" },
                heap: { a0: "ok", a1: "ok" },
              },
            },
          ],
        },
        {
          id: "cs",
          label: "C#",
          lang: "cs",
          file: "Arrays.cs",
          code: `string[] names = { "Ada", "Ida" };
object[] slot = names;
slot[0] = 1;`,
          stages: [
            { id: "alloc", label: "Масив string[]", sub: "тип елемента в CLR" },
            { id: "alias", label: "Аліас object[]", sub: "коваріантність" },
            { id: "store", label: "stelem", sub: "перевірка елемента" },
          ],
          steps: [
            {
              stage: "alloc",
              lines: [1],
              tone: "info",
              artifactTitle: "Той самий масив у CLR",
              artifact: "element type = System.String\n[0] Ada, [1] Ida\nтип елемента зберігає об’єкт масиву",
              trace: "масив знає тип елемента",
            },
            {
              stage: "alias",
              lines: [2],
              tone: "warn",
              artifactTitle: "Аліас бачить object[]",
              artifact: "string[] → object[] дозволено з тієї самої історичної причини\nnames і slot вказують на один об’єкт\nстатичний тип аліаса ширший за компонент",
              trace: "присвоєння компілюється",
            },
            {
              stage: "store",
              lines: [3],
              tone: "bad",
              artifactTitle: "CLR відхиляє число в рядковій комірці",
              artifact: "запис 1 у масив string\nArrayTypeMismatchException\nу Java на цьому місці був би ArrayStoreException\nрядки в комірках не замінюються",
              trace: "рантайм відхиляє запис до зміни комірки",
              fail: true,
            },
          ],
        },
      ],
    };
  }

  function listPlayer() {
    return {
      lang: "java",
      file: "Lists.java",
      code: `List<String> names = new ArrayList<>();
names.add("Ada");
List<Object> slot = names;
slot.add(Integer.valueOf(1));`,
      stages: [
        { id: "ok", label: "List<String>", sub: "запис рядка законний" },
        { id: "cmp", label: "Порівняння типів", sub: "інваріантність T" },
        { id: "stop", label: "Зупинка", sub: "байткод цього рядка немає" },
      ],
      steps: [
        {
          stage: "ok",
          lines: [1, 2],
          tone: "ok",
          artifactTitle: "Рядок Ada в інваріантному списку",
          artifact: "ArrayList з параметром String\nadd(\"Ada\") проходить перевірку аргументу\nдо цього рядка претензій немає",
          trace: "список рядків створено законно",
        },
        {
          stage: "cmp",
          lines: [3],
          tone: "bad",
          artifactTitle: "Присвоєння в List<Object> відхилено",
          artifact: "List<String> не є підтипом List<Object>\njavac: incompatible types: List<String> cannot be converted to List<Object>\nковаріантність масивів на List<T> не поширюється",
          trace: "присвоєння відхилено на компіляції",
          fail: true,
        },
        {
          stage: "stop",
          lines: [4],
          tone: "ok",
          artifactTitle: "Число не доходить до виконання",
          artifact: "рядок add(Integer) не існує як байткод цієї програми\nClassCastException тут не виникає: падати нічому\nчитати рядки як об’єкти можна через List<? extends String>\nписати в них з такого посилання не можна",
          trace: "захист спрацював раніше за рантайм",
        },
      ],
    };
  }

  function unsafeFetchPlayer() {
    return {
      lang: "ts",
      file: "fetch.ts",
      code: `async function readProfile(req: Request) {
    const payload = await req.json();
    return payload as { displayName: string; internalId: string };
}
const profile = await readProfile(request);
show(profile.displayName.toLowerCase());`,
      stages: [
        { id: "http", label: "Тіло відповіді", sub: "байти сервера" },
        { id: "json", label: "JSON.parse", sub: "тип any" },
        { id: "as", label: "Оператор as", sub: "без читання полів" },
        { id: "use", label: "Використання", sub: "displayName" },
      ],
      steps: [
        {
          stage: "http",
          lines: [2],
          tone: "info",
          artifactTitle: "Сервер змінив імена полів",
          artifact: "HTTP 200\nтіло: {\"id\":\"u19\",\"name\":\"Ada\"}\nу репозиторії досі чекають displayName і internalId",
          trace: "запит успішний, контракт уже інший",
        },
        {
          stage: "json",
          lines: [2],
          tone: "warn",
          artifactTitle: "Після розбору лишається any",
          artifact: "значення: { id: \"u19\", name: \"Ada\" }\nстатичний тип payload: any\nany дозволяє читати будь-яке поле без помилки компіляції",
          trace: "розбір JSON не знає про тип у файлі",
        },
        {
          stage: "as",
          lines: [3],
          tone: "warn",
          artifactTitle: "as лише перейменовує тип у файлі",
          artifact: "тип виразу стає { displayName, internalId }\nполя в об’єкті не з’являються і не перевіряються\nid та name лишаються, displayName немає",
          trace: "компілятор приймає бажану форму за фактичну",
        },
        {
          stage: "use",
          lines: [6],
          tone: "bad",
          artifactTitle: "Читання відсутнього рядка",
          artifact: "profile.displayName → undefined\nundefined.toLowerCase()\nTypeError: Cannot read properties of undefined\nвираз value || \"\" на цьому місці приховав би відсутність порожнім рядком",
          trace: "тип у файлі не зупинив використання",
          fail: true,
        },
      ],
    };
  }

  function zodPlayer() {
    return {
      lang: "ts",
      file: "schema.ts",
      scenarios: [
        {
          id: "bad",
          label: "Контракт зламано",
          code: `const UserProfile = z.object({
    displayName: z.string().min(1),
    internalId: z.string().min(1),
});
const raw: unknown = await req.json();
const parsed = UserProfile.safeParse(raw);
if (!parsed.success) throw new Error("контракт профілю");
return parsed.data;`,
          stages: [
            { id: "raw", label: "unknown / any", sub: "сирий JSON" },
            { id: "schema", label: "safeParse", sub: "обидва поля" },
            { id: "gate", label: "Брама", sub: "success: false" },
          ],
          steps: [
            {
              stage: "raw",
              lines: [5],
              tone: "info",
              artifactTitle: "Сире тіло ще не профіль",
              artifact: "{ id: \"u19\", name: \"Ada\" }\nтип raw: unknown, полів у нього немає\nдо safeParse displayName прочитати не можна",
              trace: "значення ще не звужене схемою",
            },
            {
              stage: "schema",
              lines: [1, 6],
              tone: "warn",
              artifactTitle: "Звіт по двох полях контракту",
              artifact: "displayName: ключа немає, name схема не приймає замість нього\ninternalId: ключа немає\nsuccess = false",
              trace: "валідатор звірив контракт, а не вгадав сусідні імена",
            },
            {
              stage: "gate",
              lines: [7],
              tone: "bad",
              artifactTitle: "Використання не починається",
              artifact: "parsed.success = false\nthrow Error(\"контракт профілю\")\nshow не викликається\nundefined не доходить до toLowerCase",
              trace: "відмова стається до використання",
              fail: true,
            },
          ],
        },
        {
          id: "good",
          label: "Контракт збігся",
          code: `const raw: unknown = await req.json();
const parsed = UserProfile.safeParse(raw);
if (!parsed.success) throw new Error("контракт профілю");
show(parsed.data.displayName);`,
          stages: [
            { id: "raw", label: "Сирий об’єкт", sub: "обидва поля на місці" },
            { id: "schema", label: "safeParse", sub: "два рядки" },
            { id: "use", label: "parsed.data", sub: "тип звужено" },
          ],
          steps: [
            {
              stage: "raw",
              lines: [1],
              tone: "info",
              artifactTitle: "Тіло збігається з контрактом",
              artifact: "{ displayName: \"Ada\", internalId: \"u19\" }\nтип іще unknown: збіг імен сам по собі нічого не доводить",
              trace: "JSON розібрано, схему ще не пройдено",
            },
            {
              stage: "schema",
              lines: [2],
              tone: "ok",
              artifactTitle: "Обидві перевірки пройдені",
              artifact: "displayName — непорожній рядок «Ada»\ninternalId — непорожній рядок «u19»\nsuccess = true",
              trace: "схема підтвердила об’єкт",
            },
            {
              stage: "use",
              lines: [4],
              tone: "ok",
              artifactTitle: "Далі йде перевірене значення",
              artifact: "parsed.data.displayName: string = «Ada»\nshow(\"Ada\")\nтип даних виведено з успіху схеми, не з оператора as",
              trace: "використання стоїть після звуження",
            },
          ],
        },
      ],
    };
  }

  function nrePlayer() {
    return {
      lang: "cs",
      file: "ClientCity.cs",
      scenarios: [
        {
          id: "client",
          label: "client == null",
          code: `public void PrintCity(Client client) {
    Console.WriteLine(client.Address.City);
}`,
          stages: [
            { id: "arg", label: "Аргумент", sub: "посилання null" },
            { id: "load", label: "Розіменування", sub: "ldfld Address" },
            { id: "stop", label: "Виняток", sub: "до City не дійшли" },
          ],
          steps: [
            {
              stage: "arg",
              lines: [1],
              tone: "warn",
              artifactTitle: "Кадр PrintCity",
              artifact: "client = null\nісторичний тип Client цього не показує: null входить у кожне посилання\nкомпілятор без nullable reference types рядок приймає",
              trace: "порожній клієнт входить у метод",
            },
            {
              stage: "load",
              lines: [2],
              tone: "bad",
              artifactTitle: "Падіння на самому клієнті",
              artifact: "читання поля Address у приймача client\nприймач null\nNullReferenceException\nдо міста виконання не доходить",
              trace: "ланцюжок обривається на першій ланці",
              fail: true,
            },
            {
              stage: "stop",
              lines: [2],
              tone: "bad",
              artifactTitle: "City не обчислювали",
              artifact: "вираз Address.City не починається\nу журналі немає міста\nаналог у Java: NullPointerException",
              trace: "падіння під навантаженням виглядає раптовим",
              fail: true,
            },
          ],
        },
        {
          id: "address",
          label: "Address == null",
          code: `public void PrintCity(Client client) {
    Console.WriteLine(client.Address.City);
}`,
          stages: [
            { id: "client", label: "client живий", sub: "об’єкт у купі" },
            { id: "addr", label: "Address", sub: "поле null" },
            { id: "city", label: "City", sub: "друге розіменування" },
          ],
          steps: [
            {
              stage: "client",
              lines: [2],
              tone: "ok",
              artifactTitle: "Клієнт існує, адреси немає",
              artifact: "client → #c1\n#c1.Address = null\nсам об’єкт клієнта існує",
              trace: "посилання на клієнта живе",
            },
            {
              stage: "addr",
              lines: [2],
              tone: "info",
              artifactTitle: "Адреси немає, винятка ще немає",
              artifact: "читання Address повертає null\nсаме читання поля вдалося: приймач #c1 існує\nвідсутня адреса — окремий стан, не зіпсований клієнт",
              trace: "отримали порожню адресу",
            },
            {
              stage: "city",
              lines: [2],
              tone: "bad",
              artifactTitle: "Місто читають у порожньої адреси",
              artifact: "приймач для .City дорівнює null\nNullReferenceException на тому самому рядку, що й у попередньому сценарії\nу журналі не відрізнити «немає клієнта» від «немає адреси»",
              trace: "падає друга крапка того самого виразу",
              fail: true,
            },
          ],
        },
      ],
    };
  }

  function nrtPlayer() {
    return {
      lang: "cs",
      file: "NullableCity.cs",
      code: `#nullable enable
public void PrintCity(Client? client) {
    if (client?.Address is not null) {
        Console.WriteLine(client.Address.City);
    }
    if (client is { Address: { City: string cityName } }) {
        Console.WriteLine(cityName);
    }
}`,
      stages: [
        { id: "ann", label: "Анотація ?", sub: "null входить у тип" },
        { id: "nav", label: "?.", sub: "коротке замикання" },
        { id: "pat", label: "Зразок", sub: "зв’язування cityName" },
        { id: "out", label: "Вивід", sub: "лише після збігу" },
      ],
      steps: [
        {
          stage: "ann",
          lines: [1, 2],
          tone: "info",
          artifactTitle: "Клієнт і адреса можуть бути відсутні",
          artifact: "Client? означає Client або null\nAddress теж позначено як Address?\nбез перевірки компілятор не дасть прочитати City",
          trace: "відсутність адреси входить у тип",
        },
        {
          stage: "nav",
          lines: [3],
          tone: "ok",
          artifactTitle: "Порожній ланцюжок не кидає виняток",
          artifact: "client == null → увесь вираз client?.Address дорівнює null, поле не читають\nAddress == null → умова is not null хибна\nтіло виводу не виконується",
          trace: "порожній ланцюжок дає null, не виняток",
        },
        {
          stage: "pat",
          lines: [6],
          tone: "info",
          artifactTitle: "Шаблон вимагає весь ланцюжок",
          artifact: "client не null\nAddress не null\nCity має тип string\nлише тоді ім’я cityName зв’язується з містом\nякщо адреси немає, шаблон не збігається",
          trace: "одна умова замість кількох порівнянь з null",
        },
        {
          stage: "out",
          lines: [4, 7],
          tone: "ok",
          artifactTitle: "Повний ланцюжок проходить обидві перевірки",
          artifact: "Address.City = «Львів»\nпісля успішного ?. компілятор звужує client і Address\nшаблон зв’язує cityName = «Львів»\nWriteLine друкує місто лише на цій гілці",
          trace: "вивід з’являється, коли обидві ланки живі",
        },
      ],
    };
  }

  function downcastPlayer() {
    return {
      lang: "java",
      file: "Downcast.java",
      scenarios: [
        {
          id: "bad",
          label: "Хибне приведення",
          code: `Animal animal = registry.find("dog");
Bird bird = (Bird) animal;
bird.fly();`,
          stages: [
            { id: "wide", label: "Базовий тип", sub: "статично Animal" },
            { id: "cast", label: "checkcast", sub: "фактично Dog" },
            { id: "call", label: "fly", sub: "не викликається" },
          ],
          steps: [
            {
              stage: "wide",
              lines: [1],
              tone: "info",
              artifactTitle: "Реєстр повернув собаку",
              artifact: "animal → #g1 класу Dog\nпредок — Animal\nстатичний тип після find цього не пам’ятає: для ключа bird там був би інший клас",
              trace: "компілятор бачить лише базовий тип",
            },
            {
              stage: "cast",
              lines: [2],
              tone: "bad",
              artifactTitle: "Приведення до Bird",
              artifact: "checkcast Bird\nDog не є підтипом Bird\nClassCastException\nу C# на цьому місці був би InvalidCastException",
              trace: "явний каст не обходить перевірку JVM",
              fail: true,
            },
            {
              stage: "call",
              lines: [3],
              tone: "ok",
              artifactTitle: "fly не викликається",
              artifact: "fly() не виконується\nбезпечна форма: if (animal instanceof Bird bird) bird.fly();\nдля собаки ця гілка просто не входить",
              trace: "метод підкласу не викликають до підтвердження класу",
            },
          ],
        },
        {
          id: "good",
          label: "Перевірка перед кастом",
          code: `Animal animal = registry.find("bird");
if (animal instanceof Bird bird) {
    bird.fly();
}`,
          stages: [
            { id: "test", label: "instanceof", sub: "порівняння класу" },
            { id: "bind", label: "Звуження", sub: "змінна bird" },
            { id: "call", label: "fly", sub: "приймач точно Bird" },
          ],
          steps: [
            {
              stage: "test",
              lines: [1, 2],
              tone: "info",
              artifactTitle: "Ключ bird справді віддав Bird",
              artifact: "animal → #g4 класу Bird\ninstanceof Bird → true\nдля ключа dog та сама умова була б false, і тіло пропустили б",
              trace: "клас звіряє JVM, не дужки приведення",
            },
            {
              stage: "bind",
              lines: [2],
              tone: "ok",
              artifactTitle: "Ім’я bird уже вузького типу",
              artifact: "bird має статичний тип Bird\nпосилання те саме #g4\nокремого (Bird) у тілі вже не пишуть",
              trace: "шаблон Java 16 звужує тип після перевірки",
            },
            {
              stage: "call",
              lines: [3],
              tone: "ok",
              artifactTitle: "Метод підкласу",
              artifact: "invokevirtual Bird.fly()\nприймач сумісний із методом\nвиклик іде без ClassCastException",
              trace: "метод викликано після підтвердження класу",
            },
          ],
        },
      ],
    };
  }

  const CELL_LABELS = {
  "stack-n": "count = 42",
  "stack-title": "title → рядок",
  "stack-boxed": "boxed → object",
  "stack-list": "items → List<long>",
  "stack-strings": "names → #arr",
  "stack-objects": "slot → #arr",
  "heap-str": "«Report»",
  "heap-box": "Int64 { 42 }",
  "heap-arr": "long[] { 42 }",
  "heap-a0": "[0] Ada",
  "heap-a1": "[1] Ida",
};

function cellsFor(scenario) {
  const stack = [];
  const heap = [];
  scenario.steps.forEach((step) => {
    if (!step.mem) return;
    Object.keys(step.mem.stack || {}).forEach((key) => {
      const id = `stack-${key}`;
      if (!stack.includes(id)) stack.push(id);
    });
    Object.keys(step.mem.heap || {}).forEach((key) => {
      const id = `heap-${key}`;
      if (!heap.includes(id)) heap.push(id);
    });
  });
  return { stack, heap };
}

function mergedMem(steps, cursor) {
  if (cursor < 0) return null;
  const stack = {};
  const heap = {};
  for (let position = 0; position <= cursor; position += 1) {
    const mem = steps[position].mem;
    if (!mem) continue;
    Object.assign(stack, mem.stack || {});
    Object.assign(heap, mem.heap || {});
  }
  if (!Object.keys(stack).length && !Object.keys(heap).length) return null;
  return { stack, heap };
}

function esc(value) {
    return String(value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");
  }

  function paint(raw, lang) {
    const words = KEYWORDS[lang] || KEYWORDS.java;
    let out = "";
    let i = 0;
    while (i < raw.length) {
      if (raw[i] === "/" && raw[i + 1] === "/") {
        out += `<span class="cm">${esc(raw.slice(i))}</span>`;
        break;
      }
      const quote = raw[i];
      if (quote === '"' || quote === "'" || quote === "`") {
        let j = i + 1;
        while (j < raw.length && raw[j] !== quote) {
          if (raw[j] === "\\") j += 1;
          j += 1;
        }
        j = Math.min(raw.length, j + 1);
        out += `<span class="st">${esc(raw.slice(i, j))}</span>`;
        i = j;
        continue;
      }
      if (/[A-Za-z_]/.test(raw[i])) {
        let j = i + 1;
        while (j < raw.length && /[A-Za-z0-9_]/.test(raw[j])) j += 1;
        const word = raw.slice(i, j);
        if (words.has(word)) out += `<span class="kw">${esc(word)}</span>`;
        else if (/^[A-Z]/.test(word)) out += `<span class="tp">${esc(word)}</span>`;
        else out += esc(word);
        i = j;
        continue;
      }
      if (/[0-9]/.test(raw[i])) {
        let j = i + 1;
        while (j < raw.length && /[0-9]/.test(raw[j])) j += 1;
        out += `<span class="nu">${esc(raw.slice(i, j))}</span>`;
        i = j;
        continue;
      }
      out += esc(raw[i]);
      i += 1;
    }
    return out || " ";
  }

  function highlight(code, lang) {
    return code.replace(/\n$/, "").split("\n").map((line, index) => {
      return `<span class="ln" data-ln="${index + 1}">${paint(line, lang)}</span>`;
    }).join("");
  }

  let index = 0;
  let timer = null;

  const app = document.getElementById("app");

  function groupOf(slide, position) {
    if (position === 0) return slide.group;
    if (slides[position - 1].group !== slide.group) return slide.group;
    return "";
  }

  function shell() {
    const nav = slides.map((slide, position) => {
      const group = groupOf(slide, position);
      const label = group ? `<div class="nav-group">${esc(group)}</div>` : "";
      const current = position === index ? ' aria-current="true"' : "";
      return `${label}<button class="nav-item" data-go="${position}"${current}><span class="nav-num">${String(position + 1).padStart(2, "0")}</span><span>${esc(slide.title)}</span></button>`;
    }).join("");

    return `
      <aside class="nav" id="nav">
        <div class="brand">
          <p class="brand-kicker">Лекція 2</p>
          <h1>Безпека типів</h1>
          <a class="course-back" href="index.html">До курсу</a>
        </div>
        <div class="nav-scroll">${nav}</div>
      </aside>
      <main class="deck">
        <section class="slide" id="slide">${body(slides[index])}</section>
        <footer class="deck-bar">
          <button class="menu-btn" data-menu type="button">Зміст</button>
          <button type="button" data-prev>Назад</button>
          <div class="progress" aria-hidden="true"><span style="width:${((index + 1) / slides.length) * 100}%"></span></div>
          <span class="hint">${index + 1} / ${slides.length} · ← → слайди · пробіл вперед · Shift+пробіл назад</span>
          <button type="button" data-next>Далі</button>
        </footer>
      </main>`;
  }

  function body(slide) {
    if (slide.kind === "hero") return hero();
    if (slide.kind === "define") return defineSlide();
    if (slide.kind === "trio") return trioSlide();
    if (slide.kind === "nominal") return nominalSlide();
    if (slide.kind === "nulls") return nullSlide();
    if (slide.kind === "bounds") return boundsSlide();
    if (slide.kind === "domain") return domainSlide();
    if (slide.kind === "plan") return planSlide();
    if (slide.kind === "unsound") return unsoundSlide();
    if (slide.kind === "trust") return trustSlide();
    if (slide.kind === "poly") return polySlide();
    if (slide.kind === "nrtlead") return nrtLeadSlide();
    if (slide.kind === "close") return closeSlide();
    if (slide.kind === "memsafe") return memSafeSlide();
    if (slide.kind === "memlangs") return memLangsSlide();
    return `
      <p class="kicker">${esc(slide.kicker)}</p>
      <h2>${esc(slide.heading)}</h2>
      <div class="lede">${slide.lede}</div>
      ${slide.essay && !slide.essayAfter ? `<div class="essay">${slide.essay}</div>` : ""}
      <div class="player" data-player></div>
      ${slide.essay && slide.essayAfter ? `<div class="essay">${slide.essay}</div>` : ""}
      ${slide.note ? `<aside class="note"><p>${slide.note}</p></aside>` : ""}`;
  }

  function fnTypesPlayer() {
    return {
      lang: "ts",
      file: "hear.ts",
      scenarios: [
        {
          id: "fn",
          label: "Тип функції",
          code: `function hearBark(dog: Dog) {
    dog.bark();
}
function walk(animal: Animal, hear: (item: Animal) => void) {
    hear(animal);
}
walk(new Cat(), hearBark);`,
          stages: [
            { id: "need", label: "Споживач hear", sub: "обіцяє будь-який Animal" },
            { id: "offer", label: "hearBark", sub: "приймає лише Dog" },
            { id: "check", label: "strictFunctionTypes", sub: "параметр контраваріантний" },
          ],
          steps: [
            {
              stage: "need",
              lines: [4, 5],
              tone: "info",
              artifactTitle: "Що викличе walk",
              artifact: "hear має тип (item: Animal) => void\nwalk передасть у нього Animal\nцією твариною може бути Cat, не лише Dog",
              trace: "контракт колбека ширший за собаку",
            },
            {
              stage: "offer",
              lines: [1, 2],
              tone: "warn",
              artifactTitle: "Тіло вужче за контракт",
              artifact: "hearBark читає bark(), якого немає в Animal\nякщо всередину потрапить кішка, виклик впаде\nсама функція для собаки коректна",
              trace: "небезпека не в тілі, а в місці підстановки",
            },
            {
              stage: "check",
              lines: [7],
              tone: "bad",
              artifactTitle: "Присвоєння відхилено",
              artifact: "параметр функції перевіряють контраваріантно\n(Dog) => void не присвоюється в (Animal) => void\nрядок walk(...) не компілюється\nпадіння bark() до рантайму не доходить",
              trace: "strictFunctionTypes закриває цю підстановку",
              fail: true,
            },
          ],
        },
        {
          id: "method",
          label: "Метод",
          code: `interface Listener { hear(item: Animal): void }
const viaMethod: Listener = {
    hear(item: Dog) { item.bark(); }
};
viaMethod.hear(new Cat());`,
          stages: [
            { id: "decl", label: "Оголошення методу", sub: "біваріантний параметр" },
            { id: "ok", label: "Присвоєння", sub: "компілятор приймає" },
            { id: "call", label: "Виклик", sub: "кішка іде в bark" },
          ],
          steps: [
            {
              stage: "decl",
              lines: [1, 3],
              tone: "warn",
              artifactTitle: "Та сама сигнатура, інше правило",
              artifact: "hear оголошено методом, не функційною властивістю\nпараметри методів лишаються біваріантними\nінакше масив з методом push перестав би бути коваріантним",
              trace: "виняток із strictFunctionTypes зроблено навмисно",
            },
            {
              stage: "ok",
              lines: [2, 3],
              tone: "warn",
              artifactTitle: "Об’єкт проходить перевірку Listener",
              artifact: "hear(item: Dog) приймається як hear(item: Animal)\nпомилки компіляції немає\nтип viaMethod обіцяє, що hear витримає будь-який Animal",
              trace: "біваріантність пропустила вужчий параметр",
            },
            {
              stage: "call",
              lines: [5],
              tone: "bad",
              artifactTitle: "Кішка не має bark",
              artifact: "hear отримує Cat\nitem.bark шукає метод собаки\nTypeError під час виклику\nмісце падіння — виклик, а не оголошення літерала",
              trace: "несуцільність методу доживає до рантайму",
              fail: true,
            },
          ],
        },
      ],
    };
  }

  function wildcardPlayer() {
    return {
      lang: "java",
      file: "Numbers.java",
      scenarios: [
        {
          id: "read",
          label: "Лише читання",
          code: `void report(List<? extends Number> values) {
    Number first = values.get(0);
    values.add(Integer.valueOf(1));
}`,
          stages: [
            { id: "cap", label: "Захоплення ?", sub: "невідомий підтип Number" },
            { id: "get", label: "get", sub: "результат як Number" },
            { id: "add", label: "add", sub: "Integer не є capture#1" },
          ],
          steps: [
            {
              stage: "cap",
              lines: [1],
              tone: "info",
              artifactTitle: "Що означає знак питання",
              artifact: "виклик може передати List<Integer> або List<Double>\nкомпілятор називає цей підтип capture#1 extends Number\nусередині методу справжнє ім’я підтипу невідоме",
              trace: "wildcard замінено свіжою змінною захоплення",
            },
            {
              stage: "get",
              lines: [2],
              tone: "ok",
              artifactTitle: "Читання безпечне",
              artifact: "get повертає capture#1\ncapture#1 є підтипом Number, тому присвоєння в Number законне\nметод може прочитати значення, не знаючи конкретного підтипу",
              trace: "джерело віддає значення назовні як Number",
            },
            {
              stage: "add",
              lines: [3],
              tone: "bad",
              artifactTitle: "Запис Integer відхилено",
              artifact: "add вимагає аргумент типу capture#1\nInteger.valueOf(1) має тип Integer, не capture#1\nякби список був List<Double>, Integer зіпсував би його\njavac: incompatible types, capture of ?",
              trace: "запис у ? extends заборонений",
              fail: true,
            },
          ],
        },
        {
          id: "helper",
          label: "Допоміжний метод",
          code: `void touch(List<? extends Number> values) {
    touchHelper(values);
}
<T extends Number> void touchHelper(List<T> values) {
    T first = values.get(0);
    values.set(0, first);
}`,
          stages: [
            { id: "call", label: "Виклик helper", sub: "захоплення стає T" },
            { id: "same", label: "Один T", sub: "get і set збігаються" },
            { id: "limit", label: "Межа", sub: "два списки не змішати" },
          ],
          steps: [
            {
              stage: "call",
              lines: [1, 2],
              tone: "info",
              artifactTitle: "Захоплення отримує ім’я",
              artifact: "touchHelper виводить T як capture#1 цього списку\nусередині helper T уже звичайний параметр типу\nце той прийом, який описує туторіал Oracle про wildcard capture",
              trace: "допоміжний метод називає захоплення",
            },
            {
              stage: "same",
              lines: [5, 6],
              tone: "ok",
              artifactTitle: "Заміна елемента самим собою",
              artifact: "get(0) має тип T\nset(0, first) приймає той самий T\nоперація законна для Integer і для Double\nновий Number сюди як і раніше не підставити",
              trace: "читання і запис бачать один параметр",
            },
            {
              stage: "limit",
              lines: [4],
              tone: "warn",
              artifactTitle: "Два списки лишаються різними",
              artifact: "List<Integer> і List<Double> як List<? extends Number> мають різні захоплення\nперекласти get з першого в set другого не вийде\nокремого helper, який це дозволить, немає: операція справді хибна",
              trace: "захоплення не обходить несумісність двох списків",
            },
          ],
        },
      ],
    };
  }

  function varargsPlayer() {
    return {
      lang: "java",
      file: "PickTwo.java",
      code: `@SuppressWarnings("unchecked")
static <T> T[] pair(T a, T b) {
    return (T[]) new Object[] { a, b };
}
static <T> T[] pickTwo(T a, T b, T c) {
    return pair(a, b);
}
String[] names = pickTwo("Ada", "Ida", "Ina");`,
      stages: [
        { id: "alloc", label: "new Object[]", sub: "реальний масив" },
        { id: "cast", label: "(T[])", sub: "каст стирається" },
        { id: "return", label: "Повернення", sub: "забруднення йде вгору" },
        { id: "store", label: "String[]", sub: "прихований checkcast" },
      ],
      steps: [
        {
          stage: "alloc",
          lines: [3],
          tone: "warn",
          artifactTitle: "Масив створено як Object[]",
          artifact: "масив параметризованого типу T[] створити не можна: T нереіфіковний\nnew Object[] { \"Ada\", \"Ida\" } має componentType Object\nсамі елементи при цьому рядки",
          trace: "купа тримає масив об’єктів, не масив рядків",
        },
        {
          stage: "cast",
          lines: [3],
          tone: "warn",
          artifactTitle: "Неперевірене приведення нічого не перевіряє",
          artifact: "(T[]) після затирання стає приведенням до Object[]\ncheckcast до String[] тут не виконується\n@SuppressWarnings ховає попередження unchecked\nпопередження було єдиним статичним сигналом",
          trace: "анотація прибрала діагностику, не дірку",
        },
        {
          stage: "return",
          lines: [6],
          tone: "warn",
          artifactTitle: "pickTwo віддає чужий масив далі",
          artifact: "pair повертає T[], фактично Object[]\npickTwo прокидає це посилання викликачеві\nу тексті pickTwo приведення немає\nзабруднення вже вийшло з методу, який його створив",
          trace: "дірка піднялася на кадр вище",
        },
        {
          stage: "store",
          lines: [8],
          tone: "bad",
          artifactTitle: "Падіння на присвоєнні без явного касту",
          artifact: "компілятор вставляє checkcast String[] на результат pickTwo\nфактичний клас масиву — Object[]\nClassCastException: Object[] cannot be cast to String[]\nу стеку кадр виклику, не рядок new Object[]",
          trace: "виняток на два кадри далі за джерело",
          fail: true,
        },
      ],
    };
  }

  function mapperZeroPlayer() {
    return {
      lang: "java",
      file: "Settings.java",
      scenarios: [
        {
          id: "zero",
          label: "Примітив",
          code: `class Settings {
    public int maxRetries;
    public String name;
}
Settings settings = mapper.read(json, Settings.class);
apply(settings.maxRetries, settings.name);`,
          stages: [
            { id: "json", label: "Тіло", sub: "числа в документі немає" },
            { id: "bind", label: "Поле int", sub: "значення за замовчуванням 0" },
            { id: "post", label: "apply", sub: "0 є коректним int" },
          ],
          steps: [
            {
              stage: "json",
              lines: [5],
              tone: "info",
              artifactTitle: "Документ без числа",
              artifact: "{\"name\":\"worker\"}\nключа maxRetries немає\nHTTP і розбір синтаксису JSON успішні",
              trace: "документ валідний як JSON і неповний як контракт",
            },
            {
              stage: "bind",
              lines: [2, 5],
              tone: "warn",
              artifactTitle: "Мапер не бачить відсутності",
              artifact: "поле int у Java до присвоєння дорівнює 0\nтиповий мапер лишає це 0, якщо ключа немає\nвинятка розбору немає: 0 є допустимим значенням примітива\nname = \"worker\"",
              trace: "відсутнє поле стало законним нулем",
            },
            {
              stage: "post",
              lines: [6],
              tone: "bad",
              artifactTitle: "Нуль іде далі як справжнє значення",
              artifact: "apply(0, \"worker\")\nсигнатура apply(int, String) задоволена\nінваріант «поле було в документі» уже зламаний без винятка\nтой самий нуль дає властивість int у C#, доки її не позначено required",
              trace: "тип пропустив спотворення даних",
              fail: true,
            },
          ],
        },
        {
          id: "fix",
          label: "Обов’язкове поле",
          code: `record Settings(int maxRetries, String name) {}
Settings settings = mapper.read(json, Settings.class);
if (settings == null || settings.name() == null) {
    throw new IllegalArgumentException("неповний об’єкт");
}
apply(settings.maxRetries(), settings.name());`,
          stages: [
            { id: "ctor", label: "Конструктор", sub: "обидва аргументи потрібні" },
            { id: "miss", label: "Немає ключа", sub: "розбір не створює об’єкт" },
            { id: "gate", label: "Брама", sub: "до apply не дійшли" },
          ],
          steps: [
            {
              stage: "ctor",
              lines: [1],
              tone: "info",
              artifactTitle: "Число є параметром, не полем із нулем",
              artifact: "канонічний конструктор рекорда вимагає maxRetries\nоб’єкт Settings не існує, доки обидва значення не передані\nце ще не перевірка JSON: її має зробити мапер або код після нього",
              trace: "модель більше не має тихого default для числа",
            },
            {
              stage: "miss",
              lines: [2],
              tone: "warn",
              artifactTitle: "Розбір неповного документа",
              artifact: "мапер, налаштований падати на пропущеному параметрі, не повертає Settings\nальтернатива: повернути помилку поля maxRetries\n0 у застосування на цьому кроці не з’являється",
              trace: "відсутність лишається помилкою розбору",
            },
            {
              stage: "gate",
              lines: [3, 4],
              tone: "ok",
              artifactTitle: "Використання лише після повноти",
              artifact: "навіть успішний об’єкт перевіряють на name == null\nпорожній рядок дає IllegalArgumentException до apply\nдля C# ту саму роль виконує required або окрема схема",
              trace: "брама стоїть перед використанням",
            },
          ],
        },
      ],
    };
  }

  function planSlide() {
    return `
      <p class="kicker">Адженда</p>
      <h2>Що розберемо</h2>
      <div class="essay">
        <p>Спочатку що тип обіцяє і чим ця обіцянка відрізняється від безпеки доступу до пам’яті. Далі як Java, C# і TypeScript тримають перевірку під час виконання. Потім підстановка колекцій, відсутнє значення і дані, які зібрав не цей компілятор.</p>
      </div>
      <div class="table-wrap">
        <table>
          <thead><tr><th>Блок</th><th>Питання, на яке треба вміти відповісти</th></tr></thead>
          <tbody>
            <tr><td>Гарантія і три моделі</td><td>Чим типобезпека відрізняється від коректної бізнес-операції і де саме стоїть перевірка в Java, C# і TypeScript.</td></tr>
            <tr><td>Доступ до пам’яті</td><td>Чим безпека пам’яті відрізняється від безпеки типів, які класи помилок закриває збирач сміття і що робить запис за length у Java, C# і TypeScript.</td></tr>
            <tr><td>Ім’я або форма</td><td>Чому в TypeScript Person сумісний із Named без implements і чому UserId та Duration з полем long у Java не є одним типом.</td></tr>
            <tr><td>Що лишається у виконанні</td><td>Чому після затирання падає get, навіщо javac пише міст, чим List&lt;long&gt; відрізняється від List&lt;string&gt; і чому as не читає значення.</td></tr>
            <tr><td>Підстановка колекцій</td><td>Коли ? extends і out безпечні, чому масив приймає запис, а List — ні, і чому strictFunctionTypes не чіпає методи.</td></tr>
            <tr><td>Відсутнє значення</td><td>Чому client.Address.City падає на одній із двох крапок і чим Address? відрізняється від перевірки в CLR.</td></tr>
            <tr><td>Межа процесу</td><td>Чому as і примітив у мапері тихо псують дані і хто обирає клас із JSON.</td></tr>
            <tr><td>Практика</td><td>Три задачі на Java, C# і TypeScript: внутрішній список із геттера, нуль замість «немає», UserId із сирого числа. У кожній мові є поломка і виправлення.</td></tr>
          </tbody>
        </table>
      </div>`;
  }

  function unsoundSlide() {
    return `
      <p class="kicker">TypeScript · рішення мови</p>
      <h2>Несуцільність тут — рішення продукту</h2>
      <div class="essay">
        <p>Масив рядків щойно впав у Java на ArrayStoreException. Той самий запис у TypeScript пройде: комірка не пам’ятає тип. Handbook каже прямо: система типів TypeScript не суцільна, і місця, де це дозволено, обирали свідомо. Потрібен баланс коректності і швидкості роботи в уже написаному JavaScript. З цього випливають три правила, які часто сприймають як баги компілятора.</p>
        <p>По-перше, змінювані масиви коваріантні. Інакше довелося б заборонити ситуацію, коли один масив лежить у кількох змінних, а так написано пів екосистеми. По-друге, параметри методів біваріантні навіть під strictFunctionTypes. Саме біваріантність push робить масив коваріантним: інакше метод push(Dog) не був би сумісним із push(Animal). По-третє, any і as вимикають перевірку локально. Це дірка в контракті модуля, а не режим налагодження.</p>
        <p>На рев’ю ці дірки розрізняють. Функційну властивість у публічному API перевіряють суворо. Метод інтерфейсу, який змінює колекцію, не вважають доказом безпеки підстановки. Для зовнішніх даних тип, записаний у файлі, доказом не є: його підтверджує схема. Відкриті реалізації цієї схеми — Zod, io-ts і Typia; остання з типу TypeScript збирає функцію перевірки під час компіляції, без окремої машини типів у рантаймі.</p>
      </div>`;
  }

  function trustSlide() {
    return `
      <p class="kicker">Межа процесу</p>
      <h2>Тип закінчується там, де значення зібрав не цей компілятор</h2>
      <div class="essay">
        <p>Досі типи описували код, який зібрав цей проєкт. Усередині однієї збірки Java, якщо немає unchecked і сирих типів, забруднення купи не виникає: так написано в туторіалі Oracle про нереіфіковні типи. Щойно до програми потрапляє бібліотека, зібрана окремо, рефлексія, JNI, dynamic у C# або JSON з мережі, цієї обіцянки вже немає. Попередження могло з’явитися в чужому jar, а ClassCastException — у вашому get.</p>
        <p>Практичне правило таке. Модуль, який приймає байти, повертає значення власного типу лише після розбору. Далі системою йде вже перевірений об’єкт: ні JsonNode, ні object. Зворотний напрямок такий самий: у чергу кладуть серіалізований контракт, а не довільний об’єкт із приватними полями. Рефлексію, яка змінює final або обходить узагальнення, у доменний сервіс не ховають.</p>
        <p>Окремо стоїть міжмовна межа. Тип TypeScript на відповіді Java нічого не перевіряє. OpenAPI або JSON Schema, згенеровані з одного джерела й перевірені і сервером, і клієнтом, закривають розходження полів. Ручний інтерфейс у клієнті, який «колись збігався» з DTO, є гіпотезою. Наступні слайди покажуть три прояви: as на відповіді API, нуль від мапера і приведення без instanceof.</p>
      </div>`;
  }

  function polySlide() {
    return `
      <p class="kicker">Десеріалізація</p>
      <h2>Клієнт не обирає клас, який створить процес</h2>
      <div class="essay">
        <p>Деякі мапери вміють прочитати з документа ім’я типу і створити екземпляр цього типу. Якщо ім’я прийшло в тілі запиту, відправник обирає клас у вашому процесі. Наслідки залежать від того, які класи взагалі можна створити і що вони роблять під час розбору. Це неприйнятний контракт для будь-якого сервісу, що читає ненадійні дані, навіть без конкретної експлойтної техніки.</p>
        <p>Дискримінатор має бути закритим переліком, який визначили ви: наприклад email, sms, push. Гілка розбору створює лише ваші DTO. Довільний рядок із JSON в аргумент конструктора класу не передають. Те саме стосується налаштувань, де тип об’єкта беруть із конфігурації, яку може змінити не власник сервісу.</p>
        <p>Ненадійне значення не повинно обирати, який тип опиниться в змінній. Ланцюжки конкретних класів і налаштування «увімкни поліморфний розбір ось так» у цій лекції не розбираються. На рев’ю достатньо питання: хто обирає клас, код сервісу чи документ клієнта?</p>
      </div>`;
  }

  function nrtLeadSlide() {
    return `
      <p class="kicker">C# · T?</p>
      <h2>Знак питання в C# не змінює тип у CLR</h2>
      <div class="essay">
        <p>Специфікація nullable reference types каже прямо: string і string? у рантаймі обидва є System.String. Знак питання щойно змусив написати перевірку перед розіменуванням. Він усе одно не додає перевірку в CLR. Анотація існує для попереджень. Приведення одного до іншого в CLR нічого не змінює. Тому бібліотека, зібрана без цієї перевірки, спокійно кладе null у параметр, який у вашому коді позначено як ненульовий. Попередження з’явиться лише тоді, коли анотації є в обох збірках і виклик аналізується.</p>
        <p>Узагальнення додають другу пастку. Для необмеженого T запис T? не означає Nullable&lt;T&gt;. Якщо підставили клас, T? є nullable-посиланням. Якщо підставили int, T? лишається int: знак питання на значущому типі без обмеження struct нічого не змінює. where T : struct робить T? саме Nullable&lt;T&gt;. where T : class не приймає nullable-посилання як аргумент. where T : notnull відсікає і null-посилання, і Nullable&lt;T&gt;.</p>
        <p>Тому FirstOrDefault&lt;T&gt; не може чесно повернути «немає елемента» для будь-якого T одним і тим самим default. Для класу default — це null, і атрибут MaybeNull якраз попереджає викликача. Для int default — це 0, і нуль «немає елемента» не відрізнити від нульового значення. У публічному API таким методом обов’язкове число не повертають. Повертають bool і значення через out або окремий тип результату з гілкою відсутності.</p>
      </div>
      <aside class="note"><p>У Java ту саму роль, що й анотації C#, відіграють Checker Framework і NullAway: вони читають @Nullable і не дають розіменувати значення до перевірки. JVM ці анотації не виконує. Увімкнений аналізатор у CI є частиною контракту збірки, інакше анотація лишається коментарем.</p></aside>`;
  }

  function boundsSlide() {
    return `
      <p class="kicker">Межа гарантії</p>
      <h2>Тип забороняє чужу операцію, не хибну бізнес-дію</h2>
      <div class="essay">
        <p>Програма може бути ідеально типізованою і все одно робити хибну дію: метод <code>save(Record)</code> отримав <code>Record</code> і повернув <code>Result</code>. Система типів тут мовчить. Вона не знає регламенту предметної області. Її обіцянка вужча: не викликати <code>save</code> на рядку, не додати <code>Cat</code> у список <code>Dog</code>, не прочитати поле через порожнє посилання так, ніби об’єкт існує.</p>
        <p>З цього випливають два різні дефекти системи типів. <strong>Неповнота</strong> відхиляє програму, яка під час виконання була б коректна. Приклад — заборона присвоїти <code>List&lt;Dog&gt;</code> в <code>List&lt;Animal&gt;</code>, навіть якщо далі зі списку тільки читають. Компілятор не доводить цю обіцянку для конкретного тіла методу, тому відмовляє заздалегідь. <strong>Несуцільність</strong> навпаки пропускає програму, яка падає або псує дані. Коваріантні масиви Java суцільні лише завдяки перевірці запису в рантаймі. Такі самі масиви в TypeScript несуцільні до кінця: перевірки запису немає.</p>
        <p>Друга межа — походження даних. Тип у файлі описує значення, які зібрав код цього файлу. Байти HTTP-відповіді, колонка бази й вміст черги під час компіляції ще не існують. Поки їх не розібрали перевіркою у виконанні, статичний тип навколо них є гіпотезою. Решта лекції якраз про те, де гіпотезу перевіряє компілятор, де — віртуальна машина, і де не перевіряє ніхто.</p>
      </div>`;
  }

  function domainSlide() {
    return `
      <p class="kicker">Навіщо окремий тип</p>
      <h2>Один long — різні значення</h2>
      <div class="essay">
        <p><code>long</code> приймає ідентифікатор, тривалість у мілісекундах і порядковий номер. Додавання двох <code>long</code> компілюється, навіть якщо один із них — ідентифікатор, а другий — час. Номінальний тип їх розрізняє: сумісність іде від оголошення, а не від набору полів.</p>
      </div>
      <div class="grid-2">
        <article class="card">
          <span class="tag java">Java або C#</span>
          <h3>Два типи з однаковим полем</h3>
          <p><code>UserId</code> і <code>Duration</code> можуть обидва зберігати <code>long</code>. Присвоїти один одному їх не можна, доки немає спільного предка або явного перетворення. Перетворення записують методом на кшталт <code>toMillis()</code>, і в цьому методі лишається єдине місце, де одиниці змішують свідомо.</p>
        </article>
        <article class="card">
          <span class="tag ts">TypeScript</span>
          <h3>Однакова форма збігається</h3>
          <p>Якщо обидва типи — це <code>{ value: number }</code>, структурна перевірка вважає їх замінюваними. Захист одиниць тоді будують брендованим типом: перетин з унікальним тегом, якого у значенні під час виконання немає. Тег стирається разом з рештою типів, тож на межі JSON його все одно підтверджують схемою.</p>
        </article>
      </div>
      <aside class="note"><p>Бренд у TypeScript виглядає як <code>type UserId = number &amp; { readonly brand: unique symbol }</code>. Функція приймає <code>UserId</code> і відмовляється від голого <code>number</code>. Це номінальна дисципліна поверх структурної мови. Вона працює лише там, де значення створює ваш код, а не розбір зовнішнього JSON.</p></aside>`;
  }

  function hero() {
    return `
      <div class="hero">
        <p class="kicker">Інтерактивна лекція · Java, C#, TypeScript</p>
        <h2>Безпека типів</h2>
        <div class="hero-rule"></div>
        <p class="lede">Безпека типів — обіцянка виконати операцію лише тоді, коли вона відповідає типу значення. Поруч стоїть безпека пам’яті: не читати й не писати комірку, яку цей рядок не виділяв. Java і C# тримають обидві обіцянки в рантаймі, з різними дірками. TypeScript тримає типи лише до трансляції; пам’ять захищає вже рушій JavaScript. Кожну схему можна пройти кроками вперед і назад.</p>
        <div class="lang-row">
          <span class="pill java">Java · номінативна, erasure</span>
          <span class="pill cs">C# · номінативна, reified</span>
          <span class="pill ts">TypeScript · структурна, стирається</span>
        </div>
      </div>`;
  }

  function memSafeSlide() {
    return `
      <p class="kicker">Пам’ять</p>
      <h2>Тип і пам’ять — дві різні обіцянки</h2>
      <p class="quote">Безпека доступу до пам’яті — властивість не дати програмі прочитати або змінити комірку, яку цей код не виділяв під поточну операцію.</p>
      <div class="essay">
        <p>Українська Вікіпедія формулює мету так: запобігти помилкам, що відкривають доступ до оперативної пам’яті поза задумом програми — виходу за межі масиву, завислому вказівнику, повторному вивільненню. C і C++ дають арифметику вказівників і ручне <code>malloc</code>/<code>free</code> без обов’язкової перевірки меж. Java, керований C# і TypeScript цієї моделі не мають.</p>
        <p>Безпека типів відповідає на інше питання: чи операція дозволена для цього типу значення. Можна мати безпечну пам’ять і все одно викликати відсутнє поле після <code>as</code>: купа ціла, контракт типу зламаний. Можна мати точні типи в C і все одно записати за кінець буфера: компілятор прийняв <code>int*</code>, а сусідні байти вже чужі.</p>
      </div>
      <div class="table-wrap">
        <table>
          <thead><tr><th>Клас помилки</th><th>Що відбувається без захисту</th><th>Що робить керований рантайм</th></tr></thead>
          <tbody>
            <tr><td>Вихід за межі</td><td>Читання або запис за виділений буфер. Сусідні байти змінюються.</td><td>Перевірка індексу. Виняток або ріст об’єкта-масиву. Сусідній об’єкт лишається окремим.</td></tr>
            <tr><td>Завислий вказівник, use after free</td><td>Об’єкт вивільнено, адреса ще жива. Далі там може лежати вже інше.</td><td>Збирач сміття не забирає об’єкт, поки на нього є досяжне посилання. Ручного <code>free</code> немає.</td></tr>
            <tr><td>Подвійне вивільнення, втрата вказівника</td><td>Алокатор псується або фрагмент стає недосяжним.</td><td>Вивільняє лише збирач. Витік лишається, якщо посилання тримають зайве.</td></tr>
            <tr><td>Неініціалізований вказівник</td><td>Читання з випадкової адреси.</td><td>Посилання або <code>null</code>. Розіменування null — виняток, не читання чужої сторінки як даних.</td></tr>
          </tbody>
        </table>
      </div>
      <aside class="note"><p>Переповнення стека від рекурсії і нестача купи — окремий клас: програма просить більше пам’яті, ніж їй дали. Рантайм аварійно зупиняє процес. Це не дає записати в чужий об’єкт через індекс.</p></aside>`;
  }

  function memLangsSlide() {
    return `
      <p class="kicker">Пам’ять · три мови</p>
      <h2>Захист стоїть у машині, не в анотації типу</h2>
      <div class="essay">
        <p>Високорівневі мови закривають доступ до пам’яті трьома відмовами, які описує той самий огляд: немає арифметики вказівників, приведення не відкриває довільну адресу, єдиний господар купи — збирач сміття. У Java і C# це ще перевірка байткоду або IL до виконання. У TypeScript анотацій під час виконання вже немає: захист дає рушій JavaScript, на якому крутиться результат <code>tsc</code>.</p>
      </div>
      <div class="grid-3">
        <article class="card">
          <span class="tag java">Java · JVM</span>
          <h3>Посилання і верифікатор</h3>
          <p>Розкладку об’єкта вибирає рантайм. Програміст тримає посилання, не адресу. Верифікатор байткоду відхиляє код, який підробляє вказівник або плутає типи операндів. Під час виконання JVM звіряє <code>null</code>, межі масиву і <code>checkcast</code>. JNI і <code>sun.misc.Unsafe</code> цю обіцянку знімають: далі працює нативний код.</p>
        </article>
        <article class="card">
          <span class="tag cs">C# · CLR</span>
          <h3>Верифікований IL</h3>
          <p>Більшість збірки — verifiably safe: немає вказівників, сиру пам’ять не виділяють, об’єкти створює рантайм. Межі масиву і <code>Span&lt;T&gt;</code> перевіряє CLR. Блок <code>unsafe</code>, P/Invoke і <code>Marshal</code> відкривають некеровану пам’ять; Microsoft вимагає окремого <code>AllowUnsafeBlocks</code>. <code>stackalloc</code> у <code>Span&lt;T&gt;</code> лишається керованим.</p>
        </article>
        <article class="card">
          <span class="tag ts">TypeScript</span>
          <h3>Рушій, не tsc</h3>
          <p>Типи стираються. V8 або SpiderMonkey виділяють об’єкти самі й забирають недосяжні. Арифметики вказівників у мові немає. Витік лишається, якщо посилання тримають у замиканні або глобалі. Нативні додатки Node, WebAssembly і <code>SharedArrayBuffer</code> знову ставлять програму біля некерованої пам’яті.</p>
        </article>
      </div>
      <aside class="note"><p>Опора: стаття «Безпека доступу до пам’яті»; Oracle, The Java Language Environment, розділ про виділення пам’яті і верифікатор; Microsoft Learn, Unsafe code; MDN, Memory management у JavaScript.</p></aside>`;
  }

  function defineSlide() {
    return `
      <p class="kicker">Визначення</p>
      <h2>Операція має відповідати формі даних</h2>
      <p class="quote">Безпека типів — властивість мови не виконати операцію над значенням, якщо ця операція не відповідає оголошеній специфікації або фактичній структурі значення.</p>
      <div class="essay">
        <p>Специфікація — це те, що бачить компілятор: тип змінної, параметра, значення, що повертається. Структура — це те, що є в пам’яті: клас об’єкта, тип компонента масиву, розкладка значущого типу. Вони збігаються не завжди. Явне приведення якраз просить вважати специфікацію вужчою за те, що компілятор може довести. Тоді розрив закриває перевірка під час виконання або не закриває ніхто.</p>
      </div>
      <div class="grid-3">
        <article class="card">
          <span class="tag neutral">Пам’ять</span>
          <h3>Чужі байти</h3>
          <p>Якщо прочитати <code>long</code> як <code>int</code> або рядок як числовий масив, адреса й ширина значення перестають відповідати розкладці. Це вже межа безпеки пам’яті, яку розберемо окремо: JVM і CLR відсікають таке читання, доки код лишається керованим.</p>
        </article>
        <article class="card">
          <span class="tag neutral">Виклик</span>
          <h3>Методу немає</h3>
          <p>Метод існує в одному класі і не існує в іншому. Виклик після хибного приведення або після <code>any</code> шукає член, якого в фактичному об’єкті немає.</p>
        </article>
        <article class="card">
          <span class="tag neutral">Домен</span>
          <h3>Чужа одиниця</h3>
          <p>Додати ідентифікатор до тривалості — типізована арифметика над <code>long</code>, якщо окремого типу немає. Система типів захищає предметну область лише тією мірою, якою її взагалі виражено типом.</p>
        </article>
      </div>
      <aside class="note"><p>Статична перевірка дивиться на текст програми до запуску. Вона консервативна: інколи відхиляє безпечний код, бо не виконує його. Динамічна перевірка дивиться на конкретне значення і тому пізніша. Дані з мережі, файлу й бази належать до другої, доки їх явно не розібрали.</p></aside>`;
  }

  function trioSlide() {
    return `
      <p class="kicker">Три мови</p>
      <h2>Де саме стоїть перевірка</h2>
      <div class="essay">
        <p>Усі три мови перевіряють типи до запуску. Відрізняється те, що від цієї перевірки лишається у виконуваному файлі. Від цього залежить, чи впіймає система підміну вже під час роботи, чи лише під час збирання.</p>
      </div>
      <div class="grid-3">
        <article class="card">
          <span class="tag java">Java</span>
          <h3>javac, потім JVM</h3>
          <p>Номінативні типи: клас сумісний із інтерфейсом, якщо це оголошено. У байткоді лишаються <code>checkcast</code>, <code>instanceof</code> і перевірка запису в масив. Параметр узагальнення стирається, тож <code>List&lt;String&gt;</code> у машині — це <code>ArrayList</code>. Обіцянку елемента відновлює каст на читанні.</p>
        </article>
        <article class="card">
          <span class="tag cs">C#</span>
          <h3>Компілятор, потім CLR</h3>
          <p>Теж номінативна система, але аргумент узагальнення матеріалізований. Для <code>long</code> і <code>decimal</code> JIT будує окремий код. Для класів код спільний, а тип об’єкта різний. <code>typeof(T)</code> і <code>is</code> усередині узагальненого методу дають відповідь під час виконання.</p>
        </article>
        <article class="card">
          <span class="tag ts">TypeScript</span>
          <h3>Лише tsc</h3>
          <p>Сумісність структурна: достатньо форми. Транслятор викидає типи повністю, включно з <code>as</code>. У браузері немає ні перевірки присвоєння, ні типу комірки масиву. Лишається поведінка JavaScript, тож межу процесу закривають окремою схемою.</p>
        </article>
      </div>
      <aside class="note"><p>Одразу після цього — як ті самі рантайми закривають доступ до пам’яті. Далі платформами: Java (затирання, міст, varargs), C# (пакування і реіфікація), TypeScript (форма і стирання). Потім підстановка колекцій, відсутнє значення і дані ззовні процесу.</p></aside>`;
  }

  function nominalSlide() {
    return `
      <p class="kicker">Правило сумісності</p>
      <h2>Ім’я типу або його форма</h2>
      <div class="essay">
        <p>Номінативна система питає: чи оголошено зв’язок між типами. Структурна питає: чи вистачає членів потрібних типів. Для двох типів з однаковими полями відповіді різні, і це змінює те, де ловлять плутанину значень.</p>
      </div>
      <div class="table-wrap">
        <table>
          <thead>
            <tr><th></th><th>Java і C#</th><th>TypeScript</th></tr>
          </thead>
          <tbody>
            <tr><td>Правило</td><td>Сумісність іде від <code>extends</code> або <code>implements</code>. Однакових полів замало.</td><td>Сумісність іде від членів. Однакової форми досить, навіть без спільного імені.</td></tr>
            <tr><td>Named і Person</td><td>Person не передають туди, де чекають Named, доки клас цього не оголосив.</td><td>Якщо є <code>name: string</code>, присвоєння законне. Зайве поле <code>age</code> не заважає.</td></tr>
            <tr><td>Зайвий ключ</td><td>Зайве поле не робить об’єкт екземпляром чужого інтерфейсу.</td><td>У змінній зайве поле дозволене. У свіжому літералі ні: excess property check ловить <code>nmae</code> замість <code>name</code>.</td></tr>
            <tr><td>Після компіляції</td><td>Ім’я класу лишається в об’єкті. <code>checkcast</code> і <code>instanceof</code> звіряють його.</td><td>Ім’я інтерфейсу зникає. Питання «чи це Named» у рантаймі вирішують лише власною перевіркою полів.</td></tr>
          </tbody>
        </table>
      </div>
      <aside class="note"><p>Структурна перевірка рекурсивна: якщо поле саме об’єкт, порівнюють і його члени. Порожній інтерфейс не вимагає нічого, тому приймає майже будь-яке значення, крім <code>null</code> за <code>strictNullChecks</code>. Публічний контракт таким типом не позначають.</p></aside>`;
  }

  function nullSlide() {
    return `
      <p class="kicker">Відсутнє значення</p>
      <h2>Null входить у тип або ховається в кожному посиланні</h2>
      <div class="essay">
        <p>Підстановка колекцій уже закрита. Наступна дірка — не чужий клас у списку, а відсутність об’єкта. Якщо посилання може бути порожнім, а тип цього не каже, ланцюжок <code>client.Address.City</code> компілюється і падає під час виконання. Null safety переносить це розгалуження в тип, тож гілка «значення немає» стає обов’язковою в коді.</p>
        <p>Прапорці компілятора самі по собі не вставляють перевірку в машинний код. Вони змушують написати її в джерелі. Заглушка <code>!</code> у C# і твердження <code>as</code> у TypeScript знову вимикають цю вимогу.</p>
      </div>
      <div class="grid-3">
        <article class="card">
          <span class="tag java">Java</span>
          <h3>Посилання можуть бути null</h3>
          <p>У типі немає поділу на обов’язковий об’єкт і порожній. Для повернення з методу порожнечу пакують в <code>Optional&lt;T&gt;</code>: викликач мусить розгорнути значення через <code>orElse</code>, <code>map</code> або явну перевірку <code>isPresent</code>. Розіменування null дає <code>NullPointerException</code>. Анотації на кшталт <code>@Nullable</code> бачать аналізатори, але не JVM.</p>
        </article>
        <article class="card">
          <span class="tag cs">C#</span>
          <h3>Nullable reference types</h3>
          <p><code>&lt;Nullable&gt;enable&lt;/Nullable&gt;</code> робить посилання без знака питання ненульовими в очах компілятора. <code>Address?</code> дозволяє описати відсутню адресу. Оператор <code>?.</code> обриває ланцюжок. Шаблон <code>is { Address: { City: string city } }</code> і перевіряє ланки, і дістає місто. Якщо попередження проігнорувати, CLR усе одно кине <code>NullReferenceException</code>.</p>
        </article>
        <article class="card">
          <span class="tag ts">TypeScript</span>
          <h3>strictNullChecks</h3>
          <p>Без прапорця <code>null</code> і <code>undefined</code> майже зникають із перевірок, тож результат <code>find</code> можна читати так, ніби елемент точно знайдено. З прапорцем вони стають окремими типами, і читання без звуження — помилка компіляції. У згенерованому JavaScript цієї заборони вже немає: анотацію викинуто.</p>
        </article>
      </div>`;
  }

  function closeSlide() {
    return `
      <p class="kicker">Висновки</p>
      <h2>Безпека типів обмежує операцію, не предметну область</h2>
      <div class="essay">
        <p>Тип обіцяє: операцію виконають лише тоді, коли вона відповідає специфікації або фактичній структурі значення. Окремо рантайм обіцяє не дати цьому рядку прочитати чи змінити комірку, яку він не виділяв. Java і C# тримають обидві обіцянки в керованому коді. TypeScript тримає першу до трансляції; другу виконує рушій JavaScript. Жодна з трьох мов не знає, чи дія коректна для предметної області.</p>
        <p>Від цього випливають три наслідки для типів. По-перше, <code>any</code>, сирий тип і неперевірений <code>object</code> вимикають перевірку типу, пам’ять при цьому лишається під збирачем сміття. По-друге, статичний тип описує код модуля; байти з мережі, бази й черги отримують цей тип лише після перевірки під час виконання. По-третє, відсутність значення і напрям підстановки колекції мають бути видимі в типі: інакше падіння або спотворення відсувається в інший кадр.</p>
      </div>
      <div class="checklist">
        <article class="check">
          <div class="check-n">1</div>
          <div>
            <h3>Динамічний обхід знімає гарантію</h3>
            <p>Сирий <code>List</code> у Java, приведення через <code>object</code> у C# і <code>any</code> або <code>as</code> у TypeScript лишають у тексті тип, якого виконання вже не перевіряє. ClassCastException, InvalidCastException і TypeError тоді з’являються там, де значення читають, а не там, де обхід відкрили.</p>
          </div>
        </article>
        <article class="check">
          <div class="check-n">2</div>
          <div>
            <h3>Компілятор і рантайм бачать різне</h3>
            <p>javac і tsc перевіряють оголошення. JVM звіряє клас об’єкта, тип комірки масиву і міст. CLR зберігає аргумент узагальнення і тип коробки. Після tsc лишається JavaScript без типу комірки. Затирання Java не відновлює параметр на списку: <code>checkcast</code> стоїть на <code>get</code>.</p>
          </div>
        </article>
        <article class="check">
          <div class="check-n">3</div>
          <div>
            <h3>Невидиме в типі доживає до виконання</h3>
            <p>Null у кожному посиланні, коваріантний масив, примітив, якому мапер підставив нуль, і поле, яке <code>as</code> оголосив наявним, компілюються. Суворий режим, <code>T?</code>, <code>Optional&lt;T&gt;</code> і інваріантний <code>List&lt;T&gt;</code> роблять ці стани частиною оголошення. Схему на межі процесу виконання все одно виконує окремо: статичний тип зовнішнього JSON не бачить.</p>
          </div>
        </article>
      </div>
      <div class="table-wrap" style="margin-top:0.9rem">
        <table>
          <thead>
            <tr><th></th><th>Що лишається під час виконання</th><th>Типовий пізній збій</th></tr>
          </thead>
          <tbody>
            <tr><td>Java</td><td>Клас об’єкта, checkcast, перевірка індексу і елемента масиву. Параметр узагальнення стерто.</td><td>ClassCastException, ArrayIndexOutOfBoundsException, ArrayStoreException, NullPointerException</td></tr>
            <tr><td>C#</td><td>Аргумент узагальнення, окремий код для value types, перевірка індексу масиву.</td><td>InvalidCastException, IndexOutOfRangeException, ArrayTypeMismatchException, NullReferenceException</td></tr>
            <tr><td>TypeScript</td><td>Лише значення JavaScript. Типів, кастів і типу елемента масиву немає.</td><td>TypeError на відсутньому полі або чужому методі</td></tr>
          </tbody>
        </table>
      </div>
      <p class="sources">Джерела даних: «Безпека доступу до пам’яті»; Oracle, The Java Language Environment; Microsoft Learn, Unsafe code; MDN, Memory management; Oracle Java Tutorials про type erasure і нереіфіковні типи; JLS і CERT OBJ03-J; Effective Java, item 32; Microsoft Learn про boxing і generics in the runtime; специфікація nullable reference types; TypeScript Handbook про structural compatibility і soundness; реліз 2.6 про strictFunctionTypes.</p>`;
  }

  function render() {
    stop();
    app.innerHTML = shell();
    const slide = slides[index];
    if (slide.player) mountPlayer(app.querySelector("[data-player]"), slide.player);
    bind();
    const current = app.querySelector('.nav-item[aria-current="true"]');
    if (current) current.scrollIntoView({ block: "nearest" });
  }

  function bind() {
    app.querySelectorAll("[data-go]").forEach((button) => {
      button.addEventListener("click", () => go(Number(button.getAttribute("data-go"))));
    });
    app.querySelector("[data-prev]").addEventListener("click", () => go(index - 1));
    app.querySelector("[data-next]").addEventListener("click", () => go(index + 1));
    const menu = app.querySelector("[data-menu]");
    menu.addEventListener("click", () => app.querySelector(".nav").classList.toggle("open"));
  }

  function go(next) {
    index = Math.max(0, Math.min(slides.length - 1, next));
    render();
  }

  function stop() {
    if (timer) clearInterval(timer);
    timer = null;
  }

  function mountPlayer(root, spec) {
    const tracks = spec.tracks
      ? spec.tracks
      : [{ lang: spec.lang, file: spec.file, scenarios: spec.scenarios || [spec] }];
    let trackIndex = 0;
    let scenarioIndex = 0;
    let cursor = -1;

    function track() {
      return tracks[trackIndex];
    }

    function scenario() {
      return track().scenarios[scenarioIndex];
    }

    function draw() {
      const current = scenario();
      const lang = current.lang || track().lang || spec.lang;
      const file = current.file || track().file || spec.file;
      const langChips = tracks.length > 1
        ? `<div class="scenarios langs">${tracks.map((item, itemIndex) => {
          const pressed = itemIndex === trackIndex ? "true" : "false";
          return `<button type="button" data-track="${itemIndex}" aria-pressed="${pressed}">${esc(item.label)}</button>`;
        }).join("")}</div>`
        : "";
      const modes = track().scenarios;
      const modeChips = modes.length > 1
        ? `<div class="scenarios">${modes.map((item, itemIndex) => {
          const pressed = itemIndex === scenarioIndex ? "true" : "false";
          return `<button type="button" data-scenario="${itemIndex}" aria-pressed="${pressed}">${esc(item.label)}</button>`;
        }).join("")}</div>`
        : "";
      const chips = (langChips || modeChips)
        ? `<div class="chip-stack">${langChips}${modeChips}</div>`
        : "<span></span>";

      root.innerHTML = `
        <div class="player-top">
          <div class="controls">
            <button type="button" data-act="back" disabled>Крок назад</button>
            <button class="primary" type="button" data-act="step">Запустити</button>
            <button type="button" data-act="reset">Спочатку</button>
            <span class="step-count" data-count>0 / ${current.steps.length}</span>
          </div>
          ${chips}
          <span class="pill ${lang === "cs" ? "cs" : lang === "ts" ? "ts" : "java"}">${esc(file)}</span>
        </div>
        <div class="player-grid">
          <div class="code-pane">
            <div class="code-top"><span>${esc(lang === "cs" ? "C#" : lang === "ts" ? "TypeScript" : "Java")}</span><span>приклад</span></div>
            <pre class="code">${highlight(current.code, lang)}</pre>
          </div>
          <div class="stage-pane">
            <div class="stage-top"><span>хід виконання</span><span>проміжні результати</span></div>
            <ol class="timeline">${current.stages.map((stage) => `
              <li data-stage="${esc(stage.id)}">
                <span class="dot"><i></i></span>
                <span><span class="st-label">${esc(stage.label)}</span><span class="st-sub">${esc(stage.sub)}</span></span>
              </li>`).join("")}</ol>
            ${memoryBlock(current)}
            <div class="artifact" data-artifact>
              <div class="artifact-k">Очікування</div>
              <p class="artifact-v">Натисніть «Запустити», щоб пройти схему по кроках.</p>
            </div>
            <ol class="trace" data-trace></ol>
          </div>
        </div>`;

      root.querySelectorAll("[data-track]").forEach((button) => {
        button.addEventListener("click", () => {
          stop();
          trackIndex = Number(button.getAttribute("data-track"));
          scenarioIndex = Math.min(scenarioIndex, track().scenarios.length - 1);
          cursor = -1;
          draw();
        });
      });
      root.querySelectorAll("[data-scenario]").forEach((button) => {
        button.addEventListener("click", () => {
          stop();
          scenarioIndex = Number(button.getAttribute("data-scenario"));
          cursor = -1;
          draw();
        });
      });
      root.querySelector('[data-act="step"]').addEventListener("click", () => advance());
      root.querySelector('[data-act="back"]').addEventListener("click", () => {
        if (cursor > 0) show(cursor - 1);
      });
      root.querySelector('[data-act="reset"]').addEventListener("click", () => show(-1));
      if (cursor >= 0) paintState();
    }

    function memoryBlock(current) {
      const cells = cellsFor(current);
      if (!cells.stack.length && !cells.heap.length) return "";
      const column = (title, keys) => {
        if (!keys.length) return "";
        return `<div class="mem-col"><h4>${title}</h4>${keys.map((key) => {
          const id = key.replace(/"/g, "");
          return `<div class="cell" data-cell="${esc(id)}">${esc(CELL_LABELS[id] || id)}</div>`;
        }).join("")}</div>`;
      };
      return `<div class="mem" data-mem>${column("Стек", cells.stack)}${column("Купа", cells.heap)}</div>`;
    }

    function advance() {
      const steps = scenario().steps;
      if (cursor >= steps.length - 1) return true;
      show(cursor + 1);
      return cursor >= steps.length - 1;
    }

    function show(next) {
      cursor = next;
      paintState();
    }

    function paintState() {
      const current = scenario();
      const steps = current.steps;
      const active = cursor >= 0 ? steps[cursor] : null;
      root.querySelectorAll("[data-stage]").forEach((item) => {
        item.classList.remove("is-active", "is-done", "is-fail");
      });
      if (active) {
        const seen = new Set();
        const failed = new Set();
        steps.slice(0, cursor).forEach((step) => {
          seen.add(step.stage);
          if (step.fail) failed.add(step.stage);
        });
        seen.delete(active.stage);
        failed.delete(active.stage);
        root.querySelectorAll("[data-stage]").forEach((item) => {
          const id = item.getAttribute("data-stage");
          if (id === active.stage) item.classList.add(active.fail ? "is-fail" : "is-active");
          else if (failed.has(id)) item.classList.add("is-fail");
          else if (seen.has(id)) item.classList.add("is-done");
        });
      }
      const lines = new Set((active && active.lines) || []);
      root.querySelectorAll(".ln").forEach((line) => {
        line.classList.toggle("is-hot", lines.has(Number(line.getAttribute("data-ln"))));
      });
      const hot = root.querySelector(".ln.is-hot");
      const pane = hot && hot.closest("pre");
      if (hot && pane && hot.getBoundingClientRect) {
        const paneRect = pane.getBoundingClientRect();
        const hotRect = hot.getBoundingClientRect();
        if (hotRect.top < paneRect.top) pane.scrollTop -= paneRect.top - hotRect.top - 6;
        else if (hotRect.bottom > paneRect.bottom) pane.scrollTop += hotRect.bottom - paneRect.bottom + 6;
      }

      const card = root.querySelector("[data-artifact]");
      card.className = "artifact";
      if (!active) {
        card.innerHTML = `<div class="artifact-k">Очікування</div><p class="artifact-v">Натисніть «Запустити», щоб пройти схему по кроках.</p>`;
      } else {
        card.classList.add(`tone-${active.tone || "info"}`);
        card.innerHTML = `<div class="artifact-k">${esc(active.artifactTitle)}</div><p class="artifact-v">${esc(active.artifact)}</p>`;
      }

      const trace = root.querySelector("[data-trace]");
      trace.innerHTML = steps.slice(0, cursor + 1).map((step, stepIndex) => {
        return `<li><b>${String(stepIndex + 1).padStart(2, "0")}</b> ${esc(step.trace)}</li>`;
      }).join("");
      trace.scrollTop = trace.scrollHeight;

      root.querySelector("[data-count]").textContent = `${Math.max(cursor + 1, 0)} / ${steps.length}`;
      const forward = root.querySelector('[data-act="step"]');
      const backward = root.querySelector('[data-act="back"]');
      forward.textContent = cursor < 0 ? "Запустити" : "Крок вперед";
      forward.disabled = cursor >= steps.length - 1;
      backward.disabled = cursor <= 0;

      const memRoot = root.querySelector("[data-mem]");
      if (memRoot) {
        memRoot.querySelectorAll("[data-cell]").forEach((cell) => cell.classList.remove("on", "ok", "bad"));
        const mem = mergedMem(steps, cursor);
        if (mem) {
          Object.entries(mem.stack).forEach(([key, tone]) => mark(memRoot, `stack-${key}`, tone));
          Object.entries(mem.heap).forEach(([key, tone]) => mark(memRoot, `heap-${key}`, tone));
        }
      }
    }

    function mark(memRoot, key, tone) {
      const cell = memRoot.querySelector(`[data-cell="${key}"]`);
      if (!cell) return;
      cell.hidden = false;
      if (tone) cell.classList.add(tone);
    }

    draw();
  }

  document.addEventListener("keydown", (event) => {
    const tag = document.activeElement && document.activeElement.tagName;
    if (tag === "INPUT" || tag === "TEXTAREA") return;
    if (event.key === "ArrowRight") {
      event.preventDefault();
      go(index + 1);
    } else if (event.key === "ArrowLeft") {
      event.preventDefault();
      go(index - 1);
    } else if (event.key === " ") {
      const target = app.querySelector(event.shiftKey ? '[data-act="back"]' : '[data-act="step"]');
      if (target && !target.disabled) {
        event.preventDefault();
        target.click();
      }
    }
  });

  render();
})();
