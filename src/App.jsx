import { useEffect, useMemo, useRef, useState } from 'react'
import { MapContainer, Marker, Polyline, TileLayer, Tooltip, useMap } from 'react-leaflet'
import L from 'leaflet'
import {
  ArcElement,
  CategoryScale,
  Chart as ChartJS,
  Legend,
  LinearScale,
  LineElement,
  PointElement,
  Tooltip as ChartTooltip,
} from 'chart.js'
import { Doughnut, Line } from 'react-chartjs-2'
import {
  Bot,
  Moon,
  RefreshCw,
  Search,
  Send,
  Sparkles,
  Sun,
  Trash2,
  X,
} from 'lucide-react'
import './App.css'

ChartJS.register(
  ArcElement,
  CategoryScale,
  ChartTooltip,
  Legend,
  LinearScale,
  LineElement,
  PointElement,
)

const ISS_CACHE_KEY = 'iss-dashboard-positions'
const SPEED_CACHE_KEY = 'iss-dashboard-speeds'
const NEWS_CACHE_KEY = 'iss-dashboard-news'
const CHAT_CACHE_KEY = 'iss-dashboard-chat'
const THEME_CACHE_KEY = 'iss-dashboard-theme'
const NEWS_TTL = 15 * 60 * 1000
const ISS_INTERVAL = 15 * 1000
const openNotifyIssUrl = 'http://api.open-notify.org/iss-now.json'
const openNotifyAstrosUrl = 'http://api.open-notify.org/astros.json'
const proxyUrl = (url) => `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`

const categories = [
  { id: 'space', label: 'Space', color: '#2563eb' },
  { id: 'science', label: 'Science', color: '#16a34a' },
]

const cityAnchors = [
  ['New York', 40.7128, -74.006],
  ['London', 51.5072, -0.1276],
  ['Paris', 48.8566, 2.3522],
  ['Tokyo', 35.6762, 139.6503],
  ['Delhi', 28.6139, 77.209],
  ['Sydney', -33.8688, 151.2093],
  ['Sao Paulo', -23.5558, -46.6396],
  ['Cape Town', -33.9249, 18.4241],
  ['Los Angeles', 34.0522, -118.2437],
  ['Moscow', 55.7558, 37.6173],
  ['Singapore', 1.3521, 103.8198],
  ['Dubai', 25.2048, 55.2708],
]

const oceanBands = [
  { name: 'Pacific Ocean', lonMin: 120, lonMax: -70 },
  { name: 'Atlantic Ocean', lonMin: -70, lonMax: 20 },
  { name: 'Indian Ocean', lonMin: 20, lonMax: 120 },
]

