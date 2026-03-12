const BASE_URL = "http://localhost:8000/api/v1";

function getToken() {
  return localStorage.getItem("token");
}

async function request(method, path, body = null) {
  const headers = { "Content-Type": "application/json" };
  const token = getToken();
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const options = { method, headers };
  if (body) options.body = JSON.stringify(body);

  const res = await fetch(`${BASE_URL}${path}`, options);

  if (res.status === 204) return null;

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.detail || "Request failed");
  }
  return data;
}

export const api = {
  // Auth
  register: (data) => request("POST", "/auth/register", data),
  login: (email, password) => request("POST", "/auth/login", { email, password }),
  getMe: () => request("GET", "/auth/me"),
  updateLevel: (level) => request("PATCH", "/auth/me/level", { level }),
  updateGoal: (goal) => request("PATCH", "/auth/me/goal", { learning_goal: goal }),
  updateProfile: (data) => request("PATCH", "/auth/me/profile", data),
  uploadAvatar: async (file) => {
    const formData = new FormData();
    formData.append('file', file);
    const token = localStorage.getItem('token');
    const res = await fetch(`${BASE_URL}/auth/me/avatar`, {
      method: 'POST',
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body: formData,
    });
    if (!res.ok) {
      const data = await res.json();
      throw new Error(data.detail || 'Upload failed');
    }
    return res.json();
  },

  // Student
  getStudentDashboard: () => request("GET", "/students/dashboard"),
  getStudentProgress: () => request("GET", "/students/progress"),
  getAchievements: () => request("GET", "/students/achievements"),
  getAvailableAchievements: () => request("GET", "/students/available-achievements"),

  // Courses
  getCourses: () => request("GET", "/courses"),
  createCourse: (data) => request("POST", "/courses", data),
  getCourse: (id) => request("GET", `/courses/${id}`),
  updateCourse: (id, data) => request("PATCH", `/courses/${id}`, data),
  deleteCourse: (id) => request("DELETE", `/courses/${id}`),

  // Modules
  getModules: (courseId) => request("GET", `/courses/${courseId}/modules`),
  createModule: (courseId, data) => request("POST", `/courses/${courseId}/modules`, data),
  updateModule: (moduleId, data) => request("PATCH", `/courses/modules/${moduleId}`, data),
  deleteModule: (moduleId) => request("DELETE", `/courses/modules/${moduleId}`),

  // Lessons
  getLessons: (moduleId) => request("GET", `/courses/modules/${moduleId}/lessons`),
  getLessonProgress: (moduleId) => request("GET", `/courses/modules/${moduleId}/lesson-progress`),
  createLesson: (moduleId, data) => request("POST", `/courses/modules/${moduleId}/lessons`, data),
  getLesson: (lessonId) => request("GET", `/courses/lessons/${lessonId}`),
  updateLesson: (lessonId, data) => request("PATCH", `/courses/lessons/${lessonId}`, data),
  deleteLesson: (lessonId) => request("DELETE", `/courses/lessons/${lessonId}`),

  // Tasks
  getTasks: (taskType = null) => request("GET", taskType ? `/tasks?task_type=${taskType}` : "/tasks"),
  getTopics: () => request("GET", "/tasks/topics"),
  createTask: (data) => request("POST", "/tasks", data),
  getTask: (id) => request("GET", `/tasks/${id}`),
  updateTask: (id, data) => request("PATCH", `/tasks/${id}`, data),
  deleteTask: (id) => request("DELETE", `/tasks/${id}`),
  submitTask: (taskId, code) => request("POST", `/tasks/${taskId}/submit`, { task_id: taskId, code }),
  getTaskStatus: (taskId) => request("GET", `/tasks/${taskId}/status`),
  getMySubmissions: (taskId) => request("GET", `/tasks/${taskId}/my-submissions`),

  // Groups
  getGroups: () => request("GET", "/groups"),
  createGroup: (data) => request("POST", "/groups", data),
  getGroup: (id) => request("GET", `/groups/${id}`),
  deleteGroup: (id) => request("DELETE", `/groups/${id}`),
  getGroupStudents: (id) => request("GET", `/groups/${id}/students`),
  getGroupStats: (id) => request("GET", `/groups/${id}/stats`),
  joinGroup: (invite_code) => request("POST", "/groups/join", { invite_code }),

  // AI
  getAIFeedback: (taskDescription, studentCode, question = null) =>
    request("POST", "/ai/feedback", {
      task_description: taskDescription,
      student_code: studentCode,
      question,
    }),

  // Practice - Code Execution
  runCode: (code, timeout = 5) =>
    request("POST", "/practice/run", { code, timeout }),

  // Admin
  getTeachers: () => request("GET", "/admin/teachers"),
  createTeacher: (data) => request("POST", "/admin/teachers", data),
  deleteTeacher: (id) => request("DELETE", `/admin/teachers/${id}`),
  getAllStudents: () => request("GET", "/admin/students"),
};
