import API from "./api";

export const getDashboardData =
  async () => {
    const response =
      await API.get(
        "/dashboard/data"
      );

    return response.data;
  };

export const simulateDisaster =
  async (payload) => {
    const response =
      await API.post(
        "/api/simulate",
        payload
      );

    return response.data;
  };