const demoArticles = [
  {
    id: 'demo-space-1',
    category: 'space',
    title: 'NASA tracks orbital operations as ISS research continues',
    source: 'NASA Updates',
    author: 'Mission Desk',
    date: new Date().toISOString(),
    image: 'https://images.unsplash.com/photo-1446776811953-b23d57bd21aa?auto=format&fit=crop&w=900&q=80',
    description: 'A fallback article used when live news services are unavailable. It keeps the dashboard usable while API keys are configured.',
    url: 'https://www.nasa.gov/',
  },
  {
    id: 'demo-space-2',
    category: 'space',
    title: 'Commercial crew and cargo missions remain central to low Earth orbit',
    source: 'Orbit Brief',
    author: 'Space Desk',
    date: new Date(Date.now() - 3600_000).toISOString(),
    image: 'https://images.unsplash.com/photo-1517976487492-5750f3195933?auto=format&fit=crop&w=900&q=80',
    description: 'Mission planners continue to coordinate crew science, station maintenance, and future transportation windows.',
    url: 'https://www.nasa.gov/international-space-station/',
  },
  {
    id: 'demo-space-3',
    category: 'space',
    title: 'Earth observation payloads add new data from orbit',
    source: 'Science Wire',
    author: 'Research Team',
    date: new Date(Date.now() - 7200_000).toISOString(),
    image: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=900&q=80',
    description: 'Sensors aboard orbital platforms help scientists monitor weather, climate patterns, and surface changes.',
    url: 'https://science.nasa.gov/',
  },
  {
    id: 'demo-space-4',
    category: 'space',
    title: 'Astronaut research schedule focuses on biology and materials',
    source: 'ISS Lab',
    author: 'Lab Notes',
    date: new Date(Date.now() - 10_800_000).toISOString(),
    image: 'https://images.unsplash.com/photo-1614726365952-510103b1bbb4?auto=format&fit=crop&w=900&q=80',
    description: 'Microgravity experiments continue to examine how living systems and advanced materials behave in orbit.',
    url: 'https://www.issnationallab.org/',
  },
  {
    id: 'demo-space-5',
    category: 'space',
    title: 'Space station operations teams prepare upcoming spacewalk timeline',
    source: 'Mission Control',
    author: 'Operations Desk',
    date: new Date(Date.now() - 14_400_000).toISOString(),
    image: 'https://images.unsplash.com/photo-1541185933-ef5d8ed016c2?auto=format&fit=crop&w=900&q=80',
    description: 'Ground controllers review procedures, tools, and crew readiness for upcoming maintenance work.',
    url: 'https://www.nasa.gov/mission/station/',
  },
  {
    id: 'demo-science-1',
    category: 'science',
    title: 'Researchers use satellite data to monitor global ocean temperatures',
    source: 'Science Daily',
    author: 'Climate Desk',
    date: new Date(Date.now() - 1800_000).toISOString(),
    image: 'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=900&q=80',
    description: 'New data pipelines are helping researchers compare ocean heat changes across regions.',
    url: 'https://www.sciencedaily.com/',
  },
  {
    id: 'demo-science-2',
    category: 'science',
    title: 'New telescope instruments improve observation planning',
    source: 'Astronomy Now',
    author: 'Sky Desk',
    date: new Date(Date.now() - 5400_000).toISOString(),
    image: 'https://images.unsplash.com/photo-1462331940025-496dfbfc7564?auto=format&fit=crop&w=900&q=80',
    description: 'Observatories are tuning instrument schedules to capture more precise measurements of deep-sky targets.',
    url: 'https://www.esa.int/Science_Exploration/Space_Science',
  },
  {
    id: 'demo-science-3',
    category: 'science',
    title: 'Atmospheric studies benefit from low Earth orbit measurements',
    source: 'Research Bulletin',
    author: 'Earth Science Team',
    date: new Date(Date.now() - 9000_000).toISOString(),
    image: 'https://images.unsplash.com/photo-1519608487953-e999c86e7455?auto=format&fit=crop&w=900&q=80',
    description: 'Orbital instruments provide repeat observations that help validate models of atmospheric movement.',
    url: 'https://earthobservatory.nasa.gov/',
  },
  {
    id: 'demo-science-4',
    category: 'science',
    title: 'Robotics teams test autonomous inspection techniques',
    source: 'Tech Science',
    author: 'Robotics Desk',
    date: new Date(Date.now() - 12_600_000).toISOString(),
    image: 'https://images.unsplash.com/photo-1485827404703-89b55fcc595e?auto=format&fit=crop&w=900&q=80',
    description: 'Autonomous systems are being evaluated for inspection tasks in remote and difficult environments.',
    url: 'https://www.nasa.gov/technology/',
  },
  {
    id: 'demo-science-5',
    category: 'science',
    title: 'Solar activity forecasts support satellite operators',
    source: 'Space Weather Center',
    author: 'Forecast Unit',
    date: new Date(Date.now() - 16_200_000).toISOString(),
    image: 'https://images.unsplash.com/photo-1614642264762-d0a3b8bf3700?auto=format&fit=crop&w=900&q=80',
    description: 'Forecasters continue to track solar activity that can affect communications and orbital assets.',
    url: 'https://www.swpc.noaa.gov/',
  },
]

