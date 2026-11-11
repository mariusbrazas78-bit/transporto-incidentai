import { urgencyLabel } from './lib/records.js'

export default function RecordsList({
  records,
  status,
  error,
  confirmation,
  onRetry,
  onCreate,
}) {
  return (
    <section className="app-card" aria-labelledby="records-title">
      <div className="section-header">
        <div>
          <h2 id="records-title">Pervežimai ir incidentai</h2>
          <p className="lede">Jūsų užregistruoti pervežimai ir su jais susiję incidentai.</p>
        </div>
        <button type="button" className="primary" onClick={onCreate}>
          Pridėti įrašą
        </button>
      </div>

      {confirmation ? (
        <p className="message info" role="status">
          {confirmation}
        </p>
      ) : null}

      {status === 'loading' ? (
        <p className="status" role="status">
          Įkeliama...
        </p>
      ) : null}

      {status === 'error' ? (
        <div className="state-block" role="alert">
          <p className="message error">{error}</p>
          <button type="button" className="secondary" onClick={onRetry}>
            Bandyti dar kartą
          </button>
        </div>
      ) : null}

      {status === 'empty' ? (
        <p className="empty-state" role="status">
          Pervežimų dar nėra. Pridėkite pirmą pervežimą.
        </p>
      ) : null}

      {status === 'success' ? (
        <ul className="shipment-list">
          {records.map((shipment) => (
            <li key={shipment.id} className="shipment-item">
              <h3>
                Užsakymas {shipment.order_number}
              </h3>
              <p className="shipment-route">{shipment.route}</p>

              {shipment.incidents.length === 0 ? (
                <p className="muted">Šiam pervežimui incidentų nėra.</p>
              ) : (
                <ul className="incident-list">
                  {shipment.incidents.map((incident) => (
                    <li key={incident.id} className="incident-item">
                      <span className={`urgency urgency-${incident.urgency}`}>
                        {urgencyLabel(incident.urgency)}
                      </span>
                      <p>{incident.description}</p>
                    </li>
                  ))}
                </ul>
              )}
            </li>
          ))}
        </ul>
      ) : null}
    </section>
  )
}
