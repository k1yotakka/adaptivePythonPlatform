# Документация клиентской части проекта PyLearn

## Используемые технологии

Для разработки интерфейса пользователя применялись следующие инструменты и библиотеки:
- React 18 в качестве основной библиотеки для построения UI
- Vite как сборщик и dev-сервер
- React Router v6 для маршрутизации между страницами
- Чистый CSS без использования UI-фреймворков типа Tailwind
- lucide-react для иконок
- react-simple-code-editor и prismjs для редактора кода

Запуск приложения в режиме разработки выполняется командой:
```
npm run dev
```

После запуска приложение доступно по адресу http://localhost:5173 (или 5174, 5175, если порт занят).

---

## Структура проекта

```
src/
  main.jsx                — точка входа приложения React
  App.jsx                 — определение всех роутов
  api/
    api.js                — все функции для работы с backend API
  context/
    AuthContext.jsx       — контекст авторизации (user, login, logout)
  layouts/
    StudentLayout.jsx     — общий layout для студента (sidebar + main)
    TeacherLayout.jsx     — общий layout для преподавателя (sidebar + main)
    AuthLayout.jsx        — layout для страниц входа/регистрации
    OnboardingLayout.jsx  — layout для онбординга
    PracticeLayout.jsx    — layout для страницы решения задач
  components/
    UI/Button.jsx         — переиспользуемый компонент кнопки
  pages/
    Auth/
      Login.jsx           — вход в систему
      Signup.jsx          — регистрация
    Student/
      Dashboard.jsx       — главная страница студента
      Map.jsx             — карта курсов
      ModulePage.jsx      — страница модуля (список уроков)
      LessonPage.jsx      — страница урока (теория + задачи)
      Practice/
        Practice.jsx      — редактор кода, выполнение, AI-подсказки
      Tasks/
        TaskList.jsx      — список standalone-задач
      Progress.jsx        — статистика прогресса
      JoinGroup.jsx       — вступление в группу по коду
      Onboarding/
        LevelSelect.jsx   — выбор уровня
        GoalSelect.jsx    — выбор цели обучения
        ScreeningTest.jsx — тест на определение уровня
        LevelTasks.jsx    — задачи для закрепления уровня
    Teacher/
      Dashboard.jsx       — дашборд преподавателя
      Courses/
        Courses.jsx       — список курсов
        CourseBuilder.jsx — конструктор курса
        LessonEditor.jsx  — редактор урока
      Tasks/
        TaskLibrary.jsx   — библиотека задач (только admin)
        TaskCreator.jsx   — создание задачи
        TaskEditor.jsx    — редактирование задачи
      Groups/
        Groups.jsx        — список групп
        GroupStats.jsx    — статистика группы
    Profile/
      ProfilePage.jsx     — страница профиля (для студентов и преподавателей)
    Admin/
      Teachers.jsx        — управление преподавателями
    NotFound.jsx          — страница 404
  styles/
    index.css             — глобальные стили, CSS-переменные
    student.css           — стили для студенческого интерфейса
    teacher.css           — стили для интерфейса преподавателя
```

---

## Маршрутизация приложения

Все роуты определены в файле App.jsx. Основные маршруты:

Публичные страницы (без авторизации):
- /login — вход в систему
- /signup — регистрация
- /onboarding/goal-select — выбор цели обучения
- /onboarding/level-select — выбор уровня
- /onboarding/screening — тест на определение уровня
- /onboarding/level-tasks — задачи для закрепления

Студенческая зона (/student):
- /student/dashboard — главная страница
- /student/map — карта курсов
- /student/module/:moduleId — список уроков модуля
- /student/lesson/:lessonId — урок с задачами
- /student/tasks — список standalone-задач
- /student/progress — прогресс и статистика
- /student/join — вступление в группу
- /student/profile — профиль студента

Страница решения задач (без sidebar):
- /practice/:taskId — редактор кода, тестирование, отправка

Зона преподавателя (/teacher):
- /teacher/dashboard — дашборд
- /teacher/courses — список курсов
- /teacher/course/:courseId — конструктор курса
- /teacher/tasks — библиотека задач (только admin)
- /teacher/task/create — создание задачи
- /teacher/task/edit/:taskId — редактирование задачи
- /teacher/lesson/:lessonId/edit — редактирование урока
- /teacher/groups — управление группами
- /teacher/group/:groupId/stats — статистика группы
- /teacher/admin/teachers — управление преподавателями (только admin)
- /teacher/profile — профиль преподавателя

