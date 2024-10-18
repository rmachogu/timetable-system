import {
  query,
  update,
  text,
  Null,
  Record,
  StableBTreeMap,
  Variant,
  Vec,
  None,
  Some,
  Ok,
  Err,
  ic,
  Principal,
  Opt,
  Result,
  nat64,
  bool,
  Canister,
} from "azle";
import { v4 as uuidv4 } from "uuid";

// UserRole Enum
const UserRole = Variant({
  Student: Null,
  Instructor: Null,
  Admin: Null,
});

// User Struct
const User = Record({
  id: text,
  owner: Principal,
  username: text,
  password: text,
  role: UserRole,
  email: text,
  created_at: text,
});

// Course Struct
const Course = Record({
  id: text,
  name: text,
  duration_years: nat64,
  required_equipment: text,
  prerequisites: Vec(text),
});

// Instructor Struct
const Instructor = Record({
  id: text,
  name: text,
  availability: Vec(text),
  preferred_times: Vec(text),
});

// Classroom Struct
const Classroom = Record({
  id: text,
  name: text,
  capacity: nat64,
  equipment: text,
});

// Timetable Struct
const Timetable = Record({
  id: text,
  course_id: text,
  instructor_id: text,
  classroom_id: text,
  time_slot: text,
});

// Message to represent error or success messages
const Message = Variant({
  Success: text,
  Error: text,
  NotFound: text,
  InvalidPayload: text,
});

// Storage initialization using StableBTreeMap
const courseStorage = StableBTreeMap(0, text, Course);
const instructorStorage = StableBTreeMap(1, text, Instructor);
const classroomStorage = StableBTreeMap(2, text, Classroom);
const timetableStorage = StableBTreeMap(3, text, Timetable);
const userStorage = StableBTreeMap(4, text, User);

// Payloads
// User Management
const UserPayload = Record({
  username: text,
  password: text,
  email: text,
  role: UserRole,
});

// Course Management
const CoursePayload = Record({
  name: text,
  duration_years: nat64,
  required_equipment: text,
  prerequisites: Vec(text),
});

// Instructor Management
const InstructorPayload = Record({
  name: text,
  availability: Vec(text),
  preferred_times: Vec(text),
});

// Classroom Management
const ClassroomPayload = Record({
  name: text,
  capacity: nat64,
  equipment: text,
});

// Timetable Management
const TimetablePayload = Record({
  course_id: text,
  instructor_id: text,
  classroom_id: text,
  time_slot: text,
});

// Helper Functions
function currentTime(): string {
  return new Date().toISOString();
}

function isEmailUnique(email: string): boolean {
  return !userStorage.values().some((user) => user.email === email);
}

