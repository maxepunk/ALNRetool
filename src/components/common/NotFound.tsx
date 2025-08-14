/**
 * 404 Not Found component
 * Displayed when user navigates to an unknown route
 */

import { Link } from 'react-router-dom'
import styles from './NotFound.module.css'

export default function NotFound() {
  return (
    <div className={styles.container}>
      <h1 className={styles.title}>404</h1>
      <p className={styles.message}>Page not found</p>
      <p className={styles.description}>
        The page you&apos;re looking for doesn&apos;t exist or has been moved.
      </p>
      <Link to="/" className={styles.homeLink}>
        Go to Home
      </Link>
    </div>
  )
}