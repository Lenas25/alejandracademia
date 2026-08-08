import { AlumnoDetail } from "@/components"

export const metadata = {
  title: "Intranet | Historial del Alumno",
  description: "Es parte de la intranet de administradores donde se ve el historial de matrículas y notas de un alumno.",
}

async function AlumnoHistorial({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <AlumnoDetail userId={id} />
}

export default AlumnoHistorial