const issIcon = L.divIcon({
  className: 'iss-marker',
  html: '<span>ISS</span>',
  iconSize: [56, 56],
  iconAnchor: [28, 28],
})

function safeJsonParse(value, fallback) {
  try {
    return value ? JSON.parse(value) : fallback
  } catch {
    return fallback
  }
}

function haversineKm(a, b) {
  const radius = 6371
  const toRad = (degrees) => (degrees * Math.PI) / 180
  const latDistance = toRad(b.lat - a.lat)
  const lonDistance = toRad(b.lon - a.lon)
  const lat1 = toRad(a.lat)
  const lat2 = toRad(b.lat)
  const x =
    Math.sin(latDistance / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(lonDistance / 2) ** 2
  return 2 * radius * Math.atan2(Math.sqrt(x), Math.sqrt(1 - x))
}

function nearestPlace(lat, lon) {
  const nearest = cityAnchors
    .map(([name, cityLat, cityLon]) => ({
      name,
      distance: haversineKm({ lat, lon }, { lat: cityLat, lon: cityLon }),
    }))
    .sort((a, b) => a.distance - b.distance)[0]

  if (nearest.distance < 850) {
    return `Near ${nearest.name} (${Math.round(nearest.distance)} km away)`
  }

  const wrappedLon = lon < -180 ? lon + 360 : lon
  const ocean = oceanBands.find((band) =>
    band.lonMin > band.lonMax
      ? wrappedLon >= band.lonMin || wrappedLon <= band.lonMax
      : wrappedLon >= band.lonMin && wrappedLon <= band.lonMax,
  )
  return ocean?.name || (lat > 65 ? 'Arctic region' : lat < -55 ? 'Southern Ocean' : 'Remote land or ocean region')
}

function formatTime(value) {
  return new Intl.DateTimeFormat(undefined, {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  }).format(new Date(value))
}

function formatDate(value) {
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value))
}

function normalizeArticle(article, category, index) {
  const date =
    article.dateTimePub ||
    article.publishedAt ||
    article.published_at ||
    article.pubDate ||
    article.date ||
    new Date().toISOString()
  return {
    id: article.uri || article.url || `${category}-${index}-${date}`,
    category,
    title: article.title || 'Untitled article',
    source: article.source?.title || article.source?.name || article.news_site || article.source || 'Unknown source',
    author: article.author || article.authors?.[0]?.name || 'News desk',
    date,
    image:
      article.image ||
      article.imageUrl ||
      article.image_url ||
      article.urlToImage ||
      'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=900&q=80',
    description: article.body || article.description || article.summary || 'No short description was provided by this source.',
    url: article.url || article.webUrl || article.link || '#',
  }
}

function fitDescription(text) {
  return text.length > 190 ? `${text.slice(0, 187)}...` : text
}

function MapFollower({ position }) {
  const map = useMap()
  useEffect(() => {
    if (position) map.setView([position.lat, position.lon], map.getZoom(), { animate: true })
  }, [map, position])
  return null
}

function StatCard({ label, value, detail }) {
  return (
    <div className="stat-card">
      <span>{label}</span>
      <strong>{value}</strong>
      {detail ? <small>{detail}</small> : null}
    </div>
  )
}

function SkeletonCard() {
  return (
    <div className="article-card skeleton">
      <div className="skeleton-image" />
      <div className="skeleton-line wide" />
      <div className="skeleton-line" />
      <div className="skeleton-line short" />
    </div>
  )
}

