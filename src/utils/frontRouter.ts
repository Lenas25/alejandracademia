import { IconUsersGroup, IconBook, IconClipboardList, IconStarsFilled, IconLayoutDashboardFilled } from '@tabler/icons-react';

export const AlumnoRoutes = [{
  id: 1,
  href: "./panel",
  icon: IconLayoutDashboardFilled,
  label: "Panel",
  pathRoute: '/panel'
}];

export const AdminRoutes = [{
  id: 1,
  href: "../admin/alumnos",
  icon: IconUsersGroup,
  label: "Alumnos",
  pathRoute: '/alumnos'
},
{
  id: 2,
  href: "../admin/cursos",
  icon: IconBook,
  label: "Cursos",
  pathRoute: '/cursos'
},
{
  id: 3,
  href: "../admin/asignar",
  icon: IconClipboardList,
  label: "Asignar",
  pathRoute: '/asignar'
},
{
  id: 4,
  href: "../admin/notas",
  icon: IconStarsFilled,
  label: "Notas",
  pathRoute: '/notas'
}];

export const TutorRoutes = [{
  id: 1,
  href: "../admin/cursos",
  icon: IconBook,
  label: "Cursos",
  pathRoute: '/cursos'
},
{
  id: 2,
  href: "../admin/notas",
  icon: IconStarsFilled,
  label: "Notas",
  pathRoute: '/notas'
}];