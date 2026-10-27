#!/usr/bin/env bash
# NeoSwitch TV — Android TV Studio Launcher

DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd "$DIR"

echo "======================================================="
echo "  NEOSWITCH TV // ANDROID TV STUDIO"
echo "  Colaboración: Jernel Systems & NeoTech Solutions"
echo "  GitHub: https://github.com/JernelOlart"
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
