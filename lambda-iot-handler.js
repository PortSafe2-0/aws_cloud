// Lambda handler disparado por IoT Rule no tópico portsafe/locker
// Substitui o backend-listener.js (que precisava de certificados MQTT)
// O IoT Rule entrega a mensagem diretamente como event — sem SDK de device necessário

const { IoTDataPlaneClient, PublishCommand } = require("@aws-sdk/client-iot-data-plane");

const iotClient = new IoTDataPlaneClient({ region: process.env.AWS_REGION || "us-east-1" });

const ACK_TOPIC = process.env.ACK_TOPIC || "portsafe/locker/ack";
const API_BASE_URL = process.env.API_BASE_URL || "";

exports.handler = async (event) => {
  console.log("Mensagem IoT recebida:", JSON.stringify(event));

  const ack = {
    ok: true,
    source: "lambda-iot-handler",
    receivedAt: new Date().toISOString(),
    lockerId: event.lockerId,
    status: event.status,
    originalTimestamp: event.timestamp,
  };

  // Se a URL da API estiver configurada, notifica o backend sobre mudança de status
  if (API_BASE_URL && event.lockerId && event.status) {
    try {
      const https = require("https");
      const http = require("http");
      const client = API_BASE_URL.startsWith("https") ? https : http;

      await new Promise((resolve, reject) => {
        const body = JSON.stringify({
          lockerId: event.lockerId,
          lockerCode: event.lockerCode || event.lockerId,
          status: event.status,
          timestamp: event.timestamp || new Date().toISOString(),
        });
        const url = new URL(`${API_BASE_URL}/locker/event`);
        const req = client.request(
          { hostname: url.hostname, port: url.port || (url.protocol === "https:" ? 443 : 80),
            path: url.pathname, method: "POST",
            headers: { "Content-Type": "application/json", "Content-Length": Buffer.byteLength(body) } },
          (res) => { res.on("data", () => {}); res.on("end", resolve); }
        );
        req.on("error", reject);
        req.write(body);
        req.end();
      });

      console.log("API notificada sobre mudança de status do locker", event.lockerId);
    } catch (err) {
      console.warn("Falha ao notificar API (não crítico):", err.message);
    }
  }

  // Publica ACK de volta no tópico de confirmação
  try {
    await iotClient.send(new PublishCommand({
      topic: ACK_TOPIC,
      payload: Buffer.from(JSON.stringify(ack)),
      qos: 0,
    }));
    console.log("ACK publicado em", ACK_TOPIC, ack);
  } catch (err) {
    console.error("Falha ao publicar ACK:", err.message);
  }

  return { statusCode: 200, body: JSON.stringify(ack) };
};
