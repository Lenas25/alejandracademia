import { Bienvenida, Calendario, CursoCard, NotasCard, PromedioCard } from '@/components'
import React from 'react'

export const metadata = {
  title: "Intranet | Panel",
  description:"Es parte de la intranet de alumnos, donde se muestra información relevante para el alumno, como notas, actividades y cursos matriculados.",
}

function Panel() {
  return (
    <div className='lg:p-8 min-h-screen'>
      <div className='max-w-7xl mx-auto space-y-6'>
        
        {/* 1. Fila de Bienvenida */}
        <Bienvenida />

        {/* 2. Fila de Curso y Calendario */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <CursoCard />
          </div>
          <div className="lg:col-span-1">
            <Calendario />
          </div>
        </div>

        {/* 3. Fila de Promedio y Notas */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1">
            <PromedioCard />
          </div>
          <div className="lg:col-span-2">
            <NotasCard />
          </div>
        </div>

      </div>
    </div>
  )
}

export default Panel