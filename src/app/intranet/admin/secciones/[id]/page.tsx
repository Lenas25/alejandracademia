import { SectionDetail } from "@/components"

export const metadata = {
  title: "Intranet | Detalle de Sección",
  description: "Es parte de la intranet de administradores donde se ve el detalle de una sección: estudiantes, pagos y asistencia.",
}

async function SeccionDetalle({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <SectionDetail sectionId={Number(id)} />
}

export default SeccionDetalle
