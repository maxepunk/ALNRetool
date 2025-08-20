/**
 * Main application router
 * Handles all route definitions and lazy loading of views
 */

import { lazy, Suspense } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import AppLayout from '@/components/layout/AppLayout'
import LoadingSpinner from '@/components/common/LoadingSpinner'
import NotFound from '@/components/common/NotFound'
import ErrorBoundary from '@/components/common/ErrorBoundary'

// Lazy load the main views for code splitting
const PuzzleFocusView = lazy(() => import('@/views/PuzzleFocusView'))
const CharacterJourneyView = lazy(() => import('@/views/CharacterJourneyView'))
const ContentStatusView = lazy(() => import('@/views/ContentStatusView'))

/**
 * AppRouter component
 * Defines all application routes and handles navigation
 */
export default function AppRouter() {
  return (
    <ErrorBoundary>
      <Routes>
        <Route path="/" element={<AppLayout />}>
          {/* Default redirect to puzzles view */}
          <Route index element={<Navigate to="/puzzles" replace />} />
          
          {/* Main application views with nested routes for collection/detail separation */}
          <Route path="puzzles">
            <Route
              index
              element={
                <Suspense fallback={<LoadingSpinner message="Loading Puzzles..." />}>
                  <PuzzleFocusView />
                </Suspense>
              }
            />
            <Route
              path=":puzzleId"
              element={
                <Suspense fallback={<LoadingSpinner message="Loading Puzzle Details..." />}>
                  <PuzzleFocusView />
                </Suspense>
              }
            />
          </Route>
          
          <Route path="character-journey">
            <Route
              index
              element={
                <Suspense fallback={<LoadingSpinner message="Loading Characters..." />}>
                  <CharacterJourneyView />
                </Suspense>
              }
            />
            <Route
              path=":characterId"
              element={
                <Suspense fallback={<LoadingSpinner message="Loading Character Details..." />}>
                  <CharacterJourneyView />
                </Suspense>
              }
            />
          </Route>
          
          <Route
            path="status"
            element={
              <Suspense fallback={<LoadingSpinner message="Loading Status..." />}>
                <ContentStatusView />
              </Suspense>
            }
          />
          
          {/* 404 handler */}
          <Route path="*" element={<NotFound />} />
        </Route>
      </Routes>
    </ErrorBoundary>
  )
}