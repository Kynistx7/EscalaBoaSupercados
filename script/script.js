// Exemplo de dados (pode vir de um banco de dados)
const cargos = ["Operadores", "Empacotadores", "Estagiarios","Operador de Estacionamento","Senac","FOLGA"];
const colaboradores = [
    { nome: "Maria Raiane", cargo: "Operadores" },
    { nome: "Gustavo", cargo: "Operadores" },
    { nome: "Bianca", cargo: "Operadores" },
    { nome: "Lucas Henrique", cargo: "Operadores" },
    { nome: "Luis", cargo: "Operadores" },
    { nome: "Ingrid", cargo: "Operadores" },
    { nome: "Victor", cargo: "Estagiarios" },
    { nome: "Ruan", cargo: "Estagiarios" },
    { nome: "Julia", cargo: "Estagiarios"},
    { nome: "Levi", cargo: "Estagiarios" },
    { nome: "Yndrigo", cargo: "Estagiarios" },
    { nome: "Jamilly", cargo: "Estagiarios" },
    { nome: "João", cargo: "Empacotadores" },
    { nome: "Larissa", cargo: "Empacotadores" },
    { nome: "Jose", cargo: "Operadores de Estacionamento"},
    { nome: "Dafiny", cargo: "Senac" },
    { nome: "Ingrid", cargo: "Senac" },
    { nome: "Vinicius", cargo: "Senac" },
    { nome: "FOLGA", cargo: "FOLGA" },
];
const dias = ["Seg", "Ter", "Qua", "Qui", "Sex", "Sab", "Dom"];
const horarios = ["06:50", "06:50", "07:00", "08:00", "09:00", "10:00", "14:00", "14:00", "14:00", "14:00", "14:00", "14:00", "16:15", "16:15", "16:15"];


// Mapeamento de horários por cargo
const horariosPorCargo = {
    "Operadores": ["06:50", "06:50", "10:00", "12:00", "14:00", "14:00", "14:00","14:00", "14:00", "14:00"],
    "Empacotadores": ["07:00","09:00", "10:00","12:00", "14:00"],
    "Estagiarios": ["07:00", "09:00", "09:00", "09:00","09:00", "10:00", "16:15", "16:15", "16:15", "16:15",],
    "Operador de Estacionamento": ["10:00", "14:00"],
    "Senac": ["09:00", "14:00","14:00"],
    "FOLGA": [] // FOLGA não tem horários específicos
};

// --- Seleção de Elementos do DOM ---
const listaColaboradores = document.getElementById("lista-colaboradores");
const quadro = document.getElementById("quadro-horarios");
const btnDownload = document.getElementById("btn-download-pdf");
const filtroCargoSelect = document.getElementById('filtro-cargo');
const filtroDiaSelect = document.getElementById('filtro-dia');
// **NOVO: Seleciona elementos do filtro de nome**
const filtroNomeInput = document.getElementById('filtro-nome');
const btnLimparFiltroNome = document.getElementById('btn-limpar-filtro-nome');

// Seleciona o botão de filtros e o contêiner de filtros
const btnToggleFiltros = document.getElementById("btn-toggle-filtros");
const filtrosContainer = document.getElementById("filtros-container");

// Adiciona um evento de clique para alternar a exibição dos filtros
btnToggleFiltros.addEventListener("click", () => {
    filtrosContainer.classList.toggle("oculto"); // Alterna a classe 'oculto'
    filtrosContainer.classList.toggle("visivel"); // Alterna a classe 'visivel'
});

// Garante que jsPDF está disponível globalmente
const { jsPDF } = window.jspdf;

// --- Preenche a lista de colaboradores ---
colaboradores.forEach(colaborador => {
    const div = document.createElement("div");
    div.textContent = `${colaborador.nome} (${colaborador.cargo})`;
    div.className = "colaborador";
    div.draggable = true;
    div.dataset.nome = colaborador.nome; // Guarda o nome aqui também
    div.dataset.cargo = colaborador.cargo; // Guarda o cargo

    div.addEventListener("dragstart", (e) => {
        e.dataTransfer.setData("text/plain", colaborador.nome);
        e.dataTransfer.setData("cargo", colaborador.cargo);
        e.dataTransfer.effectAllowed = "move";
    });

    listaColaboradores.appendChild(div);
});

