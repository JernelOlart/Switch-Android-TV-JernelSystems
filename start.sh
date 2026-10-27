#!/usr/bin/env bash
# JernelSystems - Android TV Sploit & Network Debugger Launcher

DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd "$DIR"

echo "======================================================="
echo "  ⚡ JERNELSYSTEMS - ANDROID TV SPLOIT // NETWORK TOOL"
echo "======================================================="

# Verificar e instalar dependencias si faltan
if [ ! -d "node_modules" ]; then
  echo "[+] Instalando dependencias necesarias..."
  npm install
fi

echo "[+] Iniciando servidor y panel interactivo..."
# Abrir navegador tras 1.5s
(sleep 1.5 && open "http://localhost:4200") &

# Ejecutar servidor Node
node server.js
