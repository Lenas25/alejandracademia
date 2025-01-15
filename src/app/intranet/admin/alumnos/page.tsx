import { TableAlumnos } from "@/components"

export const metadata = {
  title: "Intranet | Alumnos",
  description:"Es parte de la intranet de administradores donde se pueden ver los alumnos registrados en la plataforma.",
}


function Alumnos() {
  return (
      <TableAlumnos />
  )
}

export default Alumnos