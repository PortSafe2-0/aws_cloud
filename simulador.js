const awsIot = require("aws-iot-device-sdk");
const fs = require("fs");

console.log("🚀 Iniciando simulador...");
console.log("📂 Diretório atual:", process.cwd());

// Verificar arquivos
const certPath = "./certificate.pem.crt";
const keyPath = "./private.pem.key";
const caPath = "./AmazonRootCA1.pem";

console.log("✓ Certificado existe:", fs.existsSync(certPath));
console.log("✓ Chave privada existe:", fs.existsSync(keyPath));
console.log("✓ CA existe:", fs.existsSync(caPath));

const statusArg = (process.argv[2] || "fechado").toLowerCase();
const onceMode = process.argv.includes("--once");
const status = statusArg === "aberto" ? "aberto" : "fechado";
const listenMode = process.argv.includes("--listen");
const commandMode = process.argv.includes("--cmd");
const subArgIndex = process.argv.indexOf("--sub");
const responseTopic =
  subArgIndex >= 0 && process.argv[subArgIndex + 1]
    ? process.argv[subArgIndex + 1]
    : "portsafe/locker/ack";
const lockerIdArg = process.argv.find((arg) => arg.startsWith("--locker-id="));
const parsedLockerId = lockerIdArg ? Number(lockerIdArg.split("=")[1]) : NaN;
const lockerId =
  Number.isInteger(parsedLockerId) && parsedLockerId > 0 ? parsedLockerId : 1;
const topicArg = process.argv.find((arg) => arg.startsWith("--topic="));
const publishTopic = topicArg ? topicArg.split("=")[1] : "portsafe/locker";
const cmdTopicArg = process.argv.find((arg) => arg.startsWith("--cmd-topic="));
const commandTopic = cmdTopicArg
  ? cmdTopicArg.split("=")[1]
  : `portsafe/locker/${lockerId}/cmd`;
const waitArg = process.argv.find((arg) => arg.startsWith("--wait-ms="));
const waitMs = waitArg ? Number(waitArg.split("=")[1]) : 5000;
const onceWaitMs = Number.isFinite(waitMs) && waitMs > 0 ? waitMs : 5000;
const clientIdArg = process.argv.find((arg) => arg.startsWith("--client-id="));
const clientId = clientIdArg
  ? clientIdArg.split("=")[1]
  : `esp32-simulado-${Date.now()}`;

console.log("🧪 Modo:", onceMode ? "envio unico" : "envio continuo");
console.log("📦 Status enviado:", status);
console.log("🗄️ LockerId:", lockerId);
console.log("🆔 ClientId:", clientId);
console.log("👂 Topico de resposta:", responseTopic);
console.log("📤 Topico de envio:", publishTopic);
console.log("🎛️ Escuta de comandos:", commandMode ? "ligada" : "desligada");
if (commandMode) {
  console.log("🧭 Topico de comandos:", commandTopic);
}
console.log(
  "📨 Escuta do topico de envio:",
  listenMode ? "ligada" : "desligada",
);

const device = awsIot.device({
  keyPath: keyPath,
  certPath: certPath,
  caPath: caPath,
  clientId: clientId,
  host: "a1j1qwd3dpi3ec-ats.iot.us-east-1.amazonaws.com",
  protocol: "mqtts",
  reconnectPeriod: 5000,
  connectionTimeout: 10000,
  debug: true,
});

console.log("⏳ Tentando conectar ao AWS IoT...");

let connected = false;
let publishTimer = null;
let currentStatus = status;

function normalizeStatus(input) {
  if (input === "aberto" || input === "open") return "aberto";
  if (input === "fechado" || input === "closed") return "fechado";
  return null;
}

function applyCommand(message) {
  const cmd = (message || "").toString().trim().toLowerCase();

  if (cmd === "toggle") {
    currentStatus = currentStatus === "aberto" ? "fechado" : "aberto";
    return true;
  }

  const normalized = normalizeStatus(cmd);
  if (!normalized) return false;

  currentStatus = normalized;
  return true;
}

