import { Routes, Route } from 'react-router-dom'
import Layout from './components/Layout'
import MenuPage from './routes/MenuPage'
import MyOrdersPage from './routes/MyOrdersPage'
import AdminPage from './routes/AdminPage'

function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<MenuPage />} />
        <Route path="/orders" element={<MyOrdersPage />} />
        <Route path="/admin" element={<AdminPage />} />
      </Route>
    </Routes>
  )
}

export default App
