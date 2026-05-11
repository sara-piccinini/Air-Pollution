export default function LandingPage({ onEnter }: { onEnter: () => void }) {
  return (
    <div className="landing-container">
      <div className="landing-content">
        <h1 className="landing-title">Air Pollution Comparator</h1>
        
        <div className="planet-container" onClick={onEnter}>
          <svg className="planet" viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
            {/* Planet sphere with gradient */}
            <defs>
              <radialGradient id="planetGradient" cx="35%" cy="35%">
                <stop offset="0%" stopColor="#87CEEB" stopOpacity="1" />
                <stop offset="70%" stopColor="#4A90E2" stopOpacity="1" />
                <stop offset="100%" stopColor="#1E3A8A" stopOpacity="1" />
              </radialGradient>
              
              <filter id="shadow">
                <feGaussianBlur in="SourceGraphic" stdDeviation="3" />
              </filter>
            </defs>
            
            {/* Main planet circle */}
            <circle cx="100" cy="100" r="90" fill="url(#planetGradient)" filter="url(#shadow)" />
            
            {/* Continents */}
            <g fill="#2D5016" opacity="0.8">
              {/* North America */}
              <path d="M 40 70 Q 50 60 60 70 Q 55 85 40 90 Z" />
              {/* South America */}
              <path d="M 50 95 Q 60 90 65 105 Q 55 115 45 110 Z" />
              {/* Africa */}
              <path d="M 100 80 Q 115 75 120 95 Q 110 110 95 105 Z" />
              {/* Europe */}
              <path d="M 85 60 Q 100 55 105 70 Q 95 75 85 70 Z" />
              {/* Asia */}
              <path d="M 120 60 Q 145 65 150 85 Q 135 90 120 80 Z" />
              {/* Australia */}
              <path d="M 135 120 Q 145 115 148 130 Q 140 135 130 130 Z" />
            </g>
            
            {/* Oceans highlights */}
            <g fill="#87CEEB" opacity="0.3">
              <circle cx="60" cy="130" r="15" />
              <circle cx="140" cy="60" r="20" />
            </g>
            
            {/* Atmospheric glow */}
            <circle cx="100" cy="100" r="95" fill="none" stroke="#87CEEB" strokeWidth="3" opacity="0.3" />
          </svg>
          
          <p className="click-hint">Click on the planet to enter</p>
        </div>
      </div>
    </div>
  )
}
