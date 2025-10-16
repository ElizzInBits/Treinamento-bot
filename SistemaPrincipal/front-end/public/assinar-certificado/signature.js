class SignaturePad {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.isDrawing = false;
        this.hasSignature = false;
        
        this.setupCanvas();
        this.bindEvents();
    }
    
    setupCanvas() {
        const rect = this.canvas.getBoundingClientRect();
        this.canvas.width = rect.width * 2;
        this.canvas.height = rect.height * 2;
        this.ctx.scale(2, 2);
        
        this.ctx.strokeStyle = '#000';
        this.ctx.lineWidth = 2;
        this.ctx.lineCap = 'round';
        this.ctx.lineJoin = 'round';
    }
    
    bindEvents() {
        // Mouse events
        this.canvas.addEventListener('mousedown', (e) => this.startDrawing(e));
        this.canvas.addEventListener('mousemove', (e) => this.draw(e));
        this.canvas.addEventListener('mouseup', () => this.stopDrawing());
        this.canvas.addEventListener('mouseout', () => this.stopDrawing());
        
        // Touch events
        this.canvas.addEventListener('touchstart', (e) => {
            e.preventDefault();
            this.startDrawing(e.touches[0]);
        });
        this.canvas.addEventListener('touchmove', (e) => {
            e.preventDefault();
            this.draw(e.touches[0]);
        });
        this.canvas.addEventListener('touchend', (e) => {
            e.preventDefault();
            this.stopDrawing();
        });
    }
    
    getCoordinates(e) {
        const rect = this.canvas.getBoundingClientRect();
        return {
            x: e.clientX - rect.left,
            y: e.clientY - rect.top
        };
    }
    
    startDrawing(e) {
        this.isDrawing = true;
        const coords = this.getCoordinates(e);
        this.ctx.beginPath();
        this.ctx.moveTo(coords.x, coords.y);
    }
    
    draw(e) {
        if (!this.isDrawing) return;
        
        const coords = this.getCoordinates(e);
        this.ctx.lineTo(coords.x, coords.y);
        this.ctx.stroke();
        
        this.hasSignature = true;
        document.getElementById('saveBtn').disabled = false;
    }
    
    stopDrawing() {
        this.isDrawing = false;
        this.ctx.beginPath();
    }
    
    clear() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.hasSignature = false;
        document.getElementById('saveBtn').disabled = true;
    }
    
    getDataURL() {
        return this.canvas.toDataURL('image/png');
    }
}

// Variáveis globais
let signaturePad;
let currentToken;
let currentTab = 'draw';
let selectedFont = null;
let typedSignatureData = null;

// Inicialização
document.addEventListener('DOMContentLoaded', function() {
    // Obter token da URL
    const pathParts = window.location.pathname.split('/');
    currentToken = pathParts[pathParts.length - 1];
    
    if (!currentToken || currentToken === 'index.html') {
        showError('Token de assinatura não encontrado na URL');
        return;
    }
    
    // Inicializar canvas de assinatura
    const canvas = document.getElementById('signatureCanvas');
    signaturePad = new SignaturePad(canvas);
    
    // Carregar dados do certificado
    loadCertificateData();
    
    // Configurar eventos para assinatura digitada
    setupTypedSignature();
});

// Configurar assinatura digitada
function setupTypedSignature() {
    const nameInput = document.getElementById('nameInput');
    nameInput.addEventListener('input', updatePreview);
}

// Alternar entre abas
function showTab(tab) {
    currentTab = tab;
    
    // Atualizar botões
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
    document.querySelector(`[onclick="showTab('${tab}')"]`).classList.add('active');
    
    // Mostrar/esconder abas
    document.getElementById('drawTab').style.display = tab === 'draw' ? 'block' : 'none';
    document.getElementById('typeTab').style.display = tab === 'type' ? 'block' : 'none';
    
    // Resetar estados
    if (tab === 'draw') {
        signaturePad.clear();
    } else {
        clearTypedSignature();
    }
}

// Selecionar fonte
function selectFont(fontType) {
    selectedFont = fontType;
    
    // Atualizar seleção visual
    document.querySelectorAll('.font-option').forEach(option => option.classList.remove('selected'));
    document.querySelector(`[onclick="selectFont('${fontType}')"]`).classList.add('selected');
    
    // Marcar radio button
    document.getElementById('font' + fontType.slice(-1)).checked = true;
    
    updatePreview();
}

// Atualizar prévia da assinatura
function updatePreview() {
    const nameInput = document.getElementById('nameInput');
    const previewDiv = document.getElementById('previewSignature');
    const previewContainer = document.getElementById('signaturePreview');
    const saveBtn = document.getElementById('saveTypedBtn');
    
    const name = nameInput.value.trim();
    
    if (name && selectedFont) {
        previewDiv.textContent = name;
        previewDiv.className = selectedFont;
        previewContainer.style.display = 'block';
        saveBtn.disabled = false;
        
        // Gerar dados da assinatura
        generateTypedSignature(name, selectedFont);
    } else {
        previewContainer.style.display = 'none';
        saveBtn.disabled = true;
        typedSignatureData = null;
    }
}

