/**
 * Character Journey View
 * Character timeline with element connections
 */

import { useParams } from 'react-router-dom'

export default function CharacterJourneyView() {
  const { characterId } = useParams()

  return (
    <div data-testid="character-journey-view">
      <h2>Character Journey View</h2>
      {characterId && <span data-testid="character-id">{characterId}</span>}
      <p>Character timeline and connections will be displayed here.</p>
    </div>
  )
}