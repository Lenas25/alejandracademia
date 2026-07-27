import { IconUsersGroup, IconBook, IconLayoutDashboardFilled, IconLayoutGrid, IconCertificate } from '@tabler/icons-react';

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
  href: "/intranet/admin/constancia",
  icon: IconCertificate,
  label: "Constancia",
  pathRoute: '/constancia'
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
  href: "/intranet/admin/secciones",
  icon: IconLayoutGrid,
  label: "Secciones",
  pathRoute: '/secciones'
}];