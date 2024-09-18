export const config = {
  url: "http://localhost:8080/uPortal/",
  users: {
    admin: {
      id: "13",
      username: "admin",
      // eslint-disable-next-line sonarjs/no-hardcoded-credentials
      password: "admin",
      displayName: "Amy Administrator",
    },
    staff: {
      id: "xx",
      username: "staff",
      // eslint-disable-next-line sonarjs/no-hardcoded-credentials
      password: "staff",
      displayName: "Samuel Staff",
    },
    faculty: {
      id: "xx",
      username: "faculty",
      // eslint-disable-next-line sonarjs/no-hardcoded-credentials
      password: "faculty",
      displayName: "Felicia Faculty",
    },
    student: {
      id: "29",
      username: "student",
      // eslint-disable-next-line sonarjs/no-hardcoded-credentials
      password: "student",
      displayName: "Steven Student",
    },
  },
  formats: {
    auditDateTimeTz:
      /^(\d{4})-(\d{2})-(\d{2}) (\d{2}):(\d{2}):(\d{2}) \+(\d{4})$/,
  },
};
