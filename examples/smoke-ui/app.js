const checkButton = document.querySelector("#check");
const summary = document.querySelector("#summary");
const liveOutput = document.querySelector("#live");
const readyOutput = document.querySelector("#ready");

async function readJson(path) {
  const response = await fetch(path, {
    headers: { accept: "application/json" }
  });

  const payload = await response.json();
  return { ok: response.ok, status: response.status, payload };
}

async function checkHealth() {
  checkButton.disabled = true;
  summary.textContent = "Comprobando…";

  try {
    const [live, ready] = await Promise.all([
      readJson("/health/live"),
      readJson("/health/ready")
    ]);

    liveOutput.textContent = live.ok ? "OK" : `Error (${live.status})`;
    readyOutput.textContent = ready.ok
      ? `OK · ${ready.payload.database}`
      : `No disponible · ${ready.payload.database ?? ready.status}`;

    summary.textContent = ready.ok
      ? "El proceso y MongoDB están listos."
      : "La API responde, pero todavía no está lista para tráfico.";
  } catch (error) {
    console.error(error);
    liveOutput.textContent = "Error";
    readyOutput.textContent = "Error";
    summary.textContent = "No fue posible consultar la API.";
  } finally {
    checkButton.disabled = false;
  }
}

checkButton.addEventListener("click", checkHealth);
void checkHealth();
