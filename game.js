// ====================
// SECTION 1: GAME STATE
// ====================

let target = "";
let currentMask = 0;
let dictionary = new Set();
let dictionaryLoaded = false;
let playedWords = [];
let currentPuzzleId = null;
let puzzles = [];
let currentPuzzleIndex = -1;
let thinkingAidUnlocked = false;
let score = 100;
let addedPairs = "";
let solutionHintUsed = false;
let puzzleStates = new Map();
let puzzleSolved = false;
let gaveUp = false;


const seriesColours = {
    blue:   "#dce9f8",
    red:    "#f8dede",
    green:  "#dff0df",
    purple: "#e9def8",
    amber:  "#f9ebcc",
    teal:   "#d6efed",
    pink:   "#f7dfeb",
    grey:   "#e5e7eb",
    yellow: "#FFFFE0"
};
// ====================
// SECTION 2: PUZZLES + DICTIONARY
// ====================

function normalizeWord(word) {
    return word
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-z]/g, "");
}
function savePuzzleState() {
    if (currentPuzzleId === null) {
        return;
    }

    puzzleStates.set(currentPuzzleId, {
        currentMask,
        playedWords: [...playedWords],
        thinkingAidUnlocked,
        score,
        addedPairs,
        solutionHintUsed,
        puzzleSolved,
        gaveUp,
        scoreMessage: document.getElementById("scoreMessage").textContent,
solutionHintResult: document.getElementById("solutionHintResult").textContent
    });
}
function loadPuzzle(puzzle) {
    // Save the puzzle we're leaving before switching.
    savePuzzleState();

    const displayTarget = puzzle.target;
    target = normalizeWord(displayTarget);

    currentPuzzleId = puzzle.id;

    currentPuzzleIndex = puzzle.id !== null
        ? puzzles.findIndex(p => p.id === puzzle.id)
        : -1;

    // Restore this puzzle if we've visited it before.
    const savedState = puzzle.id !== null
        ? puzzleStates.get(puzzle.id)
        : null;

    currentMask = savedState
        ? savedState.currentMask
        : wordToMask(target);

    playedWords = savedState
        ? [...savedState.playedWords]
        : [];

    thinkingAidUnlocked = savedState
        ? savedState.thinkingAidUnlocked
        : false;

    score = savedState ? savedState.score : 100;

    addedPairs = savedState ? savedState.addedPairs : "";

    solutionHintUsed = savedState
        ? savedState.solutionHintUsed
        : false;

    puzzleSolved = savedState
        ? savedState.puzzleSolved
        : false;
    gaveUp = savedState
    ? Boolean(savedState.gaveUp)
    : false;

    document.getElementById("score").textContent = score;

    document.getElementById("scoreMessage").textContent =
        savedState?.scoreMessage || "";

    document.getElementById("solutionHintButton").disabled =
        solutionHintUsed || puzzleSolved || gaveUp;

    document.getElementById("solutionHintResult").textContent =
        savedState?.solutionHintResult || "";

    document.getElementById("remainingPanel").style.display =
        thinkingAidUnlocked ? "block" : "none";

    document.getElementById("thinkingAidStatus").textContent =
        thinkingAidUnlocked
            ? "Thinking Aid unlocked!"
            : "Thinking aid locked.";

    document.getElementById("unlockThinkingAid").disabled =
        thinkingAidUnlocked || puzzleSolved || gaveUp;

    document.getElementById("shuffleButton").disabled =
        !thinkingAidUnlocked || puzzleSolved || gaveUp;

    document.getElementById("addPairsButton").disabled =
        !thinkingAidUnlocked || puzzleSolved || gaveUp;

    document.getElementById("revertButton").disabled =
        !thinkingAidUnlocked || puzzleSolved || gaveUp;

    document.getElementById("wordInput").disabled = puzzleSolved || gaveUp;

    document.getElementById("ccMenu").style.display = "none";
    document.getElementById("gameScreen").style.display = "block";
    

    solverReady = false;
    solverMoves = new Map();

    document.getElementById("target").textContent =
        displayTarget.toUpperCase();

    document.getElementById("puzzleNumber").textContent =
        puzzle.id !== null
            ? `${puzzle.setTitle} — Puzzle ${puzzle.position} · ${
                "★".repeat(puzzle.difficulty)
            }${"☆".repeat(5 - puzzle.difficulty)}`
            : "Random Puzzle";

    // Restore the list of words already played.
    const wordList = document.getElementById("wordList");
    wordList.innerHTML = "";

    for (const word of playedWords) {
        const listItem = document.createElement("li");
        listItem.textContent = word;
        wordList.appendChild(listItem);
    }

    document.getElementById("message").textContent =
        puzzleSolved ? "Solved!" : "";

    document.getElementById("solverResult").textContent = "";
    document.getElementById("wordInput").disabled =
    puzzleSolved || gaveUp;

    updateRemaining();

    document.getElementById("wordInput").value = "";

    if (!puzzleSolved) {
        document.getElementById("wordInput").focus();
    }

    document.getElementById("previousPuzzle").style.display =
        currentPuzzleIndex > 0 ? "inline-block" : "none";

    document.getElementById("nextPuzzle").style.display =
        currentPuzzleIndex >= 0 &&
        currentPuzzleIndex < puzzles.length - 1
            ? "inline-block"
            : "none";
}

function renderCCMenu() {
    const tbody = document.getElementById("ccSetTableBody");
    tbody.innerHTML = "";

    const sets = new Map();

    for (const puzzle of puzzles) {
        if (!sets.has(puzzle.setId)) {
            sets.set(puzzle.setId, {
                id: puzzle.setId,
                title: puzzle.setTitle,
                colour: puzzle.colour,
                description: puzzle.description,
                totalDifficulty: 0,
                puzzles: []
            });
        }

        const set = sets.get(puzzle.setId);
        set.totalDifficulty += puzzle.difficulty;
        set.puzzles.push(puzzle);
    }

    for (const set of sets.values()) {
        const row = document.createElement("tr");
        row.style.backgroundColor =
            seriesColours[set.colour] || "#ffffff";

        const puzzleCount = set.puzzles.length;
        const averageDifficulty =
            set.totalDifficulty / puzzleCount;
        const totalPossible = puzzleCount * 100;

        let earnedPoints = 0;
        let lostPoints = 0;

        for (const puzzle of set.puzzles) {
            const state = puzzleStates.get(puzzle.id);

            if (state && (state.puzzleSolved || state.gaveUp)) {
                const earned = state.gaveUp
                    ? 0
                    : Math.max(0, Math.min(100, state.score));

                earnedPoints += earned;
                lostPoints += 100 - earned;
            }
        }

        const greenPercent =
            earnedPoints / totalPossible * 100;
        const redPercent =
            lostPoints / totalPossible * 100;
        const emptyPercent =
            100 - greenPercent - redPercent;

        row.innerHTML = `
            <td class="ccSetTitle">${set.title}</td>
            <td>${set.description}</td>
            <td class="ccDifficulty">
                <div>${averageDifficulty.toFixed(1)} / 5★</div>
                <div class="difficultyBar">
                    <div
                        class="difficultyBarFill"
                        style="width: ${averageDifficulty / 5 * 100}%"
                    ></div>
                </div>
            </td>
            <td class="ccProgress">
                <div
                    class="progressBar"
                    title="${earnedPoints} points earned; ${lostPoints} lost; ${
                        totalPossible - earnedPoints - lostPoints
                    } points unattempted"
                >
                    <div
                        class="progressBarGreen"
                        style="width: ${greenPercent}%"
                    ></div>
                    <div
                        class="progressBarRed"
                        style="width: ${redPercent}%"
                    ></div>
                    <div
                        class="progressBarEmpty"
                        style="width: ${emptyPercent}%"
                    ></div>
                </div>
            </td>
        `;

        row.addEventListener("click", () => startSet(set.id));
        tbody.appendChild(row);
    }
}
function showCCMenu() {
    document.getElementById("gameScreen").style.display = "none";
    document.getElementById("ccMenu").style.display = "block";
}


function startSet(setId) {
    const firstPuzzle = puzzles.find(puzzle => puzzle.setId === setId);

    if (!firstPuzzle) {
        console.error("Set not found:", setId);
        return;
    }

    loadPuzzle(firstPuzzle);
}
function loadPuzzleById(id) {
    const puzzle = puzzles.find(p => p.id === id);

    if (!puzzle) {
        console.log("Puzzle not found:", id);
        return;
    }

    loadPuzzle(puzzle);
}


function previousPuzzle() {
    if (currentPuzzleIndex <= 0) {
        return;
    }

    loadPuzzleById(puzzles[currentPuzzleIndex - 1].id);
}


function nextPuzzle() {
    if (
        currentPuzzleIndex < 0 ||
        currentPuzzleIndex >= puzzles.length - 1
    ) {
        return;
    }

    loadPuzzleById(puzzles[currentPuzzleIndex + 1].id);
}


