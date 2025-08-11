import LoveTimer from './LoveTimer'

export default function About() {
  return (
    <div className="container-page py-8 space-y-8">
      <LoveTimer />
      
      <div className="prose prose-sm sm:prose lg:prose-lg dark:prose-invert max-w-none">
        <h2>Saku & Divya</h2>
        <p>
          This is our little corner to save smiles, moments, and memories. A timeless scrapbook for photos, videos, and words.
        </p>
        <h3>Timeline</h3>
        <ul>
          <li>First hello — A spark that started it all.</li>
          <li>First date — Butterflies, laughter, and stories.</li>
          <li>Adventures — Trips, sunsets, and cozy nights in.</li>
        </ul>
        <blockquote>"In a sea of people, my eyes will always search for you."</blockquote>
      </div>
    </div>
  )
}
