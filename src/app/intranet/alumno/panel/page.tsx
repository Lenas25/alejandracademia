
import { Bienvenida, Calendario, CursoCard, NotasCard, PromedioCard } from '@/components'
import React from 'react'

export const metadata = {
  title: "Intranet | Panel",
  description:"Es parte de la intranet de alumnos, donde se muestra información relevante para el alumno, como notas, actividades y cursos matriculados.",
}

function Panel() {
  return (
    <div className='grid gap-5 lg:grid-cols-3 lg:grid-rows-2 lg:h-full'>
      <Calendario/>
      <Bienvenida />
      <CursoCard />
      <PromedioCard />
      <NotasCard />
    </div>
  )
}

export default Panel