// --- Preenche as opções do filtro de dia ---
dias.forEach(dia => {
    const option = document.createElement('option');
    option.value = dia;
    option.textContent = dia;
    filtroDiaSelect.appendChild(option);
});

quadro.innerHTML = ""; // Limpa qualquer conteúdo anterior

// --- Cria o quadro de horários por cargo ---
cargos.forEach(cargo => {
    // Ignora "FOLGA" como uma seção separada, ele pode ser dropado em outras
    if (cargo === "FOLGA") return;

    const cargoSection = document.createElement("div");
    cargoSection.className = "cargo-section";
    cargoSection.dataset.cargoFilter = cargo; // Usado pelo filtro de cargo

    const title = document.createElement("h2");
    title.textContent = cargo;
    cargoSection.appendChild(title);

    const diasList = document.createElement("div");
    diasList.className = "dias-list";

    dias.forEach(dia => {
        const diaDiv = document.createElement("div");
        diaDiv.className = "dia-item";
        diaDiv.dataset.diaFilter = dia; // Usado pelo filtro de dia

        const diaTitle = document.createElement("span");
        diaTitle.textContent = dia;
        diaTitle.className = "dia-title";
        diaDiv.appendChild(diaTitle);

        const horariosGrid = document.createElement("div");
        horariosGrid.className = "horarios-grid";

        // Obtém os horários específicos para o cargo atual
        const horariosEspecificos = horariosPorCargo[cargo] || [];

        horariosEspecificos.forEach(horario => {
            const slot = document.createElement("div");
            slot.className = "slot";
            slot.dataset.cargo = cargo; // Cargo esperado neste slot
            slot.textContent = horario; // Texto inicial é o horário
            slot.dataset.originalTime = horario; // Guarda o horário original

            slot.addEventListener("dragover", (e) => {
                e.preventDefault();
                e.dataTransfer.dropEffect = "move";
            });

            slot.addEventListener("drop", (e) => {
                e.preventDefault();
                const nome = e.dataTransfer.getData("text/plain");
                const cargoDrop = e.dataTransfer.getData("cargo");
                const slotCargo = slot.dataset.cargo;

                const isModoEdicao = verificarModoEdicaoDiaColaborador();
                const nomeFiltroAtual = filtroNomeInput.value.trim().toLowerCase();

                if (isModoEdicao && nome.toLowerCase() !== nomeFiltroAtual && nome !== 'FOLGA') {
                    alert(`Modo de Edição Dia/Colaborador:\nSó é permitido alocar '${filtroNomeInput.value}' ou 'FOLGA' neste dia.\nLimpe o filtro de nome para alocar outros.`);
                    return;
                }

                if (cargoDrop === "FOLGA" || cargoDrop === slotCargo) {
                    // Verifica se já não está preenchido COM O MESMO NOME
                    // (Permite substituir um nome por outro, ou FOLGA por nome, etc.)
                    // Remove o nome anterior se houver
                    if(slot.classList.contains('slot-filled')) {
                        slot.textContent = slot.dataset.originalTime; // Limpa visualmente
                        delete slot.dataset.assignedName; // Remove o nome antigo do dataset
                        slot.classList.remove('slot-filled');
                    }

                    slot.textContent = `${slot.dataset.originalTime}: ${nome}`;
                    slot.classList.add("slot-filled");
                    slot.dataset.assignedName = nome; // **NOVO: Armazena o nome atribuído**

                    // **IMPORTANTE:** Reaplicar filtros após drop pode ser necessário
                    // se o drop tornar um slot visível que estava oculto pelo filtro de nome
                    aplicarTodosFiltros();

                } else {
                    alert(`Erro: ${nome} (${cargoDrop}) não pode ser escalado em ${slotCargo}.`);
                }
            });

            slot.addEventListener('click', function () {
                if (confirm("Deseja realmente remover este slot?")) {
                    this.remove(); // Remove o slot do DOM
                    console.log("Slot removido.");
                }
            });

            horariosGrid.appendChild(slot);
        });

        diaDiv.appendChild(horariosGrid);
        diasList.appendChild(diaDiv);
    });

    cargoSection.appendChild(diasList);
    quadro.appendChild(cargoSection);
});


