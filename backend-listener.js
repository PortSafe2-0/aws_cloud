const awsIot = require("aws-iot-device-sdk");
const fs = require("fs");

const certPath = "./certificate.pem.crt";
const keyPath = "./private.pem.key";
const caPath = "./AmazonRootCA1.pem";

const requestTopic = process.env.REQUEST_TOPIC || "portsafe/locker";
const ackTopic = process.env.ACK_TOPIC || "portsafe/locker/ack";
const clientId = process.env.CLIENT_ID || `backend-listener-${Date.now()}`;

console.log("🚀 Iniciando backend listener...");
console.log("📂 Diretório atual:", process.cwd());
console.log("✓ Certificado existe:", fs.existsSync(certPath));
console.log("✓ Chave privada existe:", fs.existsSync(keyPath));
console.log("✓ CA existe:", fs.existsSync(caPath));
console.log("🆔 ClientId:", clientId);
console.log("📥 Tópico de entrada:", requestTopic);
console.log("📤 Tópico de ack:", ackTopic);

const device = awsIot.device({
  keyPath,
  certPath,
  caPath,
  clientId,
  host: "a1j1qwd3dpi3ec-ats.iot.us-east-1.amazonaws.com",
  protocol: "mqtts",
  reconnectPeriod: 5000,
  connectionTimeout: 10000,
  debug: true,
});

let connected = false;

const connectTimeout = setTimeout(() => {
  if (connected) return;

  console.log("⏱️ Timeout: impossível conectar após 30 segundos");
  process.exit(1);
}, 30000);

device.on("connect", () => {
  connected = true;
  clearTimeout(connectTimeout);
  console.log("🔥 Backend conectado ao AWS IoT");

  device.subscribe(requestTopic, { qos: 0 }, (err) => {
    if (err) {
      console.log("⚠️ Falha ao assinar tópico de entrada:", err.message);
      return;
    }

    console.log("✅ Assinando em:", requestTopic);
  });
});

device.on("message", (topic, payload) => {
  const raw = payload.toString();
  let parsed = raw;

  try {
    parsed = JSON.parse(raw);
  } catch {
    // Keep raw payload when it is not valid JSON.
  }

  console.log("📥 Recebido [" + topic + "]:", parsed);

  const ack = {
    ok: true,
    source: "backend-listener",
    receivedTopic: topic,
    receivedAt: new Date().toISOString(),
  };

  if (typeof parsed === "object" && parsed !== null) {
    ack.lockerId = parsed.lockerId;
    ack.status = parsed.status;
    ack.originalTimestamp = parsed.timestamp;
  }

  device.publish(ackTopic, JSON.stringify(ack), {}, (err) => {
    if (err) {
      console.log("⚠️ Falha ao publicar ack:", err.message);
      return;
    }

    console.log("📤 Ack enviado em [" + ackTopic + "]:", ack);
  });
});

device.on("error", (error) => {
  console.log("❌ ERRO:", error);
});

device.on("offline", () => {
  console.log("📴 Backend offline");
});

device.on("reconnect", () => {
  console.log("🔄 Backend tentando reconectar...");
});

device.on("close", () => {
  console.log("⚠️ Conexão do backend fechada");
});