function publishMessage() {
  const msg = {
    lockerId,
    status: currentStatus,
    timestamp: new Date().toISOString(),
  };

  device.publish(publishTopic, JSON.stringify(msg));
  console.log("📡 Enviado:", msg);
}

const connectTimeout = setTimeout(() => {
  if (connected) return;

  console.log("⏱️ Timeout: Impossivel conectar apos 30 segundos");
  console.log("\n🔍 Possiveis problemas:");
  console.log("   1. Certificados expirados ou invalidos");
  console.log("   2. Endpoint AWS IoT incorreto");
  console.log("   3. Credenciais revogadas na conta AWS");
  console.log("   4. Problema de conectividade/firewall");
  process.exit(1);
}, 30000);

device.on("connect", () => {
  connected = true;
  clearTimeout(connectTimeout);
  console.log("🔥 Conectado ao AWS IoT");

  device.subscribe(responseTopic, { qos: 0 }, (err) => {
    if (err) {
      console.log(
        "⚠️ Falha ao assinar topico de resposta:",
        responseTopic,
        err.message,
      );
      return;
    }
    console.log("✅ Assinando resposta em:", responseTopic);
  });

  if (listenMode) {
    device.subscribe(publishTopic, { qos: 0 }, (err) => {
      if (err) {
        console.log("⚠️ Falha ao assinar topico de envio:", err.message);
        return;
      }
      console.log("✅ Assinando envio em:", publishTopic);
    });
  }

  if (commandMode) {
    device.subscribe(commandTopic, { qos: 0 }, (err) => {
      if (err) {
        console.log("⚠️ Falha ao assinar topico de comando:", err.message);
        return;
      }
      console.log("✅ Assinando comando em:", commandTopic);
    });
  }

  if (onceMode) {
    publishMessage();
    setTimeout(() => {
      device.end(false, () => process.exit(0));
    }, onceWaitMs);
    return;
  }

  publishTimer = setInterval(publishMessage, 5000);
  publishMessage();
});

device.on("error", (error) => {
  console.log("❌ ERRO COMPLETO:", error);
  if (error.code) console.log("   Código:", error.code);
  if (error.message) console.log("   Mensagem:", error.message);
  if (error.syscall) console.log("   Syscall:", error.syscall);
  if (error.errno) console.log("   Errno:", error.errno);
});

device.on("close", () => {
  console.log("⚠️ Conexão fechada");
  if (publishTimer) {
    clearInterval(publishTimer);
    publishTimer = null;
  }
});

device.on("offline", () => {
  console.log("📴 Dispositivo offline (clientId:", clientId + ")");
});

device.on("reconnect", () => {
  console.log("🔄 Tentando reconectar...");
});

device.on("message", (topic, payload) => {
  const text = payload.toString();

  if (commandMode && topic === commandTopic) {
    let handled = false;

    try {
      const data = JSON.parse(text);
      const targetLocker = Number(data.lockerId);

      if (Number.isFinite(targetLocker) && targetLocker !== lockerId) {
        console.log("⏭️ Comando ignorado: lockerId diferente", data.lockerId);
        return;
      }

      handled = applyCommand(data.command || data.status || "");
      if (handled) {
        console.log("🎛️ Comando aplicado. Novo status:", currentStatus);
        publishMessage();
      } else {
        console.log("⚠️ Comando invalido recebido:", data);
      }
      return;
    } catch {
      handled = applyCommand(text);
      if (handled) {
        console.log("🎛️ Comando aplicado. Novo status:", currentStatus);
        publishMessage();
      } else {
        console.log("⚠️ Comando invalido recebido:", text);
      }
      return;
    }
  }

  try {
    console.log("📥 Recebido [" + topic + "]:", JSON.parse(text));
  } catch {
    console.log("📥 Recebido [" + topic + "]:", text);
  }
});