function newPuzzle() {
    const candidates = [...dictionary].filter(
        word => wordToMask(word) !== 0
    );

    if (candidates.length === 0) {
        document.getElementById("message").textContent =
            "No suitable words are available.";
        return;
    }

    const randomTarget =
        candidates[Math.floor(Math.random() * candidates.length)];

    loadPuzzle({
        id: null,
        target: randomTarget,
        setTitle: null
    });
}


// Load the dictionary and curated puzzles.
// Start the game only after both have loaded.

Promise.all([
    fetch("words_enable.txt").then(response => {
        if (!response.ok) {
            throw new Error("Dictionary could not be loaded.");
        }
        return response.text();
    }),

    fetch("puzzles.json").then(response => {
        if (!response.ok) {
            throw new Error("Puzzle data could not be loaded.");
        }
        return response.json();
    })
])
.then(([dictionaryText, puzzleData]) => {
    // Load dictionary.
    const words = dictionaryText
        .split(/\r?\n/)
        .map(word => word.trim().toLowerCase())
        .filter(word => word.length > 0);

    dictionary = new Set(words);
    dictionaryLoaded = true;

    // Flatten the sets into one ordered list of puzzles.
    puzzles = [];

    for (const set of puzzleData.sets) {
        if (
            !Array.isArray(set.words) ||
            !Array.isArray(set.difficulties) ||
            set.words.length !== set.difficulties.length
        ) {
            throw new Error(
                `Invalid puzzle data in set ${set.id}: ` +
                "words and difficulties must be arrays of equal length."
            );
        }

        set.words.forEach((word, index) => {
    puzzles.push({
        id: `${set.id}-${index + 1}`,
        position: index + 1,
        target: word,
        setId: set.id,
        setTitle: set.title,
        colour: set.colour,
        description: set.description,
        mode: set.mode,
        difficulty: set.difficulties[index]
    });
});
    }

    if (puzzles.length === 0) {
        throw new Error("No curated puzzles were found.");
    }

    // Populate the curated-challenge menu.
renderCCMenu();
showCCMenu();

console.log("Dictionary loaded:", dictionary.size, "words.");
})
.catch(error => {
    document.getElementById("message").textContent =
        "Error loading game data. Check that words_enable.txt " +
        "and puzzles.json are available and valid.";

    console.error(error);
});
// ====================
// SECTION 3: WORD / MASK UTILITIES
// ====================

function wordToMask(word) {
    let mask = 0;

    for (const letter of word.toLowerCase()) {
        const index = letter.charCodeAt(0) - 97;

        if (index >= 0 && index < 26) {
            mask ^= (1 << index);
        }
    }

    return mask;
}

function maskToLetters(mask) {
    let result = "";

    for (let i = 0; i < 26; i++) {
        if (mask & (1 << i)) {
            result += String.fromCharCode(97 + i).toUpperCase();
        }
    }

    return result || "—";
}


// ====================
// SECTION 4: NORMAL GAME
// ====================

