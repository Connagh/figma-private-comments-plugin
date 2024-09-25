// Show the plugin UI
figma.showUI(__html__, { width: 200, height: 100 });

let squareNodes: SceneNode[] = []; // Store multiple blue squares

// Function to create a blue square and store it locally
function createBlueSquare(x: number = 100, y: number = 100) {
  const rect = figma.createRectangle();
  rect.resize(100, 100); // Set size of the square
  rect.fills = [{ type: 'SOLID', color: { r: 0.3, g: 0.5, b: 1 } }]; // Blue color
  rect.name = 'User Blue Square'; // For easy identification in the canvas

  // Set position
  rect.x = x;
  rect.y = y;

  // Return the created square, but don’t append it to the canvas yet
  return rect;
}

// Function to save all square positions and IDs in clientStorage
async function saveSquaresToStorage() {
  const squaresData = squareNodes.map((node) => ({
    id: node.id,
    x: node.x,
    y: node.y
  }));

  await figma.clientStorage.setAsync('persistentSquares', squaresData);
}

// Function to restore squares from clientStorage and reappear all at once
async function restoreSquares() {
  const storedSquares = await figma.clientStorage.getAsync('persistentSquares');
  const validSquaresToAdd: SceneNode[] = [];

  if (storedSquares && storedSquares.length > 0) {
    for (const squareData of storedSquares) {
      const { id, x, y } = squareData;

      // Use getNodeByIdAsync to fetch the node asynchronously
      const node = await figma.getNodeByIdAsync(id) as SceneNode | null;

      if (node) {
        node.x = x;
        node.y = y;
        squareNodes.push(node); // Keep track of the restored node
        validSquaresToAdd.push(node); // Queue it to be added
      } else {
        // Create a new square if the node is missing
        const newSquare = createBlueSquare(x, y);
        squareNodes.push(newSquare);
        validSquaresToAdd.push(newSquare);
      }
    }

    // Now add all valid squares to the canvas at once
    for (const square of validSquaresToAdd) {
      figma.currentPage.appendChild(square);
    }
  }

  // Clean up the missing nodes from storage if any were not found
  await saveSquaresToStorage();
}

// Function to check if a square was moved and update its position in storage
function updateSquarePositions() {
  if (squareNodes.length > 0) {
    saveSquaresToStorage(); // Save the updated positions of all squares
  }
}

// Listen for selection changes to detect if the squares have been moved
figma.on('selectionchange', () => {
  updateSquarePositions();
});

// Listen for UI button click to create a blue square
figma.ui.onmessage = (msg) => {
  if (msg.type === 'create-square') {
    const newSquare = createBlueSquare(); // Create a new blue square
    squareNodes.push(newSquare);
    figma.currentPage.appendChild(newSquare); // Add the new square to the canvas
    saveSquaresToStorage(); // Update storage with the new square
  }
};

// Restore the blue squares on plugin load, and reappear them all at once
restoreSquares().catch((err) => {
  console.error('Error restoring the squares: ', err);
});

// Remove all squares when the plugin is closed (but keep their data in clientStorage)
figma.on('close', () => {
  squareNodes.forEach((node) => {
    node.remove(); // Remove from the canvas but keep data in clientStorage
  });
  squareNodes = []; // Clear local reference to squares
});