// Variavel para localStorage
const STORAGE_KEY = "readingStatus";
const USERNAME_KEY = "username";


////////////////////////////
// carregar dados na tabela
async function loadTableData() {
    try {
        const response = await fetch("data/data.json");
        const tableData = await response.json();

        // Carrega os estados salvos do LocalStorage
        const savedStatus = JSON.parse(localStorage.getItem(STORAGE_KEY)) || {};

        const tableBody = document.querySelector("#reading-table tbody");
        tableBody.innerHTML = "";

        // Itera pelos dados e cria as linhas da tabela
        tableData.forEach(entry => {
            const isChecked = savedStatus[entry.id] ?? entry.lido;

            const row = document.createElement("tr");
            row.innerHTML = `
                <td>${entry.mes}</td>
                <td>${entry.dia}</td>
                <td>${entry.livro_biblico}</td>
                <td>${entry.capitulo}</td>
                <td>
                    <input class=""
                        type="checkbox" 
                        data-id="${entry.id}" 
                        ${isChecked ? "checked" : ""}
                    >
                </td>
            `;

            const checkbox = row.querySelector("input[type='checkbox']");
            checkbox.addEventListener("change", () => {
                updateReadingStatus(entry.id, checkbox.checked);
                updateProgress();
            });

            tableBody.appendChild(row);
        });

        // Atualiza o progresso após carregar os dados
        updateProgress();
    } catch (error) {
        console.error("Erro ao carregar os dados da tabela:", error);
    }
}


//////////////////////
// Status da leitura
function updateReadingStatus(id, isRead) {
    const savedStatus = JSON.parse(localStorage.getItem(STORAGE_KEY)) || {};
    savedStatus[id] = isRead;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(savedStatus));
}

//////////////
// Calcular e atualizar o progresso
function updateProgress() {
    const tableData = Array.from(document.querySelectorAll("#reading-table tbody tr"));
    const totalDays = tableData.length;

    const checkedDays = tableData.filter(row =>
        row.querySelector("input[type='checkbox']").checked
    ).length;

    const progressPercent = Math.round((checkedDays / totalDays) * 100);

    const progressFill = document.querySelector("#progress-fill");
    const progressText = document.querySelector("#progress-text");

    progressFill.style.width = `${progressPercent}%`;
    progressText.textContent = `${progressPercent}% lido`;
}


////////////////////////
// Salvar carregar e salvar nome do usuario
function loadUsername() {
    const username = localStorage.getItem(USERNAME_KEY);
    const welcomeMessage = document.querySelector("#welcome-message");
    const usernameInputContainer = document.querySelector("#username-input-container");
  
    if (username) {
      welcomeMessage.textContent = `Bem-vindo, ${username}!`;
      usernameInputContainer.style.display = "none";
    } else {
      // Se o nome não estiver salvo, exiba o container do input e do botão
      usernameInputContainer.style.display = "block";
    }
  }
  
  function saveUsername() {
    const usernameInput = document.querySelector("#username-input");
    let username = usernameInput.value.trim();
  
    // Capitaliza a primeira letra
    username = username.charAt(0).toUpperCase() + username.slice(1).toLowerCase();
  
    if (username) {
      localStorage.setItem(USERNAME_KEY, username);
      loadUsername();
    }
  }