function updateRemaining() {
    const original = maskToLetters(currentMask).toLowerCase();
    const remainingElement = document.getElementById("remaining");

    if (original === "—") {
        remainingElement.textContent = "—";
        return;
    }

    remainingElement.replaceChildren();

    const originalSpan = document.createElement("span");
    originalSpan.textContent = original;
    remainingElement.appendChild(originalSpan);

    if (addedPairs.length > 0) {
        const addedSpan = document.createElement("span");
        addedSpan.textContent = addedPairs;
        addedSpan.style.color = "#d97706";
        addedSpan.title = "Added using Thinking Aid";
        remainingElement.appendChild(addedSpan);
    }
}
function unlockThinkingAid() {
    if (thinkingAidUnlocked) {
        return;
    }

    thinkingAidUnlocked = true;
    score = Math.max(0, score - 20);

    document.getElementById("score").textContent = score;
    document.getElementById("scoreMessage").textContent =
        "Thinking Aid unlocked: −20 points.";

    document.getElementById("remainingPanel").style.display = "block";
    document.getElementById("thinkingAidStatus").textContent =
        "Thinking Aid unlocked!";

    document.getElementById("unlockThinkingAid").disabled = true;

    document.getElementById("shuffleButton").disabled = false;
    document.getElementById("addPairsButton").disabled = false;
    document.getElementById("revertButton").disabled = false;

    updateRemaining();
}
function revealSolutionHint() {
    if (solutionHintUsed) {
        return;
    }

    if (!dictionaryLoaded) {
        document.getElementById("solutionHintResult").textContent =
            "Dictionary is still loading.";
        return;
    }

    solutionHintUsed = true;
    score = Math.max(0, score - 20);

    document.getElementById("score").textContent = score;

    const targetMask = wordToMask(target);
    const targetWord = normalizeWord(target);

    const solutionLengths = [...dictionary]
        .filter(word =>
            normalizeWord(word) !== targetWord &&
            wordToMask(word) === targetMask
        )
        .map(word => word.length)
        .sort((a, b) => a - b);

    const result = document.getElementById("solutionHintResult");

    if (solutionLengths.length === 0) {
        result.textContent = "No 1-word solutions found.";
    } else {
        result.textContent =
            `${solutionLengths.length} solution(s): ` +
            `{${solutionLengths.join(", ")}}`;
    }

    document.getElementById("solutionHintButton").disabled = true;
}
function addWord() {
    if (puzzleSolved) {
        return;
    }

    if (!dictionaryLoaded) {
        document.getElementById("message").textContent =
            "Dictionary is still loading.";
        return;
    }

    const input = document.getElementById("wordInput");
    const word = input.value.trim().toLowerCase();

    if (word === "") {
        return;
    }

    if (!dictionary.has(word)) {
        document.getElementById("message").textContent =
            "Not in dictionary.";
        return;
    }

    if (word === target.toLowerCase()) {
        document.getElementById("message").textContent =
            "You cannot use the target word.";
        return;
    }

    currentMask ^= wordToMask(word);
    playedWords.push(word);

    const listItem = document.createElement("li");
    listItem.textContent = word;
    document.getElementById("wordList").appendChild(listItem);

    input.value = "";
    input.focus();

    updateRemaining();

    if (currentMask === 0) {
        puzzleSolved = true;
        savePuzzleState();
renderCCMenu();

        let multiplier;

        if (playedWords.length === 1) {
            multiplier = 1;
        } else if (playedWords.length === 2) {
            multiplier = 0.5;
        } else if (playedWords.length === 3) {
            multiplier = 0.25;
        } else {
            multiplier = 0;
        }

        // Apply the multiplier exactly once.
        score = Math.round(score * multiplier * 100) / 100;

        document.getElementById("score").textContent = score;
        document.getElementById("scoreMessage").textContent =
            `${playedWords.length} word(s) used · ` +
            `${multiplier}× multiplier · Final score: ${score}`;

        document.getElementById("message").textContent = "Solved!";

        // Prevent further moves or hints on this puzzle.
        document.getElementById("wordInput").disabled = true;
        document.getElementById("unlockThinkingAid").disabled = true;
        document.getElementById("solutionHintButton").disabled = true;
        document.getElementById("shuffleButton").disabled = true;
        document.getElementById("addPairsButton").disabled = true;
        document.getElementById("revertButton").disabled = true;
    } else {
        document.getElementById("message").textContent = "";
    }

    savePuzzleState();
}
function shuffleLetters() {
    const original = maskToLetters(currentMask).toLowerCase();
    
    if (original === "—") {
        return;
    }

    const letters = [
        ...original.split("").map(letter => ({
            letter,
            added: false
        })),
        ...addedPairs.split("").map(letter => ({
            letter,
            added: true
        }))
    ];

    for (let i = letters.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [letters[i], letters[j]] = [letters[j], letters[i]];
    }

    const remainingElement = document.getElementById("remaining");
    remainingElement.replaceChildren();

    for (const item of letters) {
        const span = document.createElement("span");
        span.textContent = item.letter;

        if (item.added) {
            span.style.color = "#d97706";
            span.title = "Added using Thinking Aid";
        }

        remainingElement.appendChild(span);
    }
}

function addPairs() {
    if (!thinkingAidUnlocked) {
        return;
    }

    const input = prompt(
        "Which letter or string would you like to add?\n" +
        "Each letter will be added twice."
    );

    if (input === null || input.trim() === "") {
        return;
    }

    const letters = normalizeWord(input);

    if (letters === "") {
        alert("Please enter at least one letter.");
        return;
    }

    addedPairs += letters + letters;
    updateRemaining();
}

function revertPairs() {
    addedPairs = "";
    updateRemaining();
}
// ====================
// SECTION 5: SOLVER
// ====================

let solverMoves = new Map();
let solverReady = false;

function buildSolverDictionary() {
    solverMoves = new Map();

    for (const word of dictionary) {
        if (word === target.toLowerCase()) {
            continue;
        }

        const mask = wordToMask(word);

        if (mask === 0) {
            continue;
        }

        if (!solverMoves.has(mask)) {
            solverMoves.set(mask, word);
        }
    }

    solverReady = true;

    console.log("Unique solver masks:", solverMoves.size);
}