// --- Função Auxiliar para Checar Modo de Edição Específico ---
function verificarModoEdicaoDiaColaborador() {
    const cargoFiltro = filtroCargoSelect.value;
    const diaFiltro = filtroDiaSelect.value;
    const nomeFiltro = filtroNomeInput.value.trim().toLowerCase();
    return cargoFiltro !== 'todos' && diaFiltro !== 'todos' && nomeFiltro !== '';
}

// --- Função Unificada para Aplicar Todos os Filtros ---
function aplicarTodosFiltros() {
    const cargoFiltro = filtroCargoSelect.value;
    const diaFiltro = filtroDiaSelect.value;
    const nomeFiltro = filtroNomeInput.value.toLowerCase(); // Obtém o valor selecionado no filtro de nome

    const isModoEdicaoDiaColaborador = verificarModoEdicaoDiaColaborador();

    const secoes = document.querySelectorAll('.cargo-section');

    secoes.forEach(secao => {
        const cargoDaSecao = secao.dataset.cargoFilter;
        const mostrarSecao = (cargoFiltro === 'todos' || cargoDaSecao === cargoFiltro);
        secao.style.display = mostrarSecao ? 'block' : 'none';

        if (mostrarSecao) {
            const diasItensDaSecao = secao.querySelectorAll('.dia-item');
            diasItensDaSecao.forEach(diaItem => {
                const diaDoItem = diaItem.dataset.diaFilter;
                let mostrarDiaItem = (diaFiltro === 'todos' || diaDoItem === diaFiltro);
                let displayFinalDia = mostrarDiaItem ? 'flex' : 'none';

                if (mostrarDiaItem) {
                    let algumSlotVisivelNoDia = false;
                    const slotsDoDia = diaItem.querySelectorAll('.slot');

                    slotsDoDia.forEach(slot => {
                        const nomeAtribuido = slot.dataset.assignedName ? slot.dataset.assignedName.toLowerCase() : null;
                        const estaPreenchido = slot.classList.contains('slot-filled');
                        let mostrarSlot = false;

                        if (isModoEdicaoDiaColaborador) {
                            if (!estaPreenchido || (estaPreenchido && nomeAtribuido === nomeFiltro)) {
                                mostrarSlot = true;
                                algumSlotVisivelNoDia = true;
                            }
                        } else if (nomeFiltro !== '') {
                            if (estaPreenchido && nomeAtribuido && nomeAtribuido.includes(nomeFiltro)) {
                                mostrarSlot = true;
                                algumSlotVisivelNoDia = true;
                            }
                        } else {
                            mostrarSlot = true;
                            algumSlotVisivelNoDia = true;
                        }

                        slot.style.display = mostrarSlot ? 'block' : 'none';
                    });

                    if (!algumSlotVisivelNoDia && (isModoEdicaoDiaColaborador || nomeFiltro !== '')) {
                        displayFinalDia = 'none';
                    }
                }

                diaItem.style.display = displayFinalDia;
            });
        }
    });
}

// --- Event Listeners para os Filtros ---
filtroCargoSelect.addEventListener('change', aplicarTodosFiltros);
filtroDiaSelect.addEventListener('change', aplicarTodosFiltros);
// **NOVO: Listener para o input de nome (filtra enquanto digita)**
filtroNomeInput.addEventListener('input', aplicarTodosFiltros);
// **NOVO: Listener para limpar o filtro de nome**
btnLimparFiltroNome.addEventListener('click', () => {
    filtroNomeInput.value = ''; // Limpa o campo
    aplicarTodosFiltros(); // Reaplica os filtros (agora sem o nome)
});

// Preenche o filtro de nome com os colaboradores
function preencherFiltroDeNomes() {
    filtroNomeInput.innerHTML = '<option value="">Todos</option>'; // Adiciona a opção "Todos"
    colaboradores.forEach(colaborador => {
        const option = document.createElement('option');
        option.value = colaborador.nome.toLowerCase(); // Valor em minúsculas para facilitar a comparação
        option.textContent = colaborador.nome; // Exibe o nome original
        filtroNomeInput.appendChild(option);
    });
}