export default function App() {
  const [theme, setTheme] = useState(() => localStorage.getItem(THEME_CACHE_KEY) || 'dark')
  const [positions, setPositions] = useState(() => safeJsonParse(localStorage.getItem(ISS_CACHE_KEY), []))
  const [speeds, setSpeeds] = useState(() => safeJsonParse(localStorage.getItem(SPEED_CACHE_KEY), []))
  const [people, setPeople] = useState({ number: 0, people: [] })
  const [issLoading, setIssLoading] = useState(true)
  const [issError, setIssError] = useState('')
  const [news, setNews] = useState(() => safeJsonParse(localStorage.getItem(NEWS_CACHE_KEY), null)?.articles || demoArticles)
  const [newsLoading, setNewsLoading] = useState(false)
  const [newsError, setNewsError] = useState('')
  const [query, setQuery] = useState('')
  const [sortBy, setSortBy] = useState('date')
  const [activeCategory, setActiveCategory] = useState('all')
  const [chatOpen, setChatOpen] = useState(false)
  const [messages, setMessages] = useState(() =>
    safeJsonParse(localStorage.getItem(CHAT_CACHE_KEY), [
      {
        role: 'assistant',
        content: 'Ask me about the current ISS location, tracked speed, astronauts, or the articles shown here.',
      },
    ]),
  )
  const [chatInput, setChatInput] = useState('')
  const [botTyping, setBotTyping] = useState(false)
  const [toasts, setToasts] = useState([])
  const intervalRef = useRef(null)

  const currentPosition = positions.at(-1)
  const currentSpeed = speeds.at(-1)?.speed || 0
  const currentPlace = currentPosition ? nearestPlace(currentPosition.lat, currentPosition.lon) : 'Locating ISS...'

  useEffect(() => {
    document.documentElement.dataset.theme = theme
    localStorage.setItem(THEME_CACHE_KEY, theme)
  }, [theme])

  useEffect(() => {
    localStorage.setItem(ISS_CACHE_KEY, JSON.stringify(positions.slice(-15)))
  }, [positions])

  useEffect(() => {
    localStorage.setItem(SPEED_CACHE_KEY, JSON.stringify(speeds.slice(-30)))
  }, [speeds])

  useEffect(() => {
    localStorage.setItem(CHAT_CACHE_KEY, JSON.stringify(messages.slice(-30)))
  }, [messages])

  function toast(message) {
    const id = crypto.randomUUID()
    setToasts((items) => [...items, { id, message }])
    window.setTimeout(() => setToasts((items) => items.filter((item) => item.id !== id)), 3200)
  }

  async function fetchJsonWithFallback(urls) {
    let lastError
    for (const url of urls) {
      try {
        const response = await fetch(url)
        if (!response.ok) throw new Error(`Request failed: ${response.status}`)
        return await response.json()
      } catch (error) {
        lastError = error
      }
    }
    throw lastError
  }

  async function loadIss(showToast = false) {
    setIssLoading(true)
    setIssError('')
    try {
      const data = await fetchJsonWithFallback([openNotifyIssUrl, proxyUrl(openNotifyIssUrl), 'https://api.wheretheiss.at/v1/satellites/25544'])
      const timestamp = data.timestamp ? data.timestamp * 1000 : Date.now()
      const nextPosition = {
        lat: Number(data.iss_position?.latitude ?? data.latitude),
        lon: Number(data.iss_position?.longitude ?? data.longitude),
        timestamp,
      }

      if (!Number.isFinite(nextPosition.lat) || !Number.isFinite(nextPosition.lon)) {
        throw new Error('Invalid ISS location response')
      }

      setPositions((prev) => {
        const last = prev.at(-1)
        if (last) {
          const hours = Math.max((nextPosition.timestamp - last.timestamp) / 3_600_000, 1 / 3600)
          const speed = haversineKm(last, nextPosition) / hours
          setSpeeds((old) => [...old, { timestamp: nextPosition.timestamp, speed: Math.round(speed) }].slice(-30))
        }
        return [...prev, nextPosition].slice(-15)
      })
      if (showToast) toast('ISS position refreshed')
    } catch {
      setIssError('Unable to fetch the live ISS position. Please retry in a moment.')
    } finally {
      setIssLoading(false)
    }
  }

  async function loadPeople() {
    try {
      const data = await fetchJsonWithFallback([openNotifyAstrosUrl, proxyUrl(openNotifyAstrosUrl)])
      setPeople({
        number: data.number || data.people?.length || 0,
        people: data.people || [],
      })
    } catch {
      setPeople({ number: 0, people: [] })
    }
  }

  async function fetchCategory(categoryId, force = false) {
    const cached = safeJsonParse(localStorage.getItem(NEWS_CACHE_KEY), null)
    if (!force && cached && Date.now() - cached.savedAt < NEWS_TTL) {
      setNews(cached.articles)
      return
    }

    setNewsLoading(true)
    setNewsError('')
    const apiKey = import.meta.env.VITE_NEWS_API_KEY
    try {
      let articles = []
      if (apiKey) {
        const keyword = categoryId === 'space' ? 'space OR NASA OR ISS' : 'science OR technology'
        const url = `https://eventregistry.org/api/v1/article/getArticles?apiKey=${apiKey}&keyword=${encodeURIComponent(
          keyword,
        )}&lang=eng&articlesCount=5&articlesSortBy=date`
        const payload = await fetchJsonWithFallback([url])
        articles = (payload.articles?.results || []).map((article, index) =>
          normalizeArticle(article, categoryId, index),
        )
      } else if (categoryId === 'space') {
        const payload = await fetchJsonWithFallback(['https://api.spaceflightnewsapi.net/v4/articles/?limit=5'])
        articles = (payload.results || []).map((article, index) => normalizeArticle(article, categoryId, index))
      }

      if (!articles.length) {
        articles = demoArticles.filter((article) => article.category === categoryId)
      }

      setNews((prev) => {
        const merged = [...prev.filter((article) => article.category !== categoryId), ...articles].slice(-10)
        localStorage.setItem(NEWS_CACHE_KEY, JSON.stringify({ savedAt: Date.now(), articles: merged }))
        return merged
      })
      toast(`${categories.find((category) => category.id === categoryId)?.label} news refreshed`)
    } catch {
      setNewsError('News could not be refreshed right now. Cached or demo articles are still shown.')
      setNews((prev) => (prev.length ? prev : demoArticles))
    } finally {
      setNewsLoading(false)
    }
  }

  async function refreshAllNews(force = false) {
    setNewsLoading(true)
    await Promise.all(categories.map((category) => fetchCategory(category.id, force)))
    setNewsLoading(false)
  }

  useEffect(() => {
    window.setTimeout(() => {
      loadIss()
      loadPeople()
      refreshAllNews(false)
    }, 0)
    intervalRef.current = window.setInterval(loadIss, ISS_INTERVAL)
    return () => window.clearInterval(intervalRef.current)
    // Polling is intentionally registered once on mount.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const filteredNews = useMemo(() => {
    const search = query.trim().toLowerCase()
    return news
      .filter((article) => activeCategory === 'all' || article.category === activeCategory)
      .filter((article) =>
        [article.title, article.source, article.author, article.description].join(' ').toLowerCase().includes(search),
      )
      .sort((a, b) =>
        sortBy === 'source'
          ? a.source.localeCompare(b.source)
          : new Date(b.date).getTime() - new Date(a.date).getTime(),
      )
  }, [activeCategory, news, query, sortBy])

  const speedChartData = {
    labels: speeds.map((item) => formatTime(item.timestamp)),
    datasets: [
      {
        label: 'ISS speed (km/h)',
        data: speeds.map((item) => item.speed),
        borderColor: '#38bdf8',
        backgroundColor: 'rgba(56, 189, 248, 0.18)',
        pointBackgroundColor: '#0ea5e9',
        tension: 0.35,
        fill: true,
      },
    ],
  }

  const newsChartData = {
    labels: categories.map((category) => category.label),
    datasets: [
      {
        data: categories.map((category) => news.filter((article) => article.category === category.id).length),
        backgroundColor: categories.map((category) => category.color),
        borderWidth: 0,
      },
    ],
  }

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { labels: { color: theme === 'dark' ? '#dbeafe' : '#1f2937' } },
    },
    scales: {
      x: { ticks: { color: theme === 'dark' ? '#bfdbfe' : '#475569' }, grid: { color: 'rgba(148, 163, 184, .18)' } },
      y: { ticks: { color: theme === 'dark' ? '#bfdbfe' : '#475569' }, grid: { color: 'rgba(148, 163, 184, .18)' } },
    },
  }

  const doughnutOptions = {
    responsive: true,
    maintainAspectRatio: false,
    onClick: (_, elements) => {
      const selected = elements[0]?.index
      if (selected !== undefined) {
        setActiveCategory(categories[selected].id)
        toast(`Filtered to ${categories[selected].label} articles`)
      }
    },
    plugins: {
      legend: { position: 'bottom', labels: { color: theme === 'dark' ? '#dbeafe' : '#1f2937' } },
    },
  }

  function dashboardContext() {
    const newsLines = news
      .map((article, index) => `${index + 1}. ${article.title} (${article.source}) - ${article.description}`)
      .join('\n')
    return `ISS latitude: ${currentPosition?.lat?.toFixed(3) || 'unknown'}
ISS longitude: ${currentPosition?.lon?.toFixed(3) || 'unknown'}
ISS speed: ${Math.round(currentSpeed)} km/h
Current location name: ${currentPlace}
Positions tracked: ${positions.length}
People in space: ${people.number}
Astronauts: ${people.people.map((person) => person.name).join(', ') || 'not available'}
Articles visible: ${news.length}
News:
${newsLines}`
  }

  function localBotAnswer(question) {
    const lower = question.toLowerCase()
    if (lower.includes('speed')) {
      return `The latest ISS speed measured by this dashboard is ${Math.round(currentSpeed)} km/h.`
    }
    if (lower.includes('location') || lower.includes('latitude') || lower.includes('longitude') || lower.includes('iss')) {
      return currentPosition
        ? `The ISS is at latitude ${currentPosition.lat.toFixed(3)} and longitude ${currentPosition.lon.toFixed(
            3,
          )}. The dashboard labels the area as ${currentPlace}.`
        : 'The dashboard has not loaded an ISS position yet.'
    }
    if (lower.includes('people') || lower.includes('astronaut')) {
      return `The dashboard currently shows ${people.number} people in space${
        people.people.length ? `: ${people.people.map((person) => person.name).join(', ')}.` : '.'
      }`
    }
    if (lower.includes('news') || lower.includes('article') || lower.includes('summary')) {
      return `The dashboard has ${news.length} articles. Top headlines: ${news
        .slice(0, 3)
        .map((article) => article.title)
        .join('; ')}.`
    }
    return 'I can only answer from this dashboard. Ask about the ISS location, speed, people in space, or the news articles shown here.'
  }

  async function askBot(event) {
    event.preventDefault()
    const question = chatInput.trim()
    if (!question) return
    setChatInput('')
    setMessages((items) => [...items, { role: 'user', content: question }].slice(-30))
    setBotTyping(true)
    try {
      const token = import.meta.env.VITE_AI_TOKEN
      let answer = ''
      if (token) {
        const prompt = `<s>[INST] You are a dashboard chatbot. Answer ONLY using the dashboard data below. If the answer is not in the data, say you can only answer from dashboard data.

Dashboard data:
${dashboardContext()}

Question: ${question} [/INST]`
        const response = await fetch('https://api-inference.huggingface.co/models/mistralai/Mistral-7B-Instruct-v0.2', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ inputs: prompt, parameters: { max_new_tokens: 180, temperature: 0.2 } }),
        })
        if (!response.ok) throw new Error('AI service unavailable')
        const result = await response.json()
        answer = Array.isArray(result)
          ? result[0]?.generated_text?.split('[/INST]').pop()?.trim()
          : result.generated_text?.split('[/INST]').pop()?.trim()
      }
      setMessages((items) => [...items, { role: 'assistant', content: answer || localBotAnswer(question) }].slice(-30))
    } catch {
      setMessages((items) => [...items, { role: 'assistant', content: localBotAnswer(question) }].slice(-30))
    } finally {
      setBotTyping(false)
    }
  }

  return (
    <div className="app-shell">
      <div className="toast-stack">
        {toasts.map((item) => (
          <div className="toast" key={item.id}>
            {item.message}
          </div>
        ))}
      </div>

      <header className="topbar">
        <div>
          <p>Real-Time Mission Dashboard</p>
          <h1>ISS Tracker & News Intelligence</h1>
        </div>
        <button className="icon-button theme-toggle" onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')} title="Toggle theme">
          {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
        </button>
      </header>

      <main>
        <section className="dashboard-grid">
          <div className="panel map-panel">
            <div className="panel-header">
              <div>
                <p>Live every 15 seconds</p>
                <h2>International Space Station</h2>
              </div>
              <button className="action-button" onClick={() => loadIss(true)}>
                <RefreshCw size={17} />
                Refresh
              </button>
            </div>

            {issError ? (
              <div className="error-box">
                <strong>ISS feed paused</strong>
                <span>{issError}</span>
                <button onClick={() => loadIss(true)}>Retry</button>
              </div>
            ) : null}

            <div className="map-wrap">
              <MapContainer center={[currentPosition?.lat || 0, currentPosition?.lon || 0]} zoom={3} minZoom={2} worldCopyJump>
                <TileLayer
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                {positions.length > 1 ? (
                  <Polyline positions={positions.map((point) => [point.lat, point.lon])} color="#38bdf8" weight={4} />
                ) : null}
                {currentPosition ? (
                  <>
                    <MapFollower position={currentPosition} />
                    <Marker position={[currentPosition.lat, currentPosition.lon]} icon={issIcon}>
                      <Tooltip permanent direction="top">
                        ISS: {currentPosition.lat.toFixed(2)}, {currentPosition.lon.toFixed(2)}
                      </Tooltip>
                    </Marker>
                  </>
                ) : null}
              </MapContainer>
            </div>
          </div>

          <aside className="panel iss-facts">
            <div className="panel-header compact">
              <div>
                <p>Telemetry</p>
                <h2>Current Status</h2>
              </div>
            </div>
            <div className="stat-grid">
              <StatCard label="Latitude" value={currentPosition ? currentPosition.lat.toFixed(4) : '...'} />
              <StatCard label="Longitude" value={currentPosition ? currentPosition.lon.toFixed(4) : '...'} />
              <StatCard label="Speed" value={`${Math.round(currentSpeed)} km/h`} detail={issLoading ? 'Updating...' : 'Haversine estimate'} />
              <StatCard label="Positions" value={positions.length} detail="Last 15 path points" />
            </div>
            <div className="location-strip">
              <span>Current location name</span>
              <strong>{currentPlace}</strong>
            </div>
            <div className="astronauts">
              <div>
                <span>People in space right now</span>
                <strong>{people.number}</strong>
              </div>
              <ul>
                {people.people.length ? (
                  people.people.map((person) => <li key={`${person.name}-${person.craft}`}>{person.name} · {person.craft}</li>)
                ) : (
                  <li>Names unavailable from the live feed</li>
                )}
              </ul>
            </div>
          </aside>
        </section>

        <section className="chart-grid">
          <div className="panel chart-panel">
            <div className="panel-header compact">
              <div>
                <p>Last 30 measurements</p>
                <h2>ISS Speed Trend</h2>
              </div>
            </div>
            <div className="chart-box">
              <Line data={speedChartData} options={chartOptions} />
            </div>
          </div>
          <div className="panel chart-panel">
            <div className="panel-header compact">
              <div>
                <p>Click a slice to filter</p>
                <h2>News Distribution</h2>
              </div>
              {activeCategory !== 'all' ? <button className="link-button" onClick={() => setActiveCategory('all')}>Clear filter</button> : null}
            </div>
            <div className="chart-box">
              <Doughnut data={newsChartData} options={doughnutOptions} />
            </div>
          </div>
        </section>

        <section className="panel news-panel">
          <div className="news-toolbar">
            <div>
              <p>Latest articles</p>
              <h2>News Dashboard</h2>
            </div>
            <div className="news-controls">
              <label className="search-box">
                <Search size={18} />
                <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search articles" />
              </label>
              <select value={sortBy} onChange={(event) => setSortBy(event.target.value)} aria-label="Sort articles">
                <option value="date">Sort by date</option>
                <option value="source">Sort by source</option>
              </select>
            </div>
          </div>

          {newsError ? (
            <div className="error-box slim">
              <span>{newsError}</span>
              <button onClick={() => refreshAllNews(true)}>Retry all</button>
            </div>
          ) : null}

          <div className="category-row">
            <button className={activeCategory === 'all' ? 'active' : ''} onClick={() => setActiveCategory('all')}>All</button>
            {categories.map((category) => (
              <button
                className={activeCategory === category.id ? 'active' : ''}
                key={category.id}
                onClick={() => setActiveCategory(category.id)}
              >
                {category.label}
              </button>
            ))}
            {categories.map((category) => (
              <button className="refresh-chip" key={`${category.id}-refresh`} onClick={() => fetchCategory(category.id, true)}>
                <RefreshCw size={15} />
                Refresh {category.label}
              </button>
            ))}
          </div>

          <div className="article-grid">
            {newsLoading
              ? Array.from({ length: 4 }).map((_, index) => <SkeletonCard key={index} />)
              : filteredNews.slice(0, 10).map((article) => (
                  <article className="article-card" key={article.id}>
                    <img src={article.image} alt="" loading="lazy" />
                    <div className="article-body">
                      <div className="article-meta">
                        <span>{article.source}</span>
                        <span>{formatDate(article.date)}</span>
                      </div>
                      <h3>{article.title}</h3>
                      <p>{fitDescription(article.description)}</p>
                      <div className="article-footer">
                        <span>{article.author}</span>
                        <a href={article.url} target="_blank" rel="noreferrer">Read More</a>
                      </div>
                    </div>
                  </article>
                ))}
          </div>
        </section>
      </main>

      <button className="chat-fab" onClick={() => setChatOpen(true)} title="Open chatbot">
        <Bot size={24} />
      </button>

      {chatOpen ? (
        <div className="chat-window" role="dialog" aria-label="Dashboard chatbot">
          <div className="chat-header">
            <div>
              <span><Sparkles size={15} /> Mistral dashboard bot</span>
              <strong>Answers only from this page</strong>
            </div>
            <button onClick={() => setChatOpen(false)} title="Close chat">
              <X size={18} />
            </button>
          </div>
          <div className="chat-messages">
            {messages.map((message, index) => (
              <div className={`message ${message.role}`} key={`${message.role}-${index}`}>
                {message.content}
              </div>
            ))}
            {botTyping ? <div className="message assistant typing">Typing...</div> : null}
          </div>
          <form className="chat-form" onSubmit={askBot}>
            <button type="button" className="ghost-icon" onClick={() => setMessages([])} title="Clear chat">
              <Trash2 size={17} />
            </button>
            <input value={chatInput} onChange={(event) => setChatInput(event.target.value)} placeholder="Ask about ISS or news" />
            <button type="submit" title="Send message">
              <Send size={18} />
            </button>
          </form>
        </div>
      ) : null}
    </div>
  )
}