function solvePuzzle() {
    const result = document.getElementById("solverResult");

    if (!dictionaryLoaded) {
        result.textContent = "Dictionary is still loading.";
        return;
    }

    if (!solverReady) {
        buildSolverDictionary();
    }

    if (currentMask === 0) {
        result.textContent = "Already solved.";
        return;
    }

    const start = performance.now();
    const solution = bidirectionalBFS(currentMask, 0);
    const time = performance.now() - start;

    if (solution === null) {
        result.textContent = "No solution found.";
        return;
    }

    result.textContent =
        "Solution (" + solution.length + " words): " +
        solution.join(" → ") +
        " | " + time.toFixed(1) + " ms";

    console.log("Solver time:", time.toFixed(1), "ms");
    console.log("Solution:", solution);
        // Revealing a solution counts as giving up.
    gaveUp = true;
    score = 0;

    document.getElementById("score").textContent = score;
    document.getElementById("scoreMessage").textContent =
        "Puzzle given up. Final score: 0.";

    document.getElementById("message").textContent =
        "Puzzle given up.";

    document.getElementById("wordInput").disabled = true;
    document.getElementById("solutionHintButton").disabled = true;
    document.getElementById("unlockThinkingAid").disabled = true;
    document.getElementById("shuffleButton").disabled = true;
    document.getElementById("addPairsButton").disabled = true;
    document.getElementById("revertButton").disabled = true;

    savePuzzleState();
    renderCCMenu();
}

function bidirectionalBFS(start, goal) {
    const moves = [...solverMoves.entries()];

    const startParent = new Map();
    const goalParent = new Map();

    const startMove = new Map();
    const goalMove = new Map();

    startParent.set(start, null);
    goalParent.set(goal, null);

    let startFrontier = [start];
    let goalFrontier = [goal];

    while (startFrontier.length > 0 && goalFrontier.length > 0) {
        const startResult = expandFrontier(
            startFrontier,
            startParent,
            startMove,
            goalParent,
            moves
        );

        if (startResult.meeting !== null) {
            return reconstructSolution(
                startResult.meeting,
                startParent,
                startMove,
                goalParent,
                goalMove
            );
        }

        startFrontier = startResult.nextFrontier;

        const goalResult = expandFrontier(
            goalFrontier,
            goalParent,
            goalMove,
            startParent,
            moves
        );

        if (goalResult.meeting !== null) {
            return reconstructSolution(
                goalResult.meeting,
                startParent,
                startMove,
                goalParent,
                goalMove
            );
        }

        goalFrontier = goalResult.nextFrontier;
    }

    return null;
}

function expandFrontier(
    frontier,
    parent,
    moveUsed,
    otherParent,
    moves
) {
    const nextFrontier = [];

    for (const state of frontier) {
        for (const [mask, word] of moves) {
            const next = state ^ mask;

            if (parent.has(next)) {
                continue;
            }

            parent.set(next, state);
            moveUsed.set(next, word);

            if (otherParent.has(next)) {
                return {
                    nextFrontier: [],
                    meeting: next
                };
            }

            nextFrontier.push(next);
        }
    }

    return {
        nextFrontier: nextFrontier,
        meeting: null
    };
}

function reconstructSolution(
    meeting,
    startParent,
    startMove,
    goalParent,
    goalMove
) {
    const firstHalf = [];
    let state = meeting;

    while (startParent.get(state) !== null) {
        firstHalf.push(startMove.get(state));
        state = startParent.get(state);
    }

    firstHalf.reverse();

    const secondHalf = [];
    state = meeting;

    while (goalParent.get(state) !== null) {
        secondHalf.push(goalMove.get(state));
        state = goalParent.get(state);
    }

    return firstHalf.concat(secondHalf);
}
// ====================
// SECTION 6: INPUT SETUP
// ====================

document.getElementById("wordInput").addEventListener("keydown", event => {
    if (event.key === "Enter") {
        addWord();
    }
});

document.getElementById("wordInput").focus();

updateRemaining();
// ====================
// SECTION 7: EQUIVALENCE FINDER
// ====================

function equivFinder(input) {
    const result = document.getElementById("equivFinderResult");

    if (!dictionaryLoaded) {
        result.textContent = "Dictionary is still loading.";
        return;
    }

    const mask = wordToMask(input);
    const sortBy = document.getElementById("equivFinderSort").value;
const matches = [...dictionary]
    .filter(word => wordToMask(word) === mask);

if (sortBy === "length") {
    matches.sort((a, b) => a.length - b.length || a.localeCompare(b));
} else {
    matches.sort((a, b) => a.localeCompare(b));
}

    result.textContent = matches.length > 0
        ? matches.join("\n")
        : "No matching words found.";
}
