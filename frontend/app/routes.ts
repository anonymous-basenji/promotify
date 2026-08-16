import { type RouteConfig, index, route } from "@react-router/dev/routes";

export default [
  index("routes/_index.tsx"),
  route("login", "routes/login.tsx"),
  route("teams", "routes/teams.tsx"),
  route("teams/:teamId", "routes/teams.$teamId.tsx"),
] satisfies RouteConfig;
