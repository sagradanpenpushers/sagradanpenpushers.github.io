// Simple SVG Jigsaw Puzzle Generator (3x3)
// Inspired by Puzzle.SVG but simplified

const SVG_NS = 'http://www.w3.org/2000/svg';

class SimplePuzzleGenerator {
    constructor(imageUrl, gridSize = 3) {
        this.imageUrl = imageUrl;
        this.gridSize = gridSize;
        this.pieceWidth = 160;
        this.pieceHeight = 160;
        this.tabSize = 20; // Size of the interlocking tab
    }

    // Generate SVG path for a puzzle piece with tabs/blanks
    generatePiecePath(row, col) {
        const w = this.pieceWidth;
        const h = this.pieceHeight;
        const t = this.tabSize;

        let path = `M 0 0`;

        // Top edge
        if (row === 0) {
            path += ` L ${w} 0`;
        } else {
            const hasTab = (row + col) % 2 === 0;
            path += this.generateEdge(w, 0, hasTab, true);
        }

        // Right edge
        if (col === this.gridSize - 1) {
            path += ` L ${w} ${h}`;
        } else {
            const hasTab = (row + col + 1) % 2 === 0;
            path += this.generateEdge(h, 90, hasTab, true);
        }

        // Bottom edge
        if (row === this.gridSize - 1) {
            path += ` L 0 ${h}`;
        } else {
            const hasTab = (row + col) % 2 === 1;
            path += this.generateEdge(w, 180, hasTab, true);
        }

        // Left edge
        if (col === 0) {
            path += ` L 0 0`;
        } else {
            const hasTab = (row + col + 1) % 2 === 1;
            path += this.generateEdge(h, 270, hasTab, true);
        }

        path += ' Z';
        return path;
    }

    // Generate a single edge with tab or blank
    generateEdge(length, rotation, hasTab, smooth = true) {
        const t = this.tabSize;
        const mid = length / 2;
        const sign = hasTab ? -1 : 1;

        if (smooth) {
            // Curved tab/blank
            return `
                L ${mid - t} 0
                Q ${mid - t} ${sign * t * 0.5} ${mid} ${sign * t}
                Q ${mid + t} ${sign * t * 0.5} ${mid + t} 0
                L ${length} 0
            `;
        } else {
            // Simple rectangular tab/blank
            return `
                L ${mid - t} 0
                L ${mid - t} ${sign * t}
                L ${mid + t} ${sign * t}
                L ${mid + t} 0
                L ${length} 0
            `;
        }
    }

    createSVGPuzzlePiece(row, col, container) {
        const piece = document.createElementNS(SVG_NS, 'g');
        piece.classList.add('puzzle-piece-svg');
        piece.dataset.row = row;
        piece.dataset.col = col;
        piece.dataset.pieceId = row * this.gridSize + col;

        // Create clip path for this piece
        const clipPath = document.createElementNS(SVG_NS, 'clipPath');
        const clipId = `clip-${row}-${col}`;
        clipPath.id = clipId;

        const path = document.createElementNS(SVG_NS, 'path');
        path.setAttribute('d', this.generatePiecePath(row, col));
        clipPath.appendChild(path);

        // Add the image with clip path
        const image = document.createElementNS(SVG_NS, 'image');
        image.setAttributeNS('http://www.w3.org/1999/xlink', 'href', this.imageUrl);
        image.setAttribute('width', this.pieceWidth * this.gridSize);
        image.setAttribute('height', this.pieceHeight * this.gridSize);
        image.setAttribute('x', -col * this.pieceWidth);
        image.setAttribute('y', -row * this.pieceHeight);
        image.setAttribute('clip-path', `url(#${clipId})`);

        // Add outline path
        const outline = document.createElementNS(SVG_NS, 'path');
        outline.setAttribute('d', this.generatePiecePath(row, col));
        outline.setAttribute('fill', 'none');
        outline.setAttribute('stroke', '#000');
        outline.setAttribute('stroke-width', '2');
        outline.setAttribute('opacity', '0.3');

        piece.appendChild(clipPath);
        piece.appendChild(image);
        piece.appendChild(outline);

        // Random initial position
        const x = Math.random() * (window.innerWidth - this.pieceWidth);
        const y = Math.random() * (window.innerHeight - this.pieceHeight) + 100;
        piece.setAttribute('transform', `translate(${x}, ${y})`);

        container.appendChild(piece);
        return piece;
    }

    generate(container) {
        const svg = document.createElementNS(SVG_NS, 'svg');
        svg.setAttribute('width', '100%');
        svg.setAttribute('height', '100%');
        svg.style.position = 'fixed';
        svg.style.top = '0';
        svg.style.left = '0';
        svg.style.zIndex = '1';

        for (let row = 0; row < this.gridSize; row++) {
            for (let col = 0; col < this.gridSize; col++) {
                this.createSVGPuzzlePiece(row, col, svg);
            }
        }

        container.appendChild(svg);
        return svg;
    }
}