В зависимости от роли пользователя (student / teacher / admin) происходит автоматический редирект на соответствующую главную страницу.

---

## Работа с API

Все запросы к серверу выполняются через модуль api.js, который экспортирует объект api с методами для каждого эндпоинта.

Пример использования:
```javascript
import { api } from '../api/api';

// Вход в систему
const response = await api.login(email, password);

// Получение дашборда студента
const dashboard = await api.getStudentDashboard();

// Отправка решения задачи
const result = await api.submitTask(taskId, code);
```

JWT-токен автоматически добавляется к каждому запросу из localStorage. Базовый URL сервера: http://localhost:8000/api/v1

Список основных методов api.js:

Аутентификация:
- register(data) — регистрация
- login(email, password) — вход
- getMe() — данные текущего пользователя
- updateLevel(level) — установка уровня
- updateGoal(goal) — установка цели
- updateProfile(data) — обновление профиля (ФИО, email, пароль)
- uploadAvatar(file) — загрузка аватара

Студент:
- getStudentDashboard() — данные для главной страницы
- getStudentProgress() — прогресс по темам
- getAchievements() — полученные достижения
- getAvailableAchievements() — все достижения с прогрессом

Курсы и модули:
- getCourses() — список курсов
- getCourse(id) — курс по ID
- getModules(courseId) — модули курса
- getLessons(moduleId) — уроки модуля
- getLesson(lessonId) — урок с задачами
- getLessonProgress(moduleId) — прогресс по урокам

Задачи:
- getTasks(taskType) — список задач
- getTask(id) — задача по ID
- submitTask(taskId, code) — отправка решения
- getTaskStatus(taskId) — статус задачи (решена или нет)
- getMySubmissions(taskId) — история отправок
- runCode(code, timeout) — тестовый запуск кода

AI-помощник:
- getAIFeedback(taskDescription, studentCode, question) — запрос подсказки

Группы:
- joinGroup(invite_code) — вступить в группу
- getGroups() — список групп (для преподавателя)
- createGroup(data) — создать группу
- getGroupStudents(id) — студенты группы
- getGroupStats(id) — статистика группы

Администрирование:
- getTeachers() — список преподавателей
- createTeacher(data) — создать преподавателя
- deleteTeacher(id) — удалить преподавателя

---

## Контекст авторизации

AuthContext предоставляет глобальный доступ к данным пользователя и функциям входа/выхода.

Основные методы контекста:
- user — объект текущего пользователя (id, name, email, role, level, avatar_url)
- login(email, password) — вход в систему
- register(data) — регистрация
- logout() — выход из системы
- updateUser(updatedUser) — обновление данных пользователя в контексте

Данные пользователя сохраняются в localStorage, что позволяет сохранить сессию при перезагрузке страницы.

Пример использования:
```javascript
import { useAuth } from '../context/AuthContext';

function SomePage() {
  const { user, logout } = useAuth();
  
  return (
    <div>
      <p>Привет, {user.name}!</p>
      <button onClick={logout}>Выйти</button>
    </div>
  );
}
```

---

## Страница решения задач (Practice.jsx)

Это основная страница для работы над задачами. Интерфейс разделен на две части: редактор кода слева и панель результатов справа.

Основные функции:

1. Редактор кода:
   - Использует react-simple-code-editor с подсветкой синтаксиса через prismjs
   - Отображает starter_code задачи при первом открытии
   - Поддерживает Tab для отступов

2. Тестовый запуск (Run Code):
   - Отправляет код на сервер через POST /practice/run
   - Показывает stdout, stderr и код выхода
   - Не сохраняет результат и не влияет на прогресс

3. Отправка решения (Submit):
   - Отправляет код через POST /tasks/{id}/submit
   - Сервер проверяет вывод программы
   - При правильном решении задача помечается как решенная
   - Защита от повторной отправки: если задача уже решена, кнопка Submit неактивна

4. AI-помощник:
   - Студент может задать вопрос или запросить общую подсказку
   - При отправке вопроса AI отвечает на конкретный вопрос
   - Без вопроса AI дает структурированный фидбек по 4 блокам
   - Функция parseAiFeedback разбивает ответ на секции
   - Функция renderFeedbackText рендерит текст с поддержкой bold и inline code

