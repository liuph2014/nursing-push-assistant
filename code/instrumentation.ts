export async function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs") return;
  const { loadEnvFile } = await import("./lib/load-env");
  loadEnvFile();
  try {
    const { ensureSeed } = await import("./lib/ensure-seed");
    await ensureSeed();
  } catch (err) {
    console.warn("[seed] 数据库尚未就绪，稍后由页面再试", err);
  }
}
