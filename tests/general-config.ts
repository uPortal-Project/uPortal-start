export const config = {
  url: "http://localhost:8080/uPortal/",
  users: {
    admin: {
      id: "13",
      username: "admin",
      password: "admin",
      displayName: "Amy Administrator",
    },
    staff: {
      id: "xx",
      username: "staff",
      password: "staff",
      displayName: "Samuel Staff",
    },
    student: {
      id: "29",
      username: "student",
      password: "student",
      displayName: "Steven Student",
    },
  },
  formats: {
    auditDateTimeTz: /^(\d{4})-(\d{2})-(\d{2}) (\d{2}):(\d{2}):(\d{2}) \+(\d{4})$/,
  }
};
