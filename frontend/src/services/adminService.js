/**
 * SwarmAI Admin Service (Round 2)
 * All API calls for the Admin Command Center.
 */

import API from "./api";

// ============================================================
// INCIDENTS
// ============================================================

export const getIncidents = async (limit = 50) => {
  const res = await API.get("/api/incidents", { params: { limit } });
  return res.data;
};

export const getIncident = async (eventId) => {
  const res = await API.get(`/api/incidents/${eventId}`);
  return res.data;
};

// ============================================================
// NOTIFICATIONS
// ============================================================

export const sendNotification = async (payload) => {
  // payload: { incidentId, recipients: string[], message? }
  const res = await API.post("/api/notifications/send", payload);
  return res.data;
};

export const getNotifications = async (incidentId) => {
  const res = await API.get(`/api/notifications/${incidentId}`);
  return res.data;
};

// ============================================================
// DELEGATION
// ============================================================

export const checkConflict = async (payload) => {
  // payload: { incidentId, teamId, vehicleId, task, startTime, endTime }
  const res = await API.post("/api/delegation/check", payload);
  return res.data;
};

export const confirmDelegation = async (payload) => {
  // payload: { incidentId, teamId, vehicleId, task, startTime, endTime, override }
  const res = await API.post("/api/delegation/confirm", payload);
  return res.data;
};

export const getAssignments = async (incidentId) => {
  const res = await API.get(`/api/delegation/${incidentId}`);
  return res.data;
};

export const getTeams = async () => {
  const res = await API.get("/api/delegation-teams");
  return res.data.teams || [];
};

export const getVehicles = async () => {
  const res = await API.get("/api/delegation-vehicles");
  return res.data.vehicles || [];
};
