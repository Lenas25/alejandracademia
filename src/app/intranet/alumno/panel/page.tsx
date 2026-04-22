import { PanelContent } from '@/components/intranet/alumno/PanelContent'

export const metadata = {
  title: "Intranet | Panel",
  description:"Es parte de la intranet de alumnos, donde se muestra información relevante para el alumno, como notas, actividades y cursos matriculados.",
}

function Panel() {
  return (
    <div className='p-4 lg:p-8 min-h-screen'>
      <div className='max-w-7xl mx-auto'>
        <PanelContent />
      </div>
    </div>
  )
}

export default Panel