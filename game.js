// ====================
// SECTION 1: GAME STATE
// ====================

let target = "";
let currentMask = 0;
let dictionary = new Set();
let dictionaryLoaded = false;
let playedWords = [];

let currentPuzzleId = null;
// ====================
// SECTION 2: PUZZLES + DICTIONARY
// ====================

const puzzles = [
    { id: 1, target: "germany" },
    { id: 2, target: "venezuela" },
    { id: 3, target: "madagascar" },
    { id: 4, target: "france" },
    { id: 5, target: "iceland" },
    { id: 6, target: "slovenia" },
    { id: 7, target: "bulgaria" },
    { id: 8, target: "montenegro" },
    { id: 9, target: "eswatini" },
    { id: 10, target: "malawi" },
    { id: 11, target: "tolkien" },
    { id: 12, target: "anduril" },  
    { id: 13, target: "silmarillion" },  
    { id: 14, target: "balrogs" },  
    { id: 15, target: "sindarin" },  
    { id: 16, target: "tengwar" },  
    { id: 17, target: "rivendell" },  
    { id: 18, target: "palantir" },  
    { id: 19, target: "melkor" },  
    { id: 20, target: "morgoth" }  

];

function loadPuzzle(puzzle) {
    target = puzzle.target.toLowerCase();
    currentPuzzleId = puzzle.id;

    currentMask = wordToMask(target);
    playedWords = [];

    solverReady = false;
    solverMoves = new Map();

    document.getElementById("target").textContent =
        target.toUpperCase();

    document.getElementById("puzzleNumber").textContent =
        puzzle.id !== null
            ? "Puzzle #" + puzzle.id
            : "Random Puzzle";

    document.getElementById("wordList").innerHTML = "";

    document.getElementById("message").textContent = "";
    document.getElementById("solverResult").textContent = "";

    updateRemaining();

    document.getElementById("wordInput").value = "";
    document.getElementById("wordInput").focus();
    document.getElementById("previousPuzzle").style.display =
    currentPuzzleId === 1 ? "none" : "inline-block";
}

function loadPuzzleById(id) {
    const puzzle = puzzles.find(puzzle => puzzle.id === id);

    if (!puzzle) {
        console.log("Puzzle not found.");
        return;
    }

    loadPuzzle(puzzle);
}
function previousPuzzle() {
    if (currentPuzzleId <= 1) {
        return;
    }

    loadPuzzleById(currentPuzzleId - 1);
}

function nextPuzzle() {
    if (currentPuzzleId >= puzzles.length) {
        return;
    }

    loadPuzzleById(currentPuzzleId + 1);
}
function newPuzzle() {
    const candidates = [...dictionary].filter(
        word => wordToMask(word) !== 0
    );

    const randomTarget =
        candidates[Math.floor(Math.random() * candidates.length)];

    loadPuzzle({
        id: null,
        target: randomTarget
    });
}

fetch("words_enable.txt")
    .then(response => {
        if (!response.ok) {
            throw new Error("Dictionary could not be loaded.");
        }
        return response.text();
    })
    .then(text => {
        const words = text
            .split(/\r?\n/)
            .map(word => word.trim().toLowerCase())
            .filter(word => word.length > 0);

        dictionary = new Set(words);
        dictionaryLoaded = true;

        loadPuzzle(puzzles[0]);

        document.getElementById("message").textContent =
            "Dictionary loaded: " + dictionary.size + " words.";
    })
    .catch(error => {
        document.getElementById("message").textContent =
            "Error loading dictionary.";
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
    document.getElementById("remaining").textContent =
        maskToLetters(currentMask);
}

function addWord() {
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
        document.getElementById("message").textContent =
            "Solved!";
    } else {
        document.getElementById("message").textContent = "";
    }
}

