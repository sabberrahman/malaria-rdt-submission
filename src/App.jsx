import { useState } from 'react'
import './App.css'
import RdtBsc from './page/RDTForm'
import Header from './page/Header'

function App() {
  const [count, setCount] = useState(0)

  return (
    <>
      <Header />
      <RdtBsc />
    </>
  )
}

export default App