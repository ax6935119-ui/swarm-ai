export const dashboardModel = {
  disaster: {
    id: null,
    type: null,
    severity: null,
    victims: null,
    location: null,
    status: null,
  },

  agents: {
    traffic: {
      response: null,
      status: null,
    },

    medical: {
      response: null,
      status: null,
    },

    resource: {
      response: null,
      status: null,
    },
  },

  summary: null,

  logs: [],

  map: {
    disasterLocation: null,
    hospitals: [],
    routes: [],
    ambulances: [],
  },
};