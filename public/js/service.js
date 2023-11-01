class HttpService {
  constructor(BASE_URL) {
    this.BASE_URL = BASE_URL || API_BASE_URL;
  }

  getHeaders() {
    const headers = {
      "Content-Type": "application/json",
    };

    return headers;
  }

  async handleErrors(response) {
    if (!response.ok) {
      const errorMessages = {
        500: "Internal Server Error",
        403: "Forbidden",
        404: "Not Found",
        400: "Bad Request",
        409: "Conflict",
        401: "Unauthorized",
        402: "Payment Required",
      };

      const errorMessage =
        (await response.text()) || errorMessages[response.status];
      showToast(errorMessage, "error");

      if (response.status === 401) {
        window.location.replace("/login");
      }

      throw new Error(errorMessage);
    }

    return response;
  }

  async get(endpoint) {
    try {
      const response = await fetch(this.BASE_URL + endpoint, {
        method: "GET",
        headers: this.getHeaders(),
      });
      return this.handleErrors(response);
    } catch (error) {
      throw error;
    }
  }

  async post(endpoint, data) {
    try {
      const response = await fetch(this.BASE_URL + endpoint, {
        method: "POST",
        headers: this.getHeaders(),
        body: JSON.stringify(data),
      });
      return this.handleErrors(response);
    } catch (error) {
      throw error;
    }
  }

  async put(endpoint, data) {
    try {
      const response = await fetch(this.BASE_URL + endpoint, {
        method: "PUT",
        headers: this.getHeaders(),
        body: JSON.stringify(data),
      });
      return this.handleErrors(response);
    } catch (error) {
      throw error;
    }
  }

  async del(endpoint) {
    try {
      const response = await fetch(this.BASE_URL + endpoint, {
        method: "DELETE",
        headers: this.getHeaders(),
      });
      return this.handleErrors(response);
    } catch (error) {
      throw error;
    }
  }
}

const apiService = new HttpService();
