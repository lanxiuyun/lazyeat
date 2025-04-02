const port = 62334;
const base_url = `http://localhost:${port}`;

class PyApi {
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