export default Canister({
  // Create a new user
  createUser: update([UserPayload], Result(User, Message), (payload) => {
    if (!payload.username || !payload.password || !payload.email) {
      return Err({
        InvalidPayload:
          "Ensure 'username', 'password', and 'email' are provided.",
      });
    }

    // Validate the email address
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailRegex.test(payload.email)) {
      return Err({ Error: "Invalid email address." });
    }

    // Check if email is unique
    if (!isEmailUnique(payload.email)) {
      return Err({ Error: "Email address already exists." });
    }

    // Validate the password to ensure it is strong
    const passwordRegex = /^(?=.*\d)(?=.*[a-z])(?=.*[A-Z]).{6,20}$/;

    if (!passwordRegex.test(payload.password)) {
      return Err({
        Error:
          "Password must be between 6 to 20 characters and contain at least one numeric digit, one uppercase and one lowercase letter.",
      });
    }

    // Create a new user
    const userId = uuidv4();
    const user = {
      id: userId,
      username: payload.username,
      password: payload.password,
      email: payload.email,
      role: payload.role,
      owner: ic.caller(),
      created_at: currentTime(),
    };

    userStorage.insert(userId, user);
    return Ok(user);
  }),

  // Get user by id
  getUser: query([text], Result(User, Message), (userId) => {
    const userOpt = userStorage.get(userId);
    if ("None" in userOpt) {
      return Err({ NotFound: `User with id ${userId} not found.` });
    }
    return Ok(userOpt.Some);
  }),

  // Fetch user by email
  getUserByEmail: query([text], Result(User, Message), (email) => {
    const user = userStorage.values().find((user) => user.email === email);
    if (!user) {
      return Err({ NotFound: `User with email ${email} not found.` });
    }
    return Ok(user);
  }),

  // Fetch user by username
  getUserByUsername: query([text], Result(User, Message), (username) => {
    const user = userStorage
      .values()
      .find((user) => user.username === username);
    if (!user) {
      return Err({ NotFound: `User with username ${username} not found.` });
    }
    return Ok(user);
  }),

  // Get list of users
  getUsers: query([], Result(Vec(User), Message), () => {
    const users = userStorage.values();
    if (users.length === 0) {
      return Err({ NotFound: "No users found." });
    }
    return Ok(users);
  }),

  // Change user role
  changeUserRole: update(
    [text, UserRole],
    Result(User, Message),
    (userId, role) => {
      const userOpt = userStorage.get(userId);
      if ("None" in userOpt) {
        return Err({ NotFound: "User not found." });
      }

      const user = userOpt.Some;
      const updatedUser = { ...user, role };
      userStorage.insert(userId, updatedUser);

      return Ok(updatedUser);
    }
  ),

  // Create a new course
  createCourse: update([CoursePayload], Result(Course, Message), (payload) => {
    if (!payload.name) {
      return Err({
        InvalidPayload: "Ensure 'name' and 'duration_years' are provided.",
      });
    }

    const courseId = uuidv4();
    const course = { ...payload, id: courseId };

    courseStorage.insert(courseId, course);
    return Ok(course);
  }),

  // Get course by name
  getCourseByName: query([text], Result(Course, Message), (name) => {
    const course = courseStorage
      .values()
      .find((course) => course.name === name);
    if (!course) {
      return Err({ NotFound: `Course with name ${name} not found.` });
    }
    return Ok(course);
  }),

  // Get list of courses
  getCourses: query([], Result(Vec(Course), Message), () => {
    const courses = courseStorage.values();
    if (courses.length === 0) {
      return Err({ NotFound: "No courses found." });
    }
    return Ok(courses);
  }),

  // Create a new instructor
  createInstructor: update(
    [InstructorPayload],
    Result(Instructor, Message),
    (payload) => {
      if (!payload.name) {
        return Err({
          InvalidPayload: "Ensure 'name' is provided.",
        });
      }

      const instructorId = uuidv4();

      const instructor = { ...payload, id: instructorId };

      instructorStorage.insert(instructorId, instructor);

      return Ok(instructor);
    }
  ),

  // Get instructor by name
  getInstructorByName: query([text], Result(Instructor, Message), (name) => {
    const instructor = instructorStorage
      .values()
      .find((instructor) => instructor.name === name);
    if (!instructor) {
      return Err({ NotFound: `Instructor with name ${name} not found.` });
    }
    return Ok(instructor);
  }),

  // Get available instructors
  getAvailableInstructors: query(
    [text],
    Result(Vec(Instructor), Message),
    (timeSlot) => {
      const instructors = instructorStorage
        .values()
        .filter((instructor) => instructor.availability.includes(timeSlot));
      if (instructors.length === 0) {
        return Err({ NotFound: "No instructors found." });
      }
      return Ok(instructors);
    }
  ),

  // Get list of instructors
  getInstructors: query([], Result(Vec(Instructor), Message), () => {
    const instructors = instructorStorage.values();
    if (instructors.length === 0) {
      return Err({ NotFound: "No instructors found." });
    }
    return Ok(instructors);
  }),

  // Create a new classroom
  createClassroom: update(
    [ClassroomPayload],
    Result(Classroom, Message),
    (payload) => {
      if (!payload.name) {
        return Err({
          InvalidPayload: "Ensure 'name' is provided.",
        });
      }

      const classroomId = uuidv4();

      const classroom = { ...payload, id: classroomId };

      classroomStorage.insert(classroomId, classroom);

      return Ok(classroom);
    }
  ),

  // Get list of classrooms
  getClassrooms: query([], Result(Vec(Classroom), Message), () => {
    const classrooms = classroomStorage.values();
    if (classrooms.length === 0) {
      return Err({ NotFound: "No classrooms found." });
    }
    return Ok(classrooms);
  }),

  // Create a new timetable
  createTimetable: update(
    [TimetablePayload],
    Result(Timetable, Message),
    (payload) => {
      if (
        !payload.course_id ||
        !payload.instructor_id ||
        !payload.classroom_id
      ) {
        return Err({
          InvalidPayload:
            "Ensure 'course_id', 'instructor_id', and 'classroom_id' are provided.",
        });
      }

      const timetableId = uuidv4();

      const timetable = { ...payload, id: timetableId };

      timetableStorage.insert(timetableId, timetable);

      return Ok(timetable);
    }
  ),

  // Get list of timetables
  getTimetables: query([], Result(Vec(Timetable), Message), () => {
    const timetables = timetableStorage.values();
    if (timetables.length === 0) {
      return Err({ NotFound: "No timetables found." });
    }
    return Ok(timetables);
  }),

  // Auto-generate timetables (simplified example)
  createAutoTimetable: update([], Result(Vec(Timetable), Message), () => {
    const courses = courseStorage.values();
    const instructors = instructorStorage.values();
    const classrooms = classroomStorage.values();
    const generatedTimetables = [];

    for (const course of courses) {
      for (const instructor of instructors) {
        for (const classroom of classrooms) {
          const timetableId = uuidv4();
          const timetable = {
            id: timetableId,
            course_id: course.id,
            instructor_id: instructor.id,
            classroom_id: classroom.id,
            time_slot: "08:00-10:00", // Example time slot
          };
          generatedTimetables.push(timetable);
          timetableStorage.insert(timetableId, timetable);
        }
      }
    }

    return Ok(generatedTimetables);
  }),
});