// --- Lógica para Download do PDF ---
btnDownload.addEventListener("click", () => {
    console.log("Iniciando geração do PDF...");
    const quadroParaPdf = document.getElementById("quadro-horarios");
    const options = {
        scale: 2,
        useCORS: true,
        backgroundColor: '#ffffff'
    };

    // Salva os valores atuais dos filtros
    const currentCargoFilter = filtroCargoSelect.value;
    const currentDiaFilter = filtroDiaSelect.value;
    const currentNomeFilter = filtroNomeInput.value;

    // Mostra tudo temporariamente para o PDF (reseta filtros)
    filtroCargoSelect.value = 'todos';
    filtroDiaSelect.value = 'todos';
    filtroNomeInput.value = '';
    aplicarTodosFiltros(); // Aplica a visualização completa

    // Adiciona um pequeno delay para garantir que o DOM atualizou a visibilidade
    setTimeout(() => {
        html2canvas(quadroParaPdf, options).then(canvas => {
            console.log("Canvas gerado a partir do HTML.");
            const imgData = canvas.toDataURL('image/png');
            const margin = 10;
            const imgWidth = canvas.width;
            const imgHeight = canvas.height;

            // Usa mm como unidade padrão do jsPDF
            const pdfWidthMm = 210; // Largura A4 como referência
            const effectivePdfWidthMm = pdfWidthMm - 2 * margin;
            const ratio = effectivePdfWidthMm / imgWidth;
            const scaledImgHeightMm = imgHeight * ratio;
            const totalPdfHeightMm = scaledImgHeightMm + 2 * margin; // Altura total necessária

            // Cria PDF com tamanho customizado [largura, altura]
            const pdf = new jsPDF('p', 'mm', [pdfWidthMm, totalPdfHeightMm]);

            pdf.addImage(imgData, 'PNG', margin, margin, effectivePdfWidthMm, scaledImgHeightMm);
            pdf.save('escala_de_trabalho_pagina_unica.pdf');

        }).catch(error => {
            console.error("Erro ao gerar o PDF:", error);
            alert("Ocorreu um erro ao gerar o PDF. Verifique o console para mais detalhes.");
        }).finally(() => {
            // Restaura os filtros para os valores originais INDEPENDENTEMENTE de sucesso ou erro
            console.log("Restaurando filtros...");
            filtroCargoSelect.value = currentCargoFilter;
            filtroDiaSelect.value = currentDiaFilter;
            filtroNomeInput.value = currentNomeFilter;
            aplicarTodosFiltros(); // Reaplica os filtros originais
            console.log("Filtros restaurados.");
        });
    }, 250); // Aumentei um pouco o delay para dar mais tempo de renderização

});

// Função para atualizar a lista de colaboradores com base no filtro de cargo
function atualizarListaColaboradores() {
    const cargoFiltro = filtroCargoSelect.value; // Obtém o cargo selecionado no filtro
    listaColaboradores.innerHTML = ""; // Limpa a lista de colaboradores

    // Filtra os colaboradores com base no cargo selecionado
    const colaboradoresFiltrados = colaboradores.filter(colaborador => 
        cargoFiltro === "todos" || colaborador.cargo === cargoFiltro
    );

    // Adiciona os colaboradores filtrados à lista
    colaboradoresFiltrados.forEach(colaborador => {
        const div = document.createElement("div");
        div.textContent = `${colaborador.nome} (${colaborador.cargo})`;
        div.className = "colaborador";
        div.draggable = true;
        div.dataset.nome = colaborador.nome; // Guarda o nome aqui também
        div.dataset.cargo = colaborador.cargo; // Guarda o cargo

        // Evento de arrastar
        div.addEventListener("dragstart", (e) => {
            e.dataTransfer.setData("text/plain", colaborador.nome);
            e.dataTransfer.setData("cargo", colaborador.cargo);
            e.dataTransfer.effectAllowed = "move";
        });

        listaColaboradores.appendChild(div);
    });
}

// Adiciona um evento ao filtro de cargo para atualizar a lista de colaboradores
filtroCargoSelect.addEventListener("change", atualizarListaColaboradores);

// Atualiza a lista de colaboradores ao carregar a página
document.addEventListener("DOMContentLoaded", () => {
    atualizarListaColaboradores(); // Atualiza a lista de colaboradores inicialmente
});

// --- Inicialização ---
// Dispara a aplicação inicial dos filtros no carregamento da página
document.addEventListener('DOMContentLoaded', () => {
    preencherFiltroDeNomes(); // Preenche o filtro de nomes
    aplicarTodosFiltros(); // Aplica os filtros iniciais
    atualizarListaColaboradores(); // Atualiza a lista de colaboradores
});

