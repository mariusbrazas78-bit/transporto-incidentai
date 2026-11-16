import { useCallback, useEffect, useState } from 'react'
import { supabase } from './lib/supabase.js'
import { fetchRecords } from './lib/records.js'
import RecordsCreate from './RecordsCreate.jsx'
import RecordsList from './RecordsList.jsx'
import './App.css'

function translateAuthError(message) {
  const text = message.toLowerCase()

  if (text.includes('invalid login credentials')) {
    return 'Neteisingas el. paštas arba slaptažodis.'
  }
  if (text.includes('email not confirmed')) {
    return 'El. paštas dar nepatvirtintas. Atidarykite laišką ir patvirtinkite paskyrą.'
  }
  if (text.includes('user already registered')) {
    return 'Šis el. paštas jau užregistruotas. Bandykite prisijungti.'
  }
  if (text.includes('password should be at least')) {
    return 'Slaptažodis per trumpas. Naudokite bent 6 simbolius.'
  }
  if (text.includes('unable to validate email')) {
    return 'Neteisingas el. pašto adresas.'
  }
  if (text.includes('rate limit') || text.includes('too many')) {
    return 'Per daug bandymų. Palaukite ir bandykite dar kartą.'
  }

  return message
}

function App() {
  const [session, setSession] = useState(null)
  const [initializing, setInitializing] = useState(true)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [pending, setPending] = useState(false)
  const [error, setError] = useState('')
  const [info, setInfo] = useState('')
  const [screen, setScreen] = useState('list')
  const [records, setRecords] = useState([])
  const [recordsStatus, setRecordsStatus] = useState('loading')
  const [recordsError, setRecordsError] = useState('')
  const [confirmation, setConfirmation] = useState('')

  const loadRecords = useCallback(async () => {
    setRecordsStatus('loading')
    setRecordsError('')

    try {
      const nextRecords = await fetchRecords()
      setRecords(nextRecords)
      setRecordsStatus(nextRecords.length === 0 ? 'empty' : 'success')
    } catch {
      setRecords([])
      setRecordsStatus('error')
      setRecordsError('Nepavyko įkelti įrašų. Bandykite dar kartą.')
    }
  }, [])

  useEffect(() => {
    let cancelled = false

    supabase.auth.getSession().then(({ data, error: sessionError }) => {
      if (cancelled) return
      if (sessionError) {
        setError(translateAuthError(sessionError.message))
      } else {
        setSession(data.session)
      }
      setInitializing(false)
    })

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession)
      if (!nextSession) {
        setScreen('list')
        setRecords([])
        setRecordsStatus('loading')
        setConfirmation('')
      }
    })

    return () => {
      cancelled = true
      subscription.unsubscribe()
    }
  }, [])

  useEffect(() => {
    const userId = session?.user?.id
    if (!userId) {
      return undefined
    }

    let cancelled = false

    fetchRecords()
      .then((nextRecords) => {
        if (cancelled) {
          return
        }
        setRecords(nextRecords)
        setRecordsStatus(nextRecords.length === 0 ? 'empty' : 'success')
      })
      .catch(() => {
        if (cancelled) {
          return
        }
        setRecords([])
        setRecordsStatus('error')
        setRecordsError('Nepavyko įkelti įrašų. Bandykite dar kartą.')
      })

    return () => {
      cancelled = true
    }
  }, [session?.user?.id])

  async function handleAuth(mode) {
    setError('')
    setInfo('')

    const trimmedEmail = email.trim()
    if (!trimmedEmail || !password) {
      setError('Įveskite el. paštą ir slaptažodį.')
      return
    }

    setPending(true)

    try {
      if (mode === 'signin') {
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email: trimmedEmail,
          password,
        })
        if (signInError) {
          setError(translateAuthError(signInError.message))
        }
        return
      }

      const { data, error: signUpError } = await supabase.auth.signUp({
        email: trimmedEmail,
        password,
      })

      if (signUpError) {
        setError(translateAuthError(signUpError.message))
        return
      }

      if (data.user?.identities?.length === 0) {
        setError('Šis el. paštas jau užregistruotas. Bandykite prisijungti.')
        return
      }

      if (data.user && !data.session) {
        setInfo(
          'Paskyra sukurta. Patikrinkite el. paštą ir atidarykite patvirtinimo nuorodą, tada prisijunkite.',
        )
      }
    } catch (caught) {
      setError(
        caught instanceof Error
          ? translateAuthError(caught.message)
          : 'Įvyko nenumatyta klaida. Bandykite dar kartą.',
      )
    } finally {
      setPending(false)
    }
  }

  async function handleSignOut() {
    setError('')
    setInfo('')
    setPending(true)

    const { error: signOutError } = await supabase.auth.signOut()
    setPending(false)

    if (signOutError) {
      setError(translateAuthError(signOutError.message))
      return
    }

    setPassword('')
  }

  async function handleSaved(message) {
    setConfirmation(message)
    await loadRecords()
    setScreen('list')
  }

  if (initializing) {
    return (
      <main className="auth-page">
        <p className="status" role="status">
          Tikrinama sesija...
        </p>
      </main>
    )
  }

  if (session) {
    return (
      <main className="app-page">
        <header className="app-header">
          <div>
            <h1>Transporto incidentų registravimas</h1>
            <p className="user-email">{session.user.email}</p>
          </div>
          <button
            type="button"
            className="secondary"
            onClick={handleSignOut}
            disabled={pending}
          >
            {pending ? 'Vykdoma...' : 'Atsijungti'}
          </button>
        </header>

        {error ? (
          <p className="message error" role="alert">
            {error}
          </p>
        ) : null}

        {screen === 'create' ? (
          <RecordsCreate
            shipments={records}
            confirmation={confirmation}
            onBack={() => setScreen('list')}
            onSaved={handleSaved}
          />
        ) : (
          <RecordsList
            records={records}
            status={recordsStatus}
            error={recordsError}
            confirmation={confirmation}
            onRetry={loadRecords}
            onCreate={() => {
              setConfirmation('')
              setScreen('create')
            }}
          />
        )}
      </main>
    )
  }

  return (
    <main className="auth-page">
      <section className="auth-card" aria-labelledby="app-title">
        <h1 id="app-title">Transporto incidentų registravimas</h1>
        <p className="lede">Prisijunkite arba užsiregistruokite el. paštu.</p>

        <form
          className="auth-form"
          onSubmit={(event) => {
            event.preventDefault()
            handleAuth('signin')
          }}
        >
          <label htmlFor="email">El. paštas</label>
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            disabled={pending}
            required
          />

          <label htmlFor="password">Slaptažodis</label>
          <div className="password-field">
            <input
              id="password"
              name="password"
              type={showPassword ? 'text' : 'password'}
              autoComplete="current-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              disabled={pending}
              required
              minLength={6}
            />
            <button
              type="button"
              className="password-toggle"
              aria-label={showPassword ? 'Slėpti slaptažodį' : 'Rodyti slaptažodį'}
              aria-pressed={showPassword}
              onClick={() => setShowPassword((visible) => !visible)}
            >
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="M2 12s3.6-6 10-6 10 6 10 6-3.6 6-10 6-10-6-10-6Z" />
                <circle cx="12" cy="12" r="3" />
                {!showPassword && <path d="m3 3 18 18" />}
              </svg>
            </button>
          </div>

          {error ? (
            <p className="message error" role="alert">
              {error}
            </p>
          ) : null}
          {info ? (
            <p className="message info" role="status">
              {info}
            </p>
          ) : null}
          {pending ? (
            <p className="status" role="status">
              Vykdoma...
            </p>
          ) : null}

          <div className="actions">
            <button type="submit" className="primary" disabled={pending}>
              Prisijungti
            </button>
            <button
              type="button"
              className="secondary"
              disabled={pending}
              onClick={() => handleAuth('signup')}
            >
              Registruotis
            </button>
          </div>
        </form>
      </section>
    </main>
  )
}

export default App
