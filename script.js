// Global state
let currentPin = '';
const correctPin = '1202';

// Screen navigation
function showScreen(screenId) {
    document.querySelectorAll('.screen').forEach(screen => {
        screen.classList.remove('active');
    });
    document.getElementById(screenId).classList.add('active');
}

// ==================== PIN SCREEN ====================
function initPinScreen() {
    const pinButtons = document.querySelectorAll('.pin-btn');
    const pinDots = document.querySelectorAll('.pin-dot');
    const errorMessage = document.getElementById('errorMessage');

    pinButtons.forEach(button => {
        button.addEventListener('click', (e) => {
            const num = button.getAttribute('data-num');

            if (num === 'back') {
                currentPin = currentPin.slice(0, -1);
                updatePinDisplay();
            } else if (num && currentPin.length < 4) {
                currentPin += num;
                updatePinDisplay();

                if (currentPin.length === 4) {
                    setTimeout(() => checkPin(), 300);
                }
            }

            setTimeout(() => button.blur(), 100);
        });
    });

    function updatePinDisplay() {
        pinDots.forEach((dot, index) => {
            if (index < currentPin.length) {
                dot.classList.add('filled');
            } else {
                dot.classList.remove('filled');
            }
        });
        errorMessage.textContent = '';
    }

    function checkPin() {
        if (currentPin === correctPin) {
            errorMessage.textContent = '';
            setTimeout(() => {
                showScreen('puzzleScreen');
                initPuzzle();
            }, 500);
        } else {
            errorMessage.textContent = 'Wrong PIN! Try again ♡';
            document.querySelector('.pin-display').classList.add('shake');
            setTimeout(() => {
                document.querySelector('.pin-display').classList.remove('shake');
            }, 500);
            currentPin = '';
            updatePinDisplay();
        }
    }
}

// ==================== SVG JIGSAW PUZZLE ====================
const GRID_SIZE = 3;
const PIECE_SIZE = 160;
const TAB_SIZE = 25;
const SNAP_THRESHOLD = 30;
const SVG_NS = 'http://www.w3.org/2000/svg';

let draggedPiece = null;
let dragOffset = { x: 0, y: 0 };
let allPieces = [];

function initPuzzle() {
    const svg = document.getElementById('puzzleSVG');
    if (!svg) {
        console.error('puzzleSVG element not found');
        return;
    }
    svg.innerHTML = '';
    svg.setAttribute('width', '100%');
    svg.setAttribute('height', '100%');
    svg.style.position = 'absolute';
    svg.style.top = '0';
    svg.style.left = '0';

    // Create defs for clip paths
    const defs = document.createElementNS(SVG_NS, 'defs');
    svg.appendChild(defs);

    allPieces = [];

    // Generate all puzzle pieces
    for (let row = 0; row < GRID_SIZE; row++) {
        for (let col = 0; col < GRID_SIZE; col++) {
            createPuzzlePiece(row, col, svg, defs);
        }
    }
}

function createPuzzlePiece(row, col, svg, defs) {
    const pieceId = row * GRID_SIZE + col;

    // Create clip path for this piece
    const clipPath = document.createElementNS(SVG_NS, 'clipPath');
    const clipId = `clip-${row}-${col}`;
    clipPath.id = clipId;

    const pathElement = document.createElementNS(SVG_NS, 'path');
    const pathData = generatePiecePath(row, col);
    pathElement.setAttribute('d', pathData);
    clipPath.appendChild(pathElement);
    defs.appendChild(clipPath);

    // Create piece group
    const piece = document.createElementNS(SVG_NS, 'g');
    piece.classList.add('puzzle-piece');
    piece.dataset.row = row;
    piece.dataset.col = col;
    piece.dataset.pieceId = pieceId;

    // Add the clipped image
    const image = document.createElementNS(SVG_NS, 'image');
    image.setAttributeNS('http://www.w3.org/1999/xlink', 'href', 'puzzle.jpg');
    image.setAttribute('width', PIECE_SIZE * GRID_SIZE);
    image.setAttribute('height', PIECE_SIZE * GRID_SIZE);
    image.setAttribute('x', 0);
    image.setAttribute('y', 0);
    image.setAttribute('clip-path', `url(#${clipId})`);
    image.style.pointerEvents = 'none';

    // Add outline
    const outline = document.createElementNS(SVG_NS, 'path');
    outline.setAttribute('d', pathData);
    outline.setAttribute('fill', 'none');
    outline.setAttribute('stroke', '#000');
    outline.setAttribute('stroke-width', '1');
    outline.setAttribute('opacity', '0.2');
    outline.style.pointerEvents = 'none';

    // Add invisible click area
    const clickArea = document.createElementNS(SVG_NS, 'path');
    clickArea.setAttribute('d', pathData);
    clickArea.setAttribute('fill', 'transparent');
    clickArea.setAttribute('stroke', 'none');
    clickArea.style.cursor = 'grab';

    piece.appendChild(image);
    piece.appendChild(outline);
    piece.appendChild(clickArea);

    // Random initial position
    const screenWidth = window.innerWidth;
    const screenHeight = window.innerHeight;
    const x = Math.random() * (screenWidth - PIECE_SIZE - 100) + 50;
    const y = Math.random() * (screenHeight - PIECE_SIZE - 200) + 150;

    piece.setAttribute('transform', `translate(${x - col * PIECE_SIZE}, ${y - row * PIECE_SIZE})`);

    // Add drag events
    clickArea.addEventListener('mousedown', (e) => startDrag(e, piece));
    clickArea.addEventListener('touchstart', (e) => startDrag(e, piece), { passive: false });

    svg.appendChild(piece);
    allPieces.push(piece);
}