////////////////////////
// Exportar para backup
function exportProgress() {
    const savedStatus = JSON.parse(localStorage.getItem(STORAGE_KEY)) || {};

    const progressData = Object.keys(savedStatus).map(id => ({
        id,
        lido: savedStatus[id]
    }));

    const blob = new Blob([JSON.stringify({ progress: progressData }, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.href = url;
    link.download = "progress.json";
    link.click();

    URL.revokeObjectURL(url);
}


///////////////////
// Importar backup
function importProgress(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function (e) {
        try {
            const importedData = JSON.parse(e.target.result);

            // Verifica se o formato do arquivo é válido
            if (!importedData || !Array.isArray(importedData.progress)) {
                alert("Formato inválido! Certifique-se de que o arquivo seja um progresso válido.");
                return;
            }

            // Converte o array progress para um objeto no formato esperado
            const savedStatus = {};
            importedData.progress.forEach(entry => {
                if (entry.id) {
                    savedStatus[entry.id] = entry.lido;
                }
            });

            // Salva o progresso no LocalStorage
            localStorage.setItem(STORAGE_KEY, JSON.stringify(savedStatus));

            // Recarrega a tabela e o progresso
            loadTableData();
            alert("Progresso importado com sucesso!");
        } catch (error) {
            console.error("Erro ao importar progresso:", error);
            alert("Erro ao importar progresso. Verifique o arquivo e tente novamente.");
        }
    };

    reader.readAsText(file);
}


/////////////////////////////////////
// Configurar o botão de importação
document.addEventListener("DOMContentLoaded", () => {
    const importButton = document.querySelector("#import-button");
    importButton.addEventListener("click", () => {
        const fileInput = document.createElement("input");
        fileInput.type = "file";
        fileInput.accept = "application/json";
        fileInput.addEventListener("change", importProgress);
        fileInput.click();
    });
});


////////////////////
// Filtro de mes
function filterByMonth() {
    const selectedMonth = document.querySelector("#month-filter").value;
    console.log("Mês selecionado:", selectedMonth); // Verifica o valor selecionado no console

    // Carrega os dados do JSON
    fetch("data/data.json")
        .then(response => response.json())
        .then(tableData => {
            // Carrega os estados salvos do LocalStorage
            const savedStatus = JSON.parse(localStorage.getItem(STORAGE_KEY)) || {};

            // Filtra os dados com base no mês selecionado
            const filteredData = tableData.filter(entry => 
                selectedMonth === "" || entry.mes === selectedMonth
            );

            // Limpa o corpo da tabela
            const tableBody = document.querySelector("#reading-table tbody");
            tableBody.innerHTML = "";

            // Itera pelos dados filtrados e cria as linhas da tabela
            filteredData.forEach(entry => {
                const isChecked = savedStatus[entry.id] ?? entry.lido; // Verifica se o item foi marcado como lido

                const row = document.createElement("tr");
                row.innerHTML = `
                    <td>${entry.mes}</td>
                    <td>${entry.dia}</td>
                    <td>${entry.livro_biblico}</td>
                    <td>${entry.capitulo}</td>
                    <td>
                        <input 
                            type="checkbox" 
                            data-id="${entry.id}" 
                            ${isChecked ? "checked" : ""}
                        >
                    </td>
                `;

                // Adiciona evento para alterar o estado de leitura
                const checkbox = row.querySelector("input[type='checkbox']");
                checkbox.addEventListener("change", () => {
                    updateReadingStatus(entry.id, checkbox.checked);
                    updateProgress();
                });

                tableBody.appendChild(row);
            });

            // Atualiza o progresso
            updateProgress();
        })
        .catch(error => console.error("Erro ao carregar os dados:", error));
}

// Adicionando evento ao filtro de mês
document.querySelector("#month-filter").addEventListener("change", filterByMonth);



///////////////////
// Resumo do dia
function loadDailySummary() {
    const today = new Date();
    const currentDay = today.getDate();
    const currentMonth = today.toLocaleString("pt-BR", { month: "long" }); // Exemplo: "janeiro"

    // Carrega os dados do JSON
    fetch("data/data.json")
        .then(response => response.json())
        .then(tableData => {
            // Filtra os dados para o dia e mês atuais
            const dailyEntries = tableData.filter(entry =>
                entry.dia === currentDay && entry.mes.toLowerCase() === currentMonth.toLowerCase()
            );

            const summaryList = document.querySelector("#summary-list");
            summaryList.innerHTML = ""; // Limpa o conteúdo anterior

            if (dailyEntries.length > 0) {
                // Itera pelos capítulos do dia atual
                dailyEntries.forEach(entry => {
                    const listItem = document.createElement("li");
                    listItem.textContent = `${entry.livro_biblico} ${entry.capitulo}`;
                    summaryList.appendChild(listItem);
                });
            } else {
                summaryList.innerHTML = "<li>Sem leituras para hoje!</li>";
            }
        })
        .catch(error => console.error("Erro ao carregar o resumo diário:", error));
}

// Carrega o resumo diário ao iniciar
document.addEventListener("DOMContentLoaded", loadDailySummary);


///////////////////
// Dias nao lidos
// function showUnreadPreviousDays() {
//     // Obter a data atual
//     const today = new Date();
//     const todayDay = today.getDate(); // Dia atual
//     const todayMonthIndex = today.getMonth(); // Índice do mês atual (0 = Janeiro, 1 = Fevereiro, etc.)

//     // Mapear os nomes dos meses para seus índices
//     const monthMap = {
//         "Janeiro": 0,
//         "Fevereiro": 1,
//         "Março": 2,
//         "Abril": 3,
//         "Maio": 4,
//         "Junho": 5,
//         "Julho": 6,
//         "Agosto": 7,
//         "Setembro": 8,
//         "Outubro": 9,
//         "Novembro": 10,
//         "Dezembro": 11
//     };

//     // Carregar os dados da tabela
//     fetch("data/data.json")
//         .then(response => response.json())
//         .then(tableData => {
//             // Carregar o status de leitura do LocalStorage
//             const savedStatus = JSON.parse(localStorage.getItem(STORAGE_KEY)) || {};

//             // Filtrar os dias anteriores a hoje que ainda não foram lidos
//             const unreadPreviousDays = tableData.filter(entry => {
//                 const entryMonthIndex = monthMap[entry.mes]; // Índice do mês do registro
//                 const entryDay = entry.dia; // Dia do registro

//                 // Verifica se o registro é anterior à data atual
//                 const isBeforeToday = 
//                     (entryMonthIndex < todayMonthIndex) || 
//                     (entryMonthIndex === todayMonthIndex && entryDay < todayDay);

//                 // Retornar apenas entradas não lidas
//                 return isBeforeToday && !savedStatus[entry.id];
//             });

//             // Exibe a quantidade de dias não lidos
//             const unreadCount = unreadPreviousDays.length;

//             // Atualizar o texto no frontend
//             const summaryElement = document.querySelector("#unread-summary");
//             if (unreadCount === 0) {
//                 summaryElement.textContent = "Leitura em dia!";
//             } else {
//                 summaryElement.textContent = `${unreadCount} dia(s) em atraso.`;
//             }
//         })
//         .catch(error => console.error("Erro ao carregar os dados:", error));
// }

function showUnreadPreviousDays() {
    // Obter a data atual
    const today = new Date();
    const todayDay = today.getDate(); // Dia atual
    const todayMonthIndex = today.getMonth(); // Índice do mês atual (0 = Janeiro, 1 = Fevereiro, etc.)

    // Mapear os nomes dos meses para seus índices
    const monthMap = {
        "Janeiro": 0,
        "Fevereiro": 1,
        "Março": 2,
        "Abril": 3,
        "Maio": 4,
        "Junho": 5,
        "Julho": 6,
        "Agosto": 7,
        "Setembro": 8,
        "Outubro": 9,
        "Novembro": 10,
        "Dezembro": 11
    };

    // Carregar os dados da tabela
    fetch("data/data.json")
        .then(response => response.json())
        .then(tableData => {
            // Carregar o status de leitura do LocalStorage
            const savedStatus = JSON.parse(localStorage.getItem(STORAGE_KEY)) || {};

            // Filtrar os dias anteriores a hoje que ainda não foram lidos
            const unreadPreviousDays = tableData.filter(entry => {
                const entryMonthIndex = monthMap[entry.mes]; // Índice do mês do registro
                const entryDay = entry.dia; // Dia do registro

                // Verifica se o registro é anterior à data atual
                const isBeforeToday = 
                    (entryMonthIndex < todayMonthIndex) || 
                    (entryMonthIndex === todayMonthIndex && entryDay < todayDay);

                // Retornar apenas entradas não lidas
                return isBeforeToday && !savedStatus[entry.id];
            });

            // Exibe a quantidade de dias não lidos
            const unreadCount = unreadPreviousDays.length;
            const totalDaysExpected = todayDay; // Quantidade de dias esperados até hoje no mês

            // Atualizar o texto no frontend
            const summaryElement = document.querySelector("#unread-summary");
            if (unreadCount === 0) {
                if (unreadPreviousDays.length > totalDaysExpected) {
                    summaryElement.textContent = "Ótimo! Você está adiantado!";
                } else {
                    summaryElement.textContent = "Leitura em dia!";
                }
            } else {
                summaryElement.textContent = `${unreadCount} dia(s) em atraso.`;
            }
        })
        .catch(error => console.error("Erro ao carregar os dados:", error));
}


// Atualiza o estado de leitura no LocalStorage
function updateReadingStatus(id, isRead) {
    const savedStatus = JSON.parse(localStorage.getItem(STORAGE_KEY)) || {};
    savedStatus[id] = isRead;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(savedStatus));

    // Chama a função para atualizar a lista de dias não lidos
    showUnreadPreviousDays();
}

// Chamar a função ao carregar os dados
document.addEventListener("DOMContentLoaded", () => {
    showUnreadPreviousDays();
});


///////////////////////////
// Configuracoes iniciais
document.addEventListener("DOMContentLoaded", () => {
    // Carrega os dados da tabela
    loadTableData();

    // Carrega o nome do usuário
    loadUsername();

    // Evento para salvar o nome do usuário
    document.querySelector("#save-username").addEventListener("click", saveUsername);

    // Evento para exportar o progresso
    document.querySelector("#export-button").addEventListener("click", exportProgress);
});

