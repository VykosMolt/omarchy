// Receipts belong to one shell instance and remain valid after authentication.
// Keep memory bounded without evicting a receipt inside the command's deadline.
function create(instance) {
  return { instance: instance, sequence: 0, active: "", records: {}, order: [] }
}

function request(ledger, now) {
  if (!ledger || !ledger.instance) return null
  if (ledger.active) return result(ledger, ledger.active)

  var kept = []
  for (var i = 0; i < ledger.order.length; i++) {
    var id = ledger.order[i]
    var record = ledger.records[id]
    if (record.state !== "pending" && now - record.finishedAt >= 30000) delete ledger.records[id]
    else kept.push(id)
  }
  ledger.order = kept
  if (kept.length >= 64) return null

  ledger.sequence += 1
  var requestId = ledger.instance + ":" + ledger.sequence
  ledger.active = requestId
  ledger.records[requestId] = { requestId: requestId, state: "pending" }
  ledger.order.push(requestId)
  return result(ledger, requestId)
}

function secured(ledger, now) {
  if (!ledger || !ledger.active) return
  var record = ledger.records[ledger.active]
  if (record && record.state === "pending") {
    record.state = "secured"
    record.finishedAt = now
  }
}

function released(ledger, now) {
  if (!ledger || !ledger.active) return
  var record = ledger.records[ledger.active]
  if (record && record.state === "pending") {
    record.state = "failed"
    record.finishedAt = now
  }
  ledger.active = ""
}

function result(ledger, requestId) {
  var record = ledger && Object.prototype.hasOwnProperty.call(ledger.records, requestId) && ledger.records[requestId]
  if (!record) return { requestId: requestId, state: "unknown" }
  return { requestId: record.requestId, state: record.state }
}

if (typeof module !== "undefined") {
  module.exports = { create: create, request: request, secured: secured, released: released, result: result }
}

