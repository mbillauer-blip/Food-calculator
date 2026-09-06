import { Link, NavLink, Route, Routes } from 'react-router-dom'
import CalculatorPage from './pages/CalculatorPage'
import BlogIndex from './pages/BlogIndex'
import BlogPost from './pages/BlogPost'
import PrivacyPolicy from './pages/PrivacyPolicy'
import NotFound from './pages/NotFound'
import './App.css'

export default function App() {
  return (
    <>
      <nav className="site-nav">
        <div className="site-nav-inner">
          <NavLink to="/" end className="site-nav-brand">
            Party Food Calculator
          </NavLink>
          <div className="site-nav-links">
            <NavLink to="/" end className={({ isActive }) => (isActive ? 'active' : '')}>
              Calculator
            </NavLink>
            <NavLink to="/blog" className={({ isActive }) => (isActive ? 'active' : '')}>
              Blog
            </NavLink>
          </div>
        </div>
      </nav>
      <Routes>
        <Route path="/" element={<CalculatorPage />} />
        <Route path="/blog" element={<BlogIndex />} />
        <Route path="/blog/:slug" element={<BlogPost />} />
        <Route path="/privacy" element={<PrivacyPolicy />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
      <footer className="site-footer">
        <Link to="/privacy">Privacy Policy</Link>
      </footer>
    </>
  )
}