5. Защита от дублирования запросов:
   - Используются useRef флаги (runInFlightRef, submitInFlightRef)
   - Предотвращает повторные запросы при быстрых кликах

Структура AI-фидбека:
```
1. Task understanding: ...
2. What is good: ...
3. What to fix now: ...
4. Next step hint: ...
```

---

## Тест на определение уровня (ScreeningTest.jsx)

Страница онбординга, где студент проходит тест для определения своего уровня владения Python.

Как это работает:

1. Задачи хранятся прямо в коде компонента (массивы INTERMEDIATE_TASKS и ADVANCED_TASKS)
2. Каждая задача содержит:
   - starterCode — код-заготовка для студента
   - testCode — код проверки, который запускается после кода студента
   - expectedOutput — ожидаемый результат testCode

3. При выполнении задачи:
   - Код студента + testCode объединяются
   - testCode окружается маркерами __PYLEARN_HARNESS_START__ и __PYLEARN_HARNESS_END__
   - Отправляется на сервер через POST /practice/run
   - Вывод testCode (между маркерами) сравнивается с expectedOutput
   - Студенту показывается только его собственный вывод (до маркера)

4. Определение уровня:
   - Для intermediate: ≤2 правильных → beginner, ≤5 → intermediate, все → advanced
   - Для advanced: ≤1 правильных → intermediate, иначе → advanced

5. Функции для обработки вывода:
   - extractHarnessOutput() — извлекает вывод testCode между маркерами
   - extractStudentOutput() — извлекает вывод кода студента до маркера
   - matchesExpectedOutput() — сравнивает с учетом повторений и хвоста

Это позволяет избежать путаницы: студент видит результат своего кода, а проверка идет по выводу тестов.

---

## Страница профиля (ProfilePage.jsx)

Единая страница для редактирования профиля студента и преподавателя. Доступна по адресу /student/profile и /teacher/profile.

Возможности:

1. Аватар пользователя:
   - Отображается текущий аватар или инициалы (если аватара нет)
   - Кнопка с иконкой камеры для загрузки нового фото
   - Поддерживаются любые форматы изображений
   - Загрузка через POST /auth/me/avatar
   - После загрузки аватар автоматически обновляется в контексте и отображается в sidebar

2. Форма личных данных:
   - ФИО (обязательное поле)
   - Email (проверяется на уникальность на сервере)
   - Уровень (только для студентов, поле только для чтения)
   - Роль (только для преподавателей, поле только для чтения)
   - Обновление через PATCH /auth/me/profile

3. Форма смены пароля:
   - Новый пароль (минимум 6 символов)
   - Подтверждение пароля (должно совпадать с новым)
   - Обновление через PATCH /auth/me/profile

4. Обработка ошибок:
   - Валидация на клиенте (пустые поля, совпадение паролей)
   - Отображение ошибок с сервера (email занят, пароль короткий)
   - Сообщения об успешном сохранении

Стили адаптированы для обоих интерфейсов (студента и преподавателя) через CSS-переменные.

---

## Отображение аватаров в интерфейсе

После добавления функции загрузки аватаров, они отображаются в двух местах:

1. StudentLayout (нижняя часть sidebar):
   - Аватар показывается в блоке user-profile
   - Если avatar_url есть — отображается как background-image
   - Если нет — показывается пустой серый круг
   - Рядом с кнопкой Logout добавлена кнопка Profile (иконка UserCircle)
   - Клик по кнопке Profile ведет на /student/profile

2. TeacherLayout (footer sidebar):
   - Аватар в блоке sidebar-user
   - Если avatar_url есть — фоновое изображение
   - Если нет — инициалы пользователя
   - Кнопка Profile перед кнопкой Logout
   - Клик ведет на /teacher/profile

Формирование URL аватара:
```javascript
const avatarSrc = user.avatar_url
  ? (user.avatar_url.startsWith('http') 
      ? user.avatar_url 
      : BASE_URL + user.avatar_url)
  : null;
```

---

## Дизайн-система

Все цвета, отступы и шрифты определены через CSS-переменные в файле index.css.

Основные переменные для студенческого интерфейса:
- --bg-student-body — фон страницы
- --bg-student-sidebar — фон сайдбара
- --bg-student-card — фон карточек
- --bg-student-active — фон активного пункта меню
- --text-student-primary — основной цвет текста
- --text-student-secondary — вторичный цвет текста
- --border-student-color — цвет границ
- --accent-student-green — акцентный зеленый

Для интерфейса преподавателя:
- --bg-teacher-body, --bg-teacher-card
- --text-teacher-primary, --text-teacher-secondary
- --border-teacher-subtle
- --accent-teacher-purple

Шрифты:
- --font-sans (Inter) — основной текст
- --font-serif (Playfair Display) — заголовки
- --font-mono (monospace) — код

Скругления и отступы:
- --radius-sm, --radius-md
- --space-xs, --space-sm, --space-md, --space-lg, --space-xl

Такой подход позволяет легко менять тему интерфейса, не трогая компоненты.

---

## Как добавить новую страницу

1. Создать компонент в соответствующей папке pages/
2. Импортировать компонент в App.jsx
3. Добавить Route в нужную секцию (студент / преподаватель / публичная)
4. Если нужен пункт меню — добавить Link в соответствующий Layout

Пример:
```javascript
// В App.jsx
import NewPage from './pages/Student/NewPage';

// В секции студента
<Route path="/student" element={<StudentLayout />}>
  <Route path="new-page" element={<NewPage />} />
</Route>

// В StudentLayout.jsx
<Link to="/student/new-page" className="nav-item">
  <Icon size={18} />
  <span>New Page</span>
</Link>
```

---

## Особенности работы с данными

1. Обновление данных при возврате на страницу:
   - StudentDashboard использует window.addEventListener('focus') для обновления данных
   - Это позволяет подхватить изменения после решения задач на другой вкладке

2. Защита маршрутов:
   - StudentLayout и TeacherLayout проверяют роль пользователя
   - При несовпадении происходит редирект на /login

3. Сохранение состояния:
   - Токен и данные пользователя хранятся в localStorage
   - При обновлении страницы AuthContext восстанавливает сессию

4. Обработка ошибок API:
   - Функция request в api.js выбрасывает исключение при ошибках
   - Компоненты ловят ошибки через try/catch и показывают сообщения пользователю

---

## Типичный сценарий работы студента

1. Регистрация на странице /signup
2. Выбор цели обучения на /onboarding/goal-select
3. Выбор уровня или прохождение теста /onboarding/screening
4. Переход на главную страницу /student/dashboard
5. Вступление в группу через /student/join (ввод invite-кода от преподавателя)
6. Просмотр карты курсов /student/map
7. Выбор модуля и урока
8. Решение задач на странице /practice/:taskId:
   - Написание кода
   - Тестовый запуск через Run Code
   - Отправка решения через Submit
   - Получение AI-подсказок при необходимости
9. Отслеживание прогресса на /student/progress
10. Просмотр достижений на /student/dashboard
11. Редактирование профиля и смена аватара на /student/profile

Все данные синхронизируются с сервером в реальном времени, прогресс сохраняется автоматически.

---

## Отличия интерфейсов студента и преподавателя

Студенческий интерфейс (зеленые акценты):
- Фокус на обучении и прогрессе
- Карта курсов, задачи, достижения
- AI-помощник для подсказок
- Статистика по темам

Интерфейс преподавателя (фиолетовые акценты):
- Управление курсами, модулями, уроками
- Создание и редактирование задач
- Управление группами студентов
- Статистика по группам

Интерфейс администратора (расширение преподавательского):
- Все функции преподавателя
- Библиотека standalone-задач
- Управление списком преподавателей
- Просмотр всех студентов

Общие элементы:
- Профиль пользователя с аватаром
- Выход из системы
- Единый дизайн с разными цветовыми схемами

---

## Заключение

Клиентская часть проекта построена на современных технологиях React и следует лучшим практикам разработки SPA-приложений. Архитектура с раздельными layouts для разных ролей обеспечивает четкое разделение функционала. Использование CSS-переменных и переиспользуемых компонентов упрощает поддержку и расширение проекта.

Вся бизнес-логика вынесена на backend, а фронтенд отвечает только за отображение данных и взаимодействие с пользователем, что соответствует принципам разделения ответственности.
