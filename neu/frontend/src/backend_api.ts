const port = 62334;
const base_url = `http://localhost:${port}`;

class BackendApi {
  async toggle_detect() {
    const response = await fetch(`${base_url}/toggle_work`, {
      method: "GET",
    });
    return response.text();
  }

  async get_detect_status() {
    const response = await fetch(`${base_url}/status`);
    return response.json();
  }

  async update_config(config: any) {
    const response = await fetch(`${base_url}/update_config`, {
      method: "POST",
      body: JSON.stringify(config),
      headers: {
        "Content-Type": "application/json",
      },
    });
    return response.json();
  }

  async check_ready() {
    const response = await fetch(`${base_url}/`, {
      signal: AbortSignal.timeout(1000),
    });
    return response.text();
  }

  shutdown() {
    fetch(`${base_url}/shutdown`, {
      method: "GET",
    });
  }
}

const backend_api = new BackendApi();

export default backend_api;
