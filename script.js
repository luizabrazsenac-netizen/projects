//Memory game
//Manipulação DOM, eventos, arrays, timer e modal
 
//************ variáveis globais ****************/
//array que armazena as cartas do jogo
let cards = [];
//array que armazena as cartas que estão viradas atualmente (max 2)
let flippedCards = [];
//contador de pares encontrados (vitória quando atingir o total de pares)
let matchedPairs = 0;
//contador de movimentos do jogador (cada vez que vira 2 cartas),
let moves = 0;
//Pontuação total do jogador
let score = 0;
//Tempo decorrido no jogo (até ganhar)
let timer = 0;
//referência do intervalo do timer (para usar posteriormente)
let timerInterval = null;
//status do jogo (ativo ou não)
let gameActive = true;
//Tamanho do tabuleiro 4 ou 6
let currentSize = 4;
//Trava o tabuleiro durante animações (evita bugs)
let lockBoard = false;
 
//================== Dados do jogo ==============//
//Array com os emojis que serão usados nas cartas
//cada par usa um ícone diferente
const icons = [
    '🐶', '🐱', '🐭', '🐹', '🐰', '🦊', '🐻', '🐼',
    '🐨', '🐯', '🦁', '🐮', '🐷', '🐸', '🐵', '🐔',
    '🐧', '🐦', '🐴', '🦄', '🐌', '🐝', '🐙', '🦋'
];
 
//============= Funções principais ===============//
//Função startGame, inicia o jogo com um tamanho específico (4x4 ou 6x6)
function startGame(size){
    //Limpar o timer(se existir)
    if(timerInterval){
        clearInterval(timerInterval);
    }
    //Reseta várias variáveis do jogo em todo reinício
    timer = 0;
    moves = 0;
    score = 0;
    matchedPairs = 0;
    flippedCards = [];
    gameActive = true;
    lockBoard = false;
    currentSize = size;
 
    //Atualiza a interface com valores resetados / função abaixo do startGame
    //updateUI();
   
    //Calcula quantas cartas serão necessárias
    const totalCards = size * size;
    //Calcula o total de pares
    const totalPairs = totalCards / 2;
    //Seleciona os ícones necessários respeitando os pares
    const selectedIcons = icons.slice(0,totalPairs)
    //Array com os pares selecionados(cada ícone duas vezes)
    let cardIcons = [...selectedIcons, ...selectedIcons];
 
    //Embaralhamento das cartas (algoritmo fisher-yates)
    for (let i = cardIcons.length - 1; i>0; i--){
        const j = Math.floor(Math.random() * (i+1));
        [cardIcons[i],cardIcons[j]] = [cardIcons[j],cardIcons[i]]
    }
 
    //Criar os objetos (cartas) com seus respectivos estados de execução
    cards = cardIcons.map((icon,index) =>({
        id: index,
        icon: icon,
        flipped: false,
        matched: false
    }));
 
    //Função de renderização do tabuleiro (criada abaixo do startGame)
    renderBoard();
    //Função de iniciar o timer do jogo (criada abaixo do startGame)
    startTime();
    //Tocador de sons (criada abaixo do startGame)
    playSound();
}
 
//Função de criação do tabuleiro (cria dinâmicamente baseado no estado)
function renderBoard(){;
    //Selecionamos o elemento html a ser manipulado
    const board = document.getElementById('gameBoard')
    //Calcula quantas colunas terá o grid (baseado no tamanho 4 ou 6)
    const cols = currentSize;
    //aplica o bootstrap a constante javascript
    board.className = 'row g-2';
    //limpa o conteúdo atual do tabuleiro
    board.innerHTML = '';
 
    //loop para criar cada carta individualmente
    for(let i = 0; i<cards.length; i++){
        const card = cards[i];
       
        //cria uma coluna no grid (responsivo)
        const col = document.createElement('div');
        col.className = 'col-${Math.floor(12/cols)}';
 
        //Cria o HTML com as classes corretas
        // se carta virada ou combinada mostra o ícone ou "?"
        col.innerHTML = `
            <div class = "memory-card ${card.flipped || card.matched ? 'flipped':''}
            ${card.matched ? 'matched':''}
            onclick="flipCard(${card.id})">
                ${card.flipped || card.matched ? '<span>${card.icon}</span>' : '<i class = "bi bi-question-lg"></i>' }
            </div>
        `;
        //Adicona  a coluna no tabuleiro
        board.append(col);
    }
}
 
//Função de flipcard executa quando um jogador clica em uma carta
function flipCard(cardID){
    //Validações (impedem ações inválidas ou possíveis bugs)
    //Se a animação do tabuleiro demorar ele deve esperar
    if (lockBoard) return;
    //Se o jogo não está ativo, não faz nada
    if(!gameActive) return;
    //Se já tem 2 cartas viradas, não permite virar mais uma
    if(flippedCards.length >= 2)return;
    //Busca a carta pelo ID
    const card = cards[cardID];
    //Se carta já virada, não faz nada
    if(card.flipped)return;
    //Se a carta já foi combinada (matched), não faz nada
    if(card.matched)return;
    //Reenderiza o tabuleiro novamente para mostrar a carta virada
    renderBoard();
    //Toca o som de virar carta
    playSound('flip');
 
    //verificação: se temos 2 cartas viradas, verifica se tornou um par
    if (flippedCards.length === 2){
        //Incrementa o contador de movimento
        moves++;
        //Atualiza a interface com o novo número de movimentos
        updateUI();
        //Verifica a combinação
        checkMatch();
    }
}
 
//Função checkMatch, verifica se as cartas formam um par
function checkMatch(){
    //Pega as duas cartas viradas
    const [card1, card2] = flippedCards;
 
    //verifica se os ícones são iguais
    if(card1.icon === card2.icon){
        //se par econtrado, mas as duas cartas como "combinadas"
        card1.matched = true;
        card2.matched = true;
 
        //Reseta o estado "virada" (não precisa mais)
        card1.flipped = false;
        card1.flipped = false;
 
        //incrementa o contador de pares encontrados
        matchedPairs++;
 
        //calcula a pontuação (100 pontos por par)
        const pointsEarned = 100;
        score += pointsEarned;
 
        //Atualiza interface com a nova pontuação
        updateUI();
 
        //toca som de "acertou"
        playSound('match');
 
        //Adiciona animação de pulso nas cartas
        highlightMatch(card1.id, card2.id);
 
        //verifica se o jogo terminou
        //se todos os pares combinaram, jogador venceu
        if(matchedPairs === cards.length / 2){
            gameVictory();
        }
 
        //limpa o array de cartas viradas
        flippedCards = [];
 
        //re-enderiza o tabuleiro
        renderBoard();
    }else{
        //Par não encontrado
        //trava o tabuleiro durante as animações
        lockBoard = true;
 
        //som de erooou
        playSound('wrong');
 
        //aguarda 800ms e depois desvira as cartas em caso de erro
        setTimeout(()=>{
            //Desvira as duas cartas
            card1.flipped = false;
            card2.flipped = false;
 
            //Limpa a array de cartas viradas
            flippedCards = [];
 
            //Re-enderiza o tabuleiro
            renderBoard();
        },800);
    }
}