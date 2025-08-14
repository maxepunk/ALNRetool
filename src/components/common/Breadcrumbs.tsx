/**
 * Breadcrumbs component
 * Shows current navigation path
 */

import { Link, useLocation } from 'react-router-dom'
import styles from './Breadcrumbs.module.css'

export default function Breadcrumbs() {
  const location = useLocation()
  const pathnames = location.pathname.split('/').filter(x => x)

  // Don't show breadcrumbs on root or single-level paths
  if (pathnames.length <= 1) {
    return null
  }

  return (
    <nav aria-label="Breadcrumb" className={styles.breadcrumbs}>
      <ol className={styles.list}>
        <li className={styles.item}>
          <Link to="/" className={styles.link}>
            Home
          </Link>
        </li>
        {pathnames.map((value, index) => {
          const to = `/${pathnames.slice(0, index + 1).join('/')}`
          const isLast = index === pathnames.length - 1
          const label = value.charAt(0).toUpperCase() + value.slice(1)

          return (
            <li key={to} className={styles.item}>
              <span className={styles.separator}>/</span>
              {isLast ? (
                <span className={styles.current}>{label}</span>
              ) : (
                <Link to={to} className={styles.link}>
                  {label}
                </Link>
              )}
            </li>
          )
        })}
      </ol>
    </nav>
  )
}