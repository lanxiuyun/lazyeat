const port = 62334;
const base_url = `http://localhost:${port}`;

class PyApi {
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

  async ready(): Promise<boolean> {
    try {
      await fetch(`${base_url}/`, {
        signal: AbortSignal.timeout(1000),
      });
      return true;
    } catch (error) {
      return false;
    }
  }

  async shutdown() {
    try {
      await fetch(`${base_url}/shutdown`, {
        method: "GET",
        signal: AbortSignal.timeout(500),
      });
    } catch (error) {
      console.error("关闭服务失败:", error);
    }
  }
}

const pyApi = new PyApi();

export default pyApi;