function generatePiecePath(row, col) {
    const w = PIECE_SIZE;
    const h = PIECE_SIZE;
    const t = TAB_SIZE;

    // Determine tab direction for each edge (random but consistent)
    const topTab = (row + col) % 2 === 0 ? 1 : -1;
    const rightTab = (row + col + 1) % 2 === 0 ? 1 : -1;
    const bottomTab = -topTab;
    const leftTab = -rightTab;

    const x = col * w;
    const y = row * h;

    let path = `M ${x} ${y}`;

    // Top edge
    if (row === 0) {
        path += ` L ${x + w} ${y}`;
    } else {
        path += generateEdge(x, y, x + w, y, topTab, 'h');
    }

    // Right edge
    if (col === GRID_SIZE - 1) {
        path += ` L ${x + w} ${y + h}`;
    } else {
        path += generateEdge(x + w, y, x + w, y + h, rightTab, 'v');
    }

    // Bottom edge
    if (row === GRID_SIZE - 1) {
        path += ` L ${x} ${y + h}`;
    } else {
        path += generateEdge(x + w, y + h, x, y + h, bottomTab, 'h');
    }

    // Left edge
    if (col === 0) {
        path += ` L ${x} ${y}`;
    } else {
        path += generateEdge(x, y + h, x, y, leftTab, 'v');
    }

    path += ' Z';
    return path;
}

function generateEdge(x1, y1, x2, y2, tabDirection, orientation) {
    const length = Math.abs(x2 - x1 + y2 - y1);
    const mid = length / 2;
    const t = TAB_SIZE;
    const depth = t * tabDirection;

    // Neck width (narrower than the bulb)
    const neckWidth = t * 0.6;
    const bulbWidth = t * 1.2;

    if (orientation === 'h') {
        const dir = x2 > x1 ? 1 : -1;
        const x = x1;
        const y = y1;

        return `
            L ${x + dir * (mid - neckWidth)} ${y}
            C ${x + dir * (mid - neckWidth)} ${y + depth * 0.2},
              ${x + dir * (mid - bulbWidth)} ${y + depth * 0.8},
              ${x + dir * mid} ${y + depth}
            C ${x + dir * (mid + bulbWidth)} ${y + depth * 0.8},
              ${x + dir * (mid + neckWidth)} ${y + depth * 0.2},
              ${x + dir * (mid + neckWidth)} ${y}
            L ${x2} ${y2}
        `;
    } else {
        const dir = y2 > y1 ? 1 : -1;
        const x = x1;
        const y = y1;

        return `
            L ${x} ${y + dir * (mid - neckWidth)}
            C ${x + depth * 0.2} ${y + dir * (mid - neckWidth)},
              ${x + depth * 0.8} ${y + dir * (mid - bulbWidth)},
              ${x + depth} ${y + dir * mid}
            C ${x + depth * 0.8} ${y + dir * (mid + bulbWidth)},
              ${x + depth * 0.2} ${y + dir * (mid + neckWidth)},
              ${x} ${y + dir * (mid + neckWidth)}
            L ${x2} ${y2}
        `;
    }
}

function startDrag(e, piece) {
    e.preventDefault();

    draggedPiece = piece;
    piece.style.cursor = 'grabbing';
    piece.style.filter = 'drop-shadow(4px 4px 8px rgba(0, 0, 0, 0.5))';

    // Move to front
    piece.parentNode.appendChild(piece);

    const svg = document.getElementById('puzzleSVG');
    const pt = svg.createSVGPoint();

    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;

    pt.x = clientX;
    pt.y = clientY;
    const svgP = pt.matrixTransform(svg.getScreenCTM().inverse());

    // Get or create transform
    const transformList = piece.transform.baseVal;
    let matrix;

    if (transformList.numberOfItems === 0) {
        // No transform exists, create one
        const transform = svg.createSVGTransform();
        transform.setTranslate(0, 0);
        transformList.appendItem(transform);
        matrix = transform.matrix;
    } else {
        matrix = transformList.getItem(0).matrix;
    }

    dragOffset.x = svgP.x - matrix.e;
    dragOffset.y = svgP.y - matrix.f;

    document.addEventListener('mousemove', drag);
    document.addEventListener('mouseup', stopDrag);
    document.addEventListener('touchmove', drag, { passive: false });
    document.addEventListener('touchend', stopDrag);
}

function drag(e) {
    if (!draggedPiece) return;
    e.preventDefault();

    const svg = document.getElementById('puzzleSVG');
    const pt = svg.createSVGPoint();

    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;

    pt.x = clientX;
    pt.y = clientY;
    const svgP = pt.matrixTransform(svg.getScreenCTM().inverse());

    const row = parseInt(draggedPiece.dataset.row);
    const col = parseInt(draggedPiece.dataset.col);

    const newX = svgP.x - dragOffset.x;
    const newY = svgP.y - dragOffset.y;

    draggedPiece.setAttribute('transform', `translate(${newX}, ${newY})`);
}

function stopDrag(e) {
    if (!draggedPiece) return;

    document.removeEventListener('mousemove', drag);
    document.removeEventListener('mouseup', stopDrag);
    document.removeEventListener('touchmove', drag);
    document.removeEventListener('touchend', stopDrag);

    draggedPiece.style.cursor = 'grab';
    draggedPiece.style.filter = '';

    // Check for snapping
    checkSnap();

    draggedPiece = null;
}

function checkSnap() {
    const row = parseInt(draggedPiece.dataset.row);
    const col = parseInt(draggedPiece.dataset.col);

    // Check all four neighbors and try to merge
    let current = draggedPiece;
    current = checkAndMerge(current, row, col - 1); // left
    current = checkAndMerge(current, row, col + 1); // right
    current = checkAndMerge(current, row - 1, col); // top
    current = checkAndMerge(current, row + 1, col); // bottom

    // Update draggedPiece reference in case it was merged
    draggedPiece = current;

    // Check if puzzle is complete - only one group left
    const svg = document.getElementById('puzzleSVG');
    const draggableElements = svg.querySelectorAll('.puzzle-piece');
    if (draggableElements.length === 1) {
        setTimeout(() => {
            showScreen('questionScreen');
            initQuestionScreen();
        }, 1000);
    }
}

function checkAndMerge(current, neighborRow, neighborCol) {
    // Find the neighbor piece
    const neighbor = findPieceAt(neighborRow, neighborCol);
    if (!neighbor || neighbor === current) return current;

    // Check if they have transforms
    const t1 = current.transform.baseVal;
    if (!t1.numberOfItems) return current;
    const t2 = neighbor.transform.baseVal;
    if (!t2.numberOfItems) return current;

    // Get their positions
    const m1 = t1.getItem(0).matrix;
    const m2 = t2.getItem(0).matrix;

    // Get the actual piece data (might be inside a group)
    let currentRow, currentCol;
    if (current.classList.contains('group')) {
        // Current is a group, use the piece we're checking from
        const pieceInGroup = current.querySelector(`g[data-row]`);
        if (!pieceInGroup) return current;
        currentRow = parseInt(pieceInGroup.dataset.row);
        currentCol = parseInt(pieceInGroup.dataset.col);
    } else {
        currentRow = parseInt(current.dataset.row);
        currentCol = parseInt(current.dataset.col);
    }

    // For neighbor, we need the specific piece at neighborRow, neighborCol
    let neighborScreenX, neighborScreenY;
    if (neighbor.classList.contains('group')) {
        // Neighbor is a group - find the specific piece within it
        const specificPiece = neighbor.querySelector(`g[data-row="${neighborRow}"][data-col="${neighborCol}"]`);
        if (!specificPiece) return current;

        // Group position + piece position within group (which should be 0,0 since transform was removed)
        neighborScreenX = m2.e + (neighborCol * PIECE_SIZE);
        neighborScreenY = m2.f + (neighborRow * PIECE_SIZE);
    } else {
        neighborScreenX = m2.e + (neighborCol * PIECE_SIZE);
        neighborScreenY = m2.f + (neighborRow * PIECE_SIZE);
    }

    // Current piece's actual screen position
    const currentScreenX = m1.e + (currentCol * PIECE_SIZE);
    const currentScreenY = m1.f + (currentRow * PIECE_SIZE);

    // Calculate the expected relative positions if they were correctly placed
    const expectedOffsetX = (currentCol - neighborCol) * PIECE_SIZE;
    const expectedOffsetY = (currentRow - neighborRow) * PIECE_SIZE;

    // Calculate actual relative positions
    const actualOffsetX = currentScreenX - neighborScreenX;
    const actualOffsetY = currentScreenY - neighborScreenY;

    // Check if they're close enough to snap (positioned correctly relative to each other)
    const distance = Math.sqrt(
        Math.pow(actualOffsetX - expectedOffsetX, 2) +
        Math.pow(actualOffsetY - expectedOffsetY, 2)
    );

    if (distance > SNAP_THRESHOLD) return current;

    // They're close enough - merge them!
    const currentIsGroup = current.classList.contains('group');
    const neighborIsGroup = neighbor.classList.contains('group');

    if (currentIsGroup) {
        if (!neighborIsGroup) {
            // Current is group, neighbor is single piece
            neighbor.classList.remove('puzzle-piece');
            neighbor.style.filter = 'none'; // Remove individual shadow
            t2.removeItem(0);
            current.appendChild(neighbor);
            // Reattach drag handlers to the group
            setupDragForElement(current);
        } else if (neighbor.childElementCount > current.childElementCount) {
            // Both are groups, merge into the larger one
            transferChildren(current, neighbor);
            current.remove();
            // Reattach drag handlers to the merged group
            setupDragForElement(neighbor);
            return neighbor;
        } else {
            // Both are groups, merge into current
            transferChildren(neighbor, current);
            neighbor.remove();
            // Reattach drag handlers to the merged group
            setupDragForElement(current);
        }
        return current;
    }

    if (neighborIsGroup) {
        // Neighbor is group, current is single piece
        current.classList.remove('puzzle-piece');
        current.style.filter = 'none'; // Remove individual shadow
        t1.removeItem(0);
        neighbor.appendChild(current);
        // Reattach drag handlers to the group
        setupDragForElement(neighbor);
        return neighbor;
    }

    // Neither is a group - create new group
    const svg = document.getElementById('puzzleSVG');
    const newGroup = document.createElementNS(SVG_NS, 'g');
    newGroup.classList.add('puzzle-piece', 'group');

    // Use neighbor's position for the group
    const groupTransform = t2.getItem(0);
    newGroup.dataset.row = neighbor.dataset.row;
    newGroup.dataset.col = neighbor.dataset.col;

    // Add pieces to group
    current.classList.remove('puzzle-piece');
    neighbor.classList.remove('puzzle-piece');
    current.style.filter = 'none'; // Remove individual shadow
    neighbor.style.filter = 'none'; // Remove individual shadow

    newGroup.appendChild(neighbor);
    newGroup.appendChild(current);

    // Remove individual transforms and set group transform
    t1.removeItem(0);
    t2.removeItem(0);
    newGroup.transform.baseVal.appendItem(groupTransform);

    // Add group to SVG
    svg.appendChild(newGroup);

    // Setup drag for the group
    setupDragForElement(newGroup);

    return newGroup;
}

function findPieceAt(row, col) {
    // Check bounds
    if (row < 0 || row >= GRID_SIZE || col < 0 || col >= GRID_SIZE) return null;

    const svg = document.getElementById('puzzleSVG');

    // Find piece or group containing this position
    const allElements = svg.querySelectorAll('.puzzle-piece');
    for (const element of allElements) {
        // Check if it's a single piece
        if (!element.classList.contains('group')) {
            if (element.dataset.row === String(row) && element.dataset.col === String(col)) {
                return element;
            }
        } else {
            // It's a group - check all children
            const children = element.querySelectorAll('g[data-row]');
            for (const child of children) {
                if (child.dataset.row === String(row) && child.dataset.col === String(col)) {
                    return element; // Return the group, not the child
                }
            }
        }
    }

    return null;
}

function transferChildren(from, to) {
    while (from.firstChild) {
        to.appendChild(from.firstChild);
    }
}

function setupDragForElement(element) {
    // Remove all existing event listeners by cloning
    const clickAreas = element.querySelectorAll('path[fill="transparent"]');

    clickAreas.forEach(clickArea => {
        // Clone to remove old event listeners
        const newClickArea = clickArea.cloneNode(true);
        clickArea.parentNode.replaceChild(newClickArea, clickArea);

        // Add new event listeners that drag the entire group
        newClickArea.addEventListener('mousedown', (e) => {
            e.stopPropagation();
            startDrag(e, element);
        });
        newClickArea.addEventListener('touchstart', (e) => {
            e.stopPropagation();
            startDrag(e, element);
        }, { passive: false });
    });
}

// ==================== QUESTION SCREEN ====================
function initQuestionScreen() {
    const yesBtn = document.getElementById('yesBtn');
    const noBtn = document.getElementById('noBtn');
    const pleadingText = document.getElementById('pleadingText');

    const messages = [
        "why do you not love me :<",
        "say yes please",
        "i love you",
        "okay you dont love me",
        "please love me",
        "why u no love me :<",
        "im gonna cry",
        "im not your baby anymore",
        "you hurt meee :<"
    ];

    let messageIndex = 0;
    let clickCount = 0;

    positionButton(yesBtn, 50, 50);
    positionButton(noBtn, 50, 150);

    yesBtn.addEventListener('click', () => {
        showScreen('letterScreen');
        playLoveSong();
    });

    noBtn.addEventListener('click', (e) => {
        e.preventDefault();
        clickCount++;

        pleadingText.textContent = messages[messageIndex % messages.length];
        messageIndex++;

        // Check if we're at the last message
        if (messageIndex >= messages.length - 1) {
            // Hide the No button
            noBtn.style.display = 'none';

            // Make the Yes button big and centered
            yesBtn.style.fontSize = '3em';
            yesBtn.style.padding = '30px 80px';
            yesBtn.style.transform = 'scale(1)';

            const container = noBtn.parentElement;
            const centerX = (container.offsetWidth - yesBtn.offsetWidth) / 2;
            const centerY = (container.offsetHeight - yesBtn.offsetHeight) / 2;

            positionButton(yesBtn, centerX, centerY);

            return;
        }

        const container = noBtn.parentElement;
        const noRect = noBtn.getBoundingClientRect();
        const containerRect = container.getBoundingClientRect();

        const noLeft = noRect.left - containerRect.left;
        const noTop = noRect.top - containerRect.top;

        // Move Yes to where No currently is
        positionButton(yesBtn, noLeft, noTop);

        // Move No far away from its current position
        const maxX = container.offsetWidth - noBtn.offsetWidth;
        const maxY = container.offsetHeight - noBtn.offsetHeight;

        let randomX, randomY, distance;

        // Keep generating positions until we find one far enough away
        do {
            randomX = Math.random() * maxX;
            randomY = Math.random() * maxY;
            distance = Math.sqrt(
                Math.pow(randomX - noLeft, 2) +
                Math.pow(randomY - noTop, 2)
            );
        } while (distance < 150); // Ensure it's at least 150px away

        positionButton(noBtn, randomX, randomY);
    });
}

function positionButton(button, left, top) {
    button.style.left = left + 'px';
    button.style.top = top + 'px';
}

// ==================== LETTER SCREEN ====================
function initLetterScreen() {
    const envelopeWrapper = document.querySelector('.envelope-wrapper');
    if (!envelopeWrapper) {
        console.error('envelope-wrapper element not found');
        return;
    }
    let isOpened = false;

    envelopeWrapper.addEventListener('click', () => {
        if (!isOpened) {
            envelopeWrapper.classList.add('flap');
            isOpened = true;
        }
    });
}

function playLoveSong() {
    const audio = document.getElementById('loveSong');
    if (audio) {
        audio.volume = 0.3; // Set volume to 30%
        audio.play().catch(err => {
            console.log('Audio play failed:', err);
        });
    }
}

// Initialize on load
document.addEventListener('DOMContentLoaded', () => {
    initPinScreen();
    initLetterScreen();
});
