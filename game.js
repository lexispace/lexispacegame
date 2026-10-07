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
    { id: 1, target: "a" },
    { id: 2, target: "b" },
    { id: 3, target: "c" },
    { id: 4, target: "d" },
    { id: 5, target: "e" },
    { id: 6, target: "f" },
    { id: 7, target: "g" },
    { id: 8, target: "h" },
    { id: 9, target: "i" },
    { id: 10, target: "j" },
    { id: 11, target: "k" },
    { id: 12, target: "l" },
    { id: 13, target: "m" },
    { id: 14, target: "n" },
    { id: 15, target: "o" },
    { id: 16, target: "p" },
    { id: 17, target: "q" },
    { id: 18, target: "r" },
    { id: 19, target: "s" },
    { id: 20, target: "t" },
    { id: 21, target: "u" },
    { id: 22, target: "v" },
    { id: 23, target: "w" },
    { id: 24, target: "x" },
    { id: 25, target: "y" },
    { id: 26, target: "z" }
    { id: 27, target: "germany" }
    { id: 28, target: "venezuela" }
    { id: 29, target: "madagascar" }
    { id: 30, target: "silmarillion" }
    { id: 31, target: "iceland" }
    { id: 32, target: "slovenia" }
    { id: 33, target: "bulgaria" }
    { id: 34, target: "tolkien" }
    { id: 34, target: "eswatini" }
    { id: 34, target: "malawi" }
    { id: 34, target: "montenegro" }
    { id: 34, target: "france" }
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