function shuffleLetters() {
    const remaining = maskToLetters(currentMask);

    if (remaining === "—") {
        return;
    }

    const letters = remaining.split("");

    for (let i = letters.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [letters[i], letters[j]] = [letters[j], letters[i]];
    }

    document.getElementById("remaining").textContent =
        letters.join("");
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
// ====================
// SECTION 8: SOLVER ANALYSIS
// ====================

function analyzeSolver() {
    const input = document
        .getElementById("analysisInput")
        .value
        .trim()
        .toLowerCase();

    const result = document.getElementById("analysisResult");

    if (!dictionaryLoaded) {
        result.textContent = "Dictionary is still loading.";
        return;
    }

    if (input === "") {
        result.textContent = "Enter a string first.";
        return;
    }

    const startMask = wordToMask(input);

    if (startMask === 0) {
        result.textContent =
            "This string has simplified length 0.";
        return;
    }

    const analysisMoves = new Map();

    for (const word of dictionary) {
        const mask = wordToMask(word);

        if (mask === 0) {
            continue;
        }

        if (!analysisMoves.has(mask)) {
            analysisMoves.set(mask, word);
        }
    }

    const moves = [...analysisMoves.entries()];

    const startParent = new Map();
    const goalParent = new Map();

    const startMove = new Map();
    const goalMove = new Map();

    startParent.set(startMask, null);
    goalParent.set(0, null);

    let startFrontier = [startMask];
    let goalFrontier = [0];

    const startFrontiers = [1];
    const goalFrontiers = [1];

    let startExpanded = 0;
    let goalExpanded = 0;
    let maskChecks = 0;
    let meeting = null;

    const startTime = performance.now();

    while (
        startFrontier.length > 0 &&
        goalFrontier.length > 0
    ) {
        const startResult = expandAnalysisFrontier(
            startFrontier,
            startParent,
            startMove,
            goalParent,
            moves
        );

        startExpanded += startResult.expanded;
        maskChecks += startResult.maskChecks;

        if (startResult.meeting !== null) {
            meeting = startResult.meeting;
            break;
        }

        startFrontier = startResult.nextFrontier;
        startFrontiers.push(startFrontier.length);

        const goalResult = expandAnalysisFrontier(
            goalFrontier,
            goalParent,
            goalMove,
            startParent,
            moves
        );

        goalExpanded += goalResult.expanded;
        maskChecks += goalResult.maskChecks;

        if (goalResult.meeting !== null) {
            meeting = goalResult.meeting;
            break;
        }

        goalFrontier = goalResult.nextFrontier;
        goalFrontiers.push(goalFrontier.length);
    }

    const time = performance.now() - startTime;

    let solutionLength = "No solution";

    if (meeting !== null) {
        const solution = reconstructSolution(
            meeting,
            startParent,
            startMove,
            goalParent,
            goalMove
        );

        solutionLength = solution.length;
    }

    const simplifiedLength = countBits(startMask);

    let output =
        "Input: " + input +
        "\nSimplified length: " + simplifiedLength +
        "\nMask: " + maskToLetters(startMask) +
        "\n\n" +

        "Solution length: " + solutionLength +
        "\nTime: " + time.toFixed(1) + " ms" +
        "\n\n" +

        "Distinct moves: " + moves.length +
        "\nStates expanded: " +
            (startExpanded + goalExpanded) +
        "\nStates discovered: " +
            (startParent.size + goalParent.size) +
        "\nMask checks: " + maskChecks +
        "\n\n" +

        "Start frontier:\n";

    for (let i = 0; i < startFrontiers.length; i++) {
        output +=
            "Depth " + i + ": " +
            startFrontiers[i] + "\n";
    }

    output += "\nGoal frontier:\n";

    for (let i = 0; i < goalFrontiers.length; i++) {
        output +=
            "Depth " + i + ": " +
            goalFrontiers[i] + "\n";
    }

    result.textContent = output;
    const dataBox = document.getElementById("analysisData");

if (dataBox.value === "") {
    dataBox.value = "Hamming weight\tTime (ms)\tStates expanded";
}

dataBox.value +=
    "\n" +
    simplifiedLength + "\t" +
    time.toFixed(1) + "\t" +
    (startExpanded + goalExpanded);
}


function expandAnalysisFrontier(
    frontier,
    parent,
    moveUsed,
    otherParent,
    moves
) {
    const nextFrontier = [];
    let maskChecks = 0;

    for (const state of frontier) {
        for (const [mask, word] of moves) {
            maskChecks++;

            const next = state ^ mask;

            if (parent.has(next)) {
                continue;
            }

            parent.set(next, state);
            moveUsed.set(next, word);

            if (otherParent.has(next)) {
                return {
                    nextFrontier: [],
                    meeting: next,
                    expanded: frontier.length,
                    maskChecks: maskChecks
                };
            }

            nextFrontier.push(next);
        }
    }

    return {
        nextFrontier: nextFrontier,
        meeting: null,
        expanded: frontier.length,
        maskChecks: maskChecks
    };
}


function countBits(mask) {
    let count = 0;

    while (mask !== 0) {
        mask &= mask - 1;
        count++;
    }

    return count;
}
