"use client";

import { Provider } from 'react-redux'
import { globalStore } from './stores'

function ProviderComp({children}:{children: React.ReactNode}) {
  return (
    <Provider store={globalStore}>
      {children}
    </Provider>
  )
}

export default ProviderComp