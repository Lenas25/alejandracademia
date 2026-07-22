import { IconUsersGroup, IconBook, IconClipboardList, IconStarsFilled, IconLayoutDashboardFilled, IconLayoutGrid } from '@tabler/icons-react';

export const AlumnoRoutes = [{
  id: 1,
  href: "/intranet/alumno/panel",
  icon: IconLayoutDashboardFilled,
  label: "Panel",
  pathRoute: '/panel'
}];

export const AdminRoutes = [{
  id: 1,
  href: "/intranet/admin/alumnos",
  icon: IconUsersGroup,
  label: "Alumnos",
  pathRoute: '/alumnos'
},
{
  id: 2,
  href: "/intranet/admin/cursos",
  icon: IconBook,
  label: "Cursos",
  pathRoute: '/cursos'
},
{
  id: 3,
  href: "/intranet/admin/secciones",
  icon: IconLayoutGrid,
  label: "Secciones",
  pathRoute: '/secciones'
},
{
  id: 4,
  href: "/intranet/admin/asignar",
  icon: IconClipboardList,
  label: "Asignar",
  pathRoute: '/asignar'
},
{
  id: 5,
  href: "/intranet/admin/notas",
  icon: IconStarsFilled,
  label: "Notas",
  pathRoute: '/notas'
}];

export const TutorRoutes = [{
  id: 1,
  href: "/intranet/admin/cursos",
  icon: IconBook,
  label: "Cursos",
  pathRoute: '/cursos'
},
{
  id: 2,
  href: "/intranet/admin/notas",
  icon: IconStarsFilled,
  label: "Notas",
  pathRoute: '/notas'
}];