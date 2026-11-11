import { useState } from 'react'
import { createIncident, createShipment } from './lib/records.js'

export default function RecordsCreate({
  shipments,
  confirmation,
  onBack,
  onSaved,
}) {
  const [orderNumber, setOrderNumber] = useState('')
  const [route, setRoute] = useState('')
  const [shipmentId, setShipmentId] = useState(shipments[0]?.id ?? '')
  const [description, setDescription] = useState('')
  const [urgency, setUrgency] = useState('normal')
  const [pending, setPending] = useState(false)
  const [error, setError] = useState('')
  const selectedShipmentId = shipments.some((shipment) => shipment.id === shipmentId)
    ? shipmentId
    : (shipments[0]?.id ?? '')

  async function handleCreateShipment(event) {
    event.preventDefault()
    setError('')

    const trimmedOrderNumber = orderNumber.trim()
    const trimmedRoute = route.trim()

    if (!trimmedOrderNumber || !trimmedRoute) {
      setError('Įveskite užsakymo numerį ir maršrutą.')
      return
    }

    setPending(true)

    try {
      await createShipment({
        orderNumber: trimmedOrderNumber,
        route: trimmedRoute,
      })
      setOrderNumber('')
      setRoute('')
      onSaved('Pervežimas išsaugotas.')
    } catch {
      setError('Nepavyko išsaugoti pervežimo. Bandykite dar kartą.')
    } finally {
      setPending(false)
    }
  }

  async function handleCreateIncident(event) {
    event.preventDefault()
    setError('')

    const trimmedDescription = description.trim()

    if (!selectedShipmentId) {
      setError('Pirmiausia sukurkite pervežimą.')
      return
    }

    if (!trimmedDescription) {
      setError('Įveskite incidento aprašymą.')
      return
    }

    setPending(true)

    try {
      await createIncident({
        shipmentId: selectedShipmentId,
        description: trimmedDescription,
        urgency,
      })
      setDescription('')
      setUrgency('normal')
      onSaved('Incidentas išsaugotas.')
    } catch {
      setError('Nepavyko išsaugoti incidento. Bandykite dar kartą.')
    } finally {
      setPending(false)
    }
  }

  return (
    <section className="app-card" aria-labelledby="create-title">
      <div className="section-header">
        <div>
          <h2 id="create-title">Naujas įrašas</h2>
          <p className="lede">Pridėkite pervežimą arba incidentą.</p>
        </div>
        <button type="button" className="secondary" onClick={onBack} disabled={pending}>
          Grįžti į sąrašą
        </button>
      </div>

      {confirmation ? (
        <p className="message info" role="status">
          {confirmation}
        </p>
      ) : null}
      {error ? (
        <p className="message error" role="alert">
          {error}
        </p>
      ) : null}
      {pending ? (
        <p className="status" role="status">
          Įkeliama...
        </p>
      ) : null}

      <form className="record-form" onSubmit={handleCreateShipment}>
        <h3>Pridėti pervežimą</h3>

        <label htmlFor="order-number">Užsakymo numeris</label>
        <input
          id="order-number"
          name="orderNumber"
          value={orderNumber}
          onChange={(event) => setOrderNumber(event.target.value)}
          disabled={pending}
          required
        />

        <label htmlFor="route">Maršrutas</label>
        <input
          id="route"
          name="route"
          value={route}
          onChange={(event) => setRoute(event.target.value)}
          disabled={pending}
          required
        />

        <button type="submit" className="primary" disabled={pending}>
          Išsaugoti pervežimą
        </button>
      </form>

      <form className="record-form" onSubmit={handleCreateIncident}>
        <h3>Pridėti incidentą</h3>

        {shipments.length === 0 ? (
          <p className="empty-state" role="status">
            Pirmiausia sukurkite pervežimą.
          </p>
        ) : (
          <>
            <label htmlFor="shipment">Pervežimas</label>
            <select
              id="shipment"
              name="shipmentId"
              value={selectedShipmentId}
              onChange={(event) => setShipmentId(event.target.value)}
              disabled={pending}
              required
            >
              {shipments.map((shipment) => (
                <option key={shipment.id} value={shipment.id}>
                  {shipment.order_number} — {shipment.route}
                </option>
              ))}
            </select>

            <label htmlFor="description">Aprašymas</label>
            <textarea
              id="description"
              name="description"
              rows={4}
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              disabled={pending}
              required
            />

            <fieldset className="urgency-fieldset" disabled={pending}>
              <legend>Skubumas</legend>
              <label className="choice">
                <input
                  type="radio"
                  name="urgency"
                  value="high"
                  checked={urgency === 'high'}
                  onChange={() => setUrgency('high')}
                />
                Skubus
              </label>
              <label className="choice">
                <input
                  type="radio"
                  name="urgency"
                  value="normal"
                  checked={urgency === 'normal'}
                  onChange={() => setUrgency('normal')}
                />
                Įprastas
              </label>
            </fieldset>

            <button type="submit" className="primary" disabled={pending}>
              Išsaugoti incidentą
            </button>
          </>
        )}
      </form>
    </section>
  )
}
