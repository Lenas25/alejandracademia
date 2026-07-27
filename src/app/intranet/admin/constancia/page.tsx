import { ConstanciaConfigurator } from "@/components"

export const metadata = {
  title: "Intranet | Constancia",
  description: "Es parte de la intranet de administradores donde se configura el contenido de la constancia de calificaciones (PDF) y se previsualiza en tiempo real antes de guardar",
}


function Constancia() {
  return (
      <ConstanciaConfigurator />
  )
}

export default Constancia