// Gerar assinatura digitada como imagem
function generateTypedSignature(text, fontClass) {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    // Configurar canvas
    canvas.width = 400;
    canvas.height = 100;
    
    // Configurar fonte baseada na classe
    let fontFamily;
    switch(fontClass) {
        case 'cursive1':
            fontFamily = 'Dancing Script, cursive';
            break;
        case 'cursive2':
            fontFamily = 'Great Vibes, cursive';
            break;
        case 'cursive3':
            fontFamily = 'Kaushan Script, cursive';
            break;
        default:
            fontFamily = 'cursive';
    }
    
    // Desenhar texto
    ctx.font = 'italic 28px ' + fontFamily;
    ctx.fillStyle = '#000';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, canvas.width / 2, canvas.height / 2);
    
    // Salvar dados
    typedSignatureData = canvas.toDataURL('image/png');
}

// Limpar assinatura digitada
function clearTypedSignature() {
    document.getElementById('nameInput').value = '';
    document.getElementById('signaturePreview').style.display = 'none';
    document.getElementById('saveTypedBtn').disabled = true;
    
    // Limpar seleção de fonte
    document.querySelectorAll('.font-option').forEach(option => option.classList.remove('selected'));
    document.querySelectorAll('input[name="fontStyle"]').forEach(radio => radio.checked = false);
    
    selectedFont = null;
    typedSignatureData = null;
}

// Salvar assinatura digitada
async function saveTypedSignature() {
    if (!typedSignatureData) {
        showError('Por favor, digite seu nome e escolha um estilo de fonte');
        return;
    }
    
    const saveBtn = document.getElementById('saveTypedBtn');
    const loading = document.getElementById('loading');
    
    // Mostrar loading
    saveBtn.disabled = true;
    loading.style.display = 'block';
    hideMessages();
    
    try {
        const response = await fetch(`/api/assinatura/salvar/${currentToken}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                assinatura: typedSignatureData
            })
        });
        
        const result = await response.json();
        
        if (result.sucesso) {
            showSuccess(`${result.mensagem}<br><br>
                <a href="/api/assinatura/download/${result.certificado}" 
                   class="btn btn-primary" 
                   style="margin-top: 10px; text-decoration: none;">
                   📅 Baixar Certificado Assinado
                </a>`);
        } else {
            showError(result.erro || 'Erro ao salvar assinatura');
        }
        
    } catch (error) {
        console.error('Erro ao salvar assinatura:', error);
        showError('Erro ao processar assinatura. Tente novamente.');
    } finally {
        loading.style.display = 'none';
        saveBtn.disabled = false;
    }
}

// Carregar dados do certificado
async function loadCertificateData() {
    try {
        const response = await fetch(`/api/assinatura/dados/${currentToken}`);
        const data = await response.json();
        
        if (data.erro) {
            showError(data.erro);
            return;
        }
        
        // Exibir dados do usuário
        document.getElementById('userName').textContent = data.usuario.nome;
        document.getElementById('userEmail').textContent = data.usuario.email;
        document.getElementById('userInfo').style.display = 'block';
        
    } catch (error) {
        console.error('Erro ao carregar dados:', error);
        showError('Erro ao carregar dados do certificado');
    }
}

// Limpar assinatura
function clearSignature() {
    signaturePad.clear();
}

// Salvar assinatura desenhada
async function saveSignature() {
    if (!signaturePad.hasSignature) {
        showError('Por favor, desenhe sua assinatura antes de continuar');
        return;
    }
    
    const saveBtn = document.getElementById('saveBtn');
    const loading = document.getElementById('loading');
    
    // Mostrar loading
    saveBtn.disabled = true;
    loading.style.display = 'block';
    hideMessages();
    
    try {
        const signatureData = signaturePad.getDataURL();
        
        const response = await fetch(`/api/assinatura/salvar/${currentToken}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                assinatura: signatureData
            })
        });
        
        const result = await response.json();
        
        if (result.sucesso) {
            showSuccess(`${result.mensagem}<br><br>
                <a href="/api/assinatura/download/${result.certificado}" 
                   class="btn btn-primary" 
                   style="margin-top: 10px; text-decoration: none;">
                   📥 Baixar Certificado Assinado
                </a>`);
        } else {
            showError(result.erro || 'Erro ao salvar assinatura');
        }
        
    } catch (error) {
        console.error('Erro ao salvar assinatura:', error);
        showError('Erro ao processar assinatura. Tente novamente.');
    } finally {
        loading.style.display = 'none';
        saveBtn.disabled = false;
    }
}

// Mostrar mensagem de sucesso
function showSuccess(message) {
    const successDiv = document.getElementById('successMessage');
    successDiv.innerHTML = message;
    successDiv.style.display = 'block';
    
    // Esconder área de assinatura
    document.querySelector('.signature-area').style.display = 'none';
}

// Mostrar mensagem de erro
function showError(message) {
    const errorDiv = document.getElementById('errorMessage');
    errorDiv.textContent = message;
    errorDiv.style.display = 'block';
}

// Esconder mensagens
function hideMessages() {
    document.getElementById('successMessage').style.display = 'none';
    document.getElementById('errorMessage').style.display = 'none';
}