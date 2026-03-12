// Моки для API запросов
export const mockApi = {
  // Авторизация
  login: async (email, password) => {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          token: "mock-jwt-token-123",
          user: {
            id: 1,
            name: email.includes("teacher") ? "Teacher Admin" : "Amir Zhakupov",
            email: email,
            role: email.includes("teacher") ? "teacher" : "student"
          }
        });
      }, 800);
    });
  },

  // Получение данных дашборда студента
  getStudentDashboard: async () => {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          streak: 14,
          modules: [
            { id: 1, title: "Data Types & Variables", status: "completed", date: "Oct 12", score: 98 },
            { id: 2, title: "Control Flow Logic", status: "completed", date: "Oct 15", score: 92 },
            { id: 3, title: "Functions & Scope", status: "in_progress", progress: "3/5 Lessons" },
            { id: 4, title: "Object Oriented Programming", status: "locked", req: "Functions" }
          ],
          skills: {
            syntax: 95,
            algorithms: 60,
            debugging: 42
          },
          tasks: [
            { id: 1, title: 'Complete "Lambda Expressions" quiz', due: "Today" },
            { id: 2, title: "Review feedback on Project 2", due: "Tomorrow" }
          ]
        });
      }, 500);
    });
  },

  // Отправка кода на проверку ИИ
  askAIFeedback: async (code, taskId) => {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          type: "hint",
          message: "Great logic! Your solution works correctly with O(n) time complexity. However, Python offers a more concise way to write this using list comprehensions.",
          code: "return [num for num in numbers if num % 2 == 0]"
        });
      }, 1500);
    });
  },

  // Получение групп учителя
  getTeacherGroups: async () => {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve([
          { id: 1, name: 'Python Basics - Fall 2025', students: 24, inviteCode: 'py-fall-25-xyz' },
          { id: 2, name: 'Advanced Algorithms', students: 15, inviteCode: 'adv-alg-abc' }
        ]);
      }, 600);
    });
  }
};
