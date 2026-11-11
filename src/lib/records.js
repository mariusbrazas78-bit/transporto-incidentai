import { supabase } from './supabase.js'

export function urgencyLabel(urgency) {
  return urgency === 'high' ? 'Skubus' : 'Įprastas'
}

export async function fetchRecords() {
  const [shipmentsResult, incidentsResult] = await Promise.all([
    supabase
      .from('shipments')
      .select('id, order_number, route, created_at')
      .order('created_at', { ascending: false }),
    supabase
      .from('incidents')
      .select('id, shipment_id, description, urgency, created_at')
      .order('created_at', { ascending: false }),
  ])

  if (shipmentsResult.error) {
    throw shipmentsResult.error
  }

  if (incidentsResult.error) {
    throw incidentsResult.error
  }

  const incidentsByShipment = new Map()

  for (const incident of incidentsResult.data ?? []) {
    const list = incidentsByShipment.get(incident.shipment_id) ?? []
    list.push(incident)
    incidentsByShipment.set(incident.shipment_id, list)
  }

  return (shipmentsResult.data ?? []).map((shipment) => ({
    ...shipment,
    incidents: incidentsByShipment.get(shipment.id) ?? [],
  }))
}

export async function createShipment({ orderNumber, route }) {
  const { error } = await supabase.from('shipments').insert({
    order_number: orderNumber,
    route,
  })

  if (error) {
    throw error
  }
}

export async function createIncident({ shipmentId, description, urgency }) {
  const { error } = await supabase.from('incidents').insert({
    shipment_id: shipmentId,
    description,
    urgency,
  })

  if (error) {
    throw error
  }
}
