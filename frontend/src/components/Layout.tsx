import { useState, type ChangeEvent } from 'react'
import { Link, Outlet } from 'react-router-dom'
import { getUserId, setUserId } from '../auth/identity'

export default function Layout() {
  const [userId, setUserIdState] = useState(getUserId())

  function handleChange(event: ChangeEvent<HTMLInputElement>) {
    setUserIdState(event.target.value)
    setUserId(event.target.value)
  }

  return (
    <>
      <nav
        style={{
          display: 'flex',
          gap: 'var(--spacing-gutter)',
          alignItems: 'center',
          marginBottom: 'var(--spacing-section-gap)',
        }}
      >
        <Link to="/">Menu</Link>
        <Link to="/orders">My Orders</Link>
        <Link to="/admin">Admin</Link>
        <span style={{ marginLeft: 'auto', display: 'flex', gap: 'var(--spacing-unit)', alignItems: 'center' }}>
          <label htmlFor="sign-in-as-input">Sign in as</label>
          <input
            id="sign-in-as-input"
            value={userId}
            onChange={handleChange}
            placeholder="employee id"
          />
        </span>
      </nav>
      <Outlet />
    </>
  )
}
