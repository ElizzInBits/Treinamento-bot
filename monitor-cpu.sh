#!/bin/bash

# Script para monitorar e controlar uso de CPU

echo "🔍 Monitorando uso de CPU..."

# Função para matar processos Chrome com alto uso de CPU
kill_high_cpu_chrome() {
    echo "🔍 Verificando processos Chrome com alto uso de CPU..."
    
    # Buscar processos Chrome com mais de 50% de CPU
    HIGH_CPU_PIDS=$(ps aux | grep chrome | grep -v grep | awk '$3 > 50 {print $2}')
    
    if [ ! -z "$HIGH_CPU_PIDS" ]; then
        echo "⚠️ Encontrados processos Chrome com alto uso de CPU:"
        ps aux | grep chrome | grep -v grep | awk '$3 > 50 {print "PID:", $2, "CPU:", $3"%", "CMD:", $11}'
        
        for PID in $HIGH_CPU_PIDS; do
            echo "🔪 Matando processo $PID"
            kill -9 $PID 2>/dev/null
        done
        
        echo "🔄 Reiniciando bot em 5 segundos..."
        sleep 5
        pm2 restart whatsapp-bot
    else
        echo "✅ Nenhum processo Chrome com alto uso de CPU encontrado"
    fi
}

# Função para verificar uso total de CPU
check_total_cpu() {
    CPU_USAGE=$(top -bn1 | grep "Cpu(s)" | awk '{print $2}' | sed 's/%us,//')
    CPU_NUM=$(echo $CPU_USAGE | sed 's/\..*//')
    
    echo "💻 Uso total de CPU: ${CPU_USAGE}%"
    
    if [ "$CPU_NUM" -gt 80 ]; then
        echo "🚨 CPU acima de 80%! Executando limpeza..."
        kill_high_cpu_chrome
    fi
}

# Executar verificação
check_total_cpu

# Mostrar processos atuais
echo ""
echo "📊 Processos atuais do sistema:"
echo "Chrome:"
ps aux | grep chrome | grep -v grep | head -5
echo ""
echo "Node.js:"
ps aux | grep node | grep -v grep | head -5
echo ""
echo "PM2:"
pm2 list