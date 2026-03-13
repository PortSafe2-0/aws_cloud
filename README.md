# ☁️ PortSafe Cloud Infrastructure

Módulo de infraestrutura em nuvem do ecossistema **PortSafe 2.0**, desenvolvido como
parte do **Projeto Interdisciplinar (PI3)**.

Este módulo é responsável por hospedar e gerenciar os serviços que permitem a comunicação entre os dispositivos IoT, o backend e as aplicações do sistema, garantindo **escalabilidade, disponibilidade e monitoramento da plataforma**.

------------------------------------------------------------------------

# 🚀 Sobre o Projeto

O **PortSafe 2.0** é uma plataforma inteligente para gestão de entregas
em condomínios que integra:

- 📱 Aplicativo Mobile
- 🤖 Armários inteligentes (IoT)
- ☁️ Infraestrutura em nuvem (AWS)
- 📡 Comunicação em tempo real via MQTT
- 🖥 Interfaces industriais de monitoramento

A infraestrutura em nuvem permite que todos os componentes do sistema estejam conectados e disponíveis, garantindo o funcionamento integrado da plataforma.

------------------------------------------------------------------------

# 🎯 Objetivo do Módulo Cloud

O módulo de infraestrutura em nuvem tem como objetivo:

- Hospedar os serviços do sistema
- Garantir **disponibilidade e escalabilidade**
- Gerenciar a comunicação entre dispositivos e aplicações
- Armazenar dados do sistema
- Permitir monitoramento e registro de eventos

------------------------------------------------------------------------

# 🧠 Arquitetura do Sistema

A infraestrutura em nuvem conecta os diferentes módulos da plataforma utilizando serviços da AWS.

Aplicativo Mobile  
↓  
API Gateway  
↓  
Backend / Serviços de processamento  
↓  
Banco de dados (RDS / PostgreSQL)  
↓  
AWS IoT Core  
↓  
Dispositivos IoT (ESP32 / Arduino)

------------------------------------------------------------------------

# 🏗 Serviços Utilizados

A infraestrutura do sistema pode utilizar serviços da AWS como:

- **Amazon EC2** – Hospedagem do backend
- **Amazon RDS** – Banco de dados PostgreSQL
- **AWS IoT Core** – Comunicação com dispositivos IoT
- **Amazon S3** – Armazenamento de logs e arquivos
- **AWS Lambda** – Processamentos automáticos
- **Amazon SNS** – Sistema de notificações
- **Amazon CloudWatch** – Monitoramento e métricas

Esses serviços permitem que o sistema opere de forma **segura, escalável e monitorada**.

------------------------------------------------------------------------

# 🔄 Fluxo de Funcionamento

### 📦 Processamento de uma entrega

1. Entregador registra a entrega no aplicativo  
2. O aplicativo envia a informação para a **API na nuvem**  
3. O backend registra os dados no banco de dados  
4. O sistema envia comando para o dispositivo IoT  
5. O armário é aberto automaticamente  

### 📡 Comunicação com dispositivos

1. Dispositivos IoT enviam dados via **MQTT**  
2. A infraestrutura em nuvem recebe os dados  
3. O backend processa as informações  
4. Aplicações e interfaces exibem o status atualizado  

------------------------------------------------------------------------

# 📊 Monitoramento da Plataforma

A infraestrutura em nuvem permite acompanhar:

- 📡 Conexão dos dispositivos IoT
- 📦 Registro de entregas
- ⚠️ Eventos e alertas do sistema
- 📊 Uso dos serviços da plataforma

Essas informações ajudam a garantir a **estabilidade e o desempenho do sistema**.

------------------------------------------------------------------------

# 🔗 Integração com Outros Módulos

Este repositório faz parte do ecossistema **PortSafe 2.0**, que possui
os seguintes módulos:

Módulo | Função
------ | -----------------------------------------
IoT | Controle dos armários inteligentes
Backend | APIs e lógica de negócio
Cloud | Infraestrutura em nuvem
Mobile | Interface para moradores e entregadores
Dashboard | Monitoramento administrativo

------------------------------------------------------------------------

# 🎓 Projeto Acadêmico

Este projeto foi desenvolvido para a disciplina de **Computação em Nuvem / AWS Cloud**, integrando o **Projeto Interdisciplinar (PI3)** do curso de tecnologia.

------------------------------------------------------------------------

# 📌 Status do Projeto

🚧 Em desenvolvimento
