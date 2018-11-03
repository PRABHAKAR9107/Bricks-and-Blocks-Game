const dialog         = document.querySelector('#js-dialog');
const gameBoard      = document.querySelector('#js-game-board')
const scoreElement   = document.querySelector('#js-score')
const restartButton  = document.querySelector('#js-restart')
const timeTick       = 500
const possibleShapes = [
  [[1,1], [1,2], [2,1], [2,2]],
  [[1,1], [1,2], [2,2], [2,3]],
  [[1,2], [1,3], [2,1], [2,2]],
  [[1,2], [2,1], [2,2], [2,3]],
  [[1,1], [1,2], [1,3], [1,4]],
  [[1,1], [2,1], [2,2], [2,3]],
  [[1,3], [2,1], [2,2], [2,3]]
]
const colors         = [
  'cyan', 'magenta', 'purple', 'blue', 'green', 'red', 'orange'
]
const bottomRow      = 20
const lastCol        = 15

// Game timer
let gameTimer    = null
let currentBlock = null
let currentType  = null 
let boardTracker = []
let score        = 0

startGame()

// Start a game
function startGame() {
  setupBoardTracker()
  addBlock()
  gameTimer = setInterval(() => {
    if (blockSet()) {
      setInGameBoard()
      // Need to add the new block
      addBlock()
      // Now we should check if we need to score
      removeRows()
    } else {
      // Move the current block
      move() 
    }
  }, timeTick) 
}

// build the array we'll use to track all the placed pieces
function setupBoardTracker() {
  boardTracker = []
  for (let i = 0; i < bottomRow; i++) {
    boardTracker.push(getColumnsArray())
  }
}

function getColumnsArray() {
  let toReturn = []
  for (let j = 0; j < lastCol; j++) {
    toReturn.push(false)
  }
  return toReturn
}

// Need to add the listener for moving the blocks
document.addEventListener("keydown", (event) => {
  switch (event.key) {      
    case 'ArrowLeft':
      move([-1, 0])
      break
    case 'ArrowRight':
      move([1, 0])
      break
    case 'ArrowDown':
      if (!blockSet()) {
        move([0, 1]) 
      }
      break
    case 'a':
      rotate(Math.PI / 2)
      break
    case 'd':
      rotate(-Math.PI / 2)
      break
    case 's':
      rotate(Math.PI)
      break
    case 'w':
      rotate(0)
      break
    default:
      break
  }
})

function rotate(degrees) {
  let sin = Math.floor(Math.sin(degrees))
  let cos = Math.floor(Math.cos(degrees))
  let shape = possibleShapes[currentType]
  let mins = [100, 100]
  let moveTo = []
  // Get the top left coordinate position of the blocks
  let positions = getCurrentPositions()
  // get new positions for each block
  shape.forEach((block, index) => {
    let x = block[0]
    let y = block[1]
    // set the position to be the container's top/left plus new position
    let newX = x * cos - y * sin + positions[0]
    let newY = x * sin + y * cos + positions[1]
    // set min X and Y found
    mins[0] = Math.min(mins[0], newX)
    mins[1] = Math.min(mins[1], newY)
    moveTo.push([newX, newY])
  })
  // Get the amount to shift the values by so the top left point matches
  moveX = positions[0] - mins[0]
  moveY = positions[1] - mins[1]
  // actually move the positions
  currentBlock.forEach((block, index) => {
    block.style.gridRow    = moveTo[index][0] + moveX
    block.style.gridColumn = moveTo[index][1] + moveY
  })
}

// return the positions of the top left and bottom right of the block
function getCurrentPositions() {
  return currentBlock.reduce((currentPositions, block) => {
    let x = parseInt(block.style.gridRow, 10)
    let y = parseInt(block.style.gridColumn, 10)
    return [
      Math.min(currentPositions[0], x),
      Math.min(currentPositions[1], y),
      Math.max(currentPositions[2], x),
      Math.max(currentPositions[3], y),
    ]
  }, [100, 100, 0, 0])
}

// move the game along!
function move(direction=[0, 1]) {
  // if there's no current block, do nothing
  if (!currentBlock.length) { return }

  let positions = getCurrentPositions()
  // check if moving off the left side of the screen OR if we're moving off the right side
  if ((1 >= positions[1] && -1 == direction[0]) ||
      (1 == direction[0] && 15 <= positions[3])) {
    return
  }
  // check if there is a block to the left or right
  let canMove = true
  currentBlock.forEach((block) => {
    let x = parseInt(block.style.gridColumn, 10)
    let y = parseInt(block.style.gridRow, 10)
    if ((-1 == direction[0] && boardTracker[y-1][x-2]) ||
       (1 == direction[0] && boardTracker[y-1][x])) {
      canMove = false    
    }
  })
  if (!canMove) {
    return
  }
  currentBlock.forEach((block) => {
    let x = parseInt(block.style.gridColumn, 10)
    let y = parseInt(block.style.gridRow, 10)
    block.style.gridColumn = x + direction[0]
    block.style.gridRow    = y + direction[1]
  })
}

// Check if the current block is set
function blockSet() {
  let toReturn = false
  currentBlock.forEach((block) => {
    let y = parseInt(block.style.gridRow, 10)
    let x = parseInt(block.style.gridColumn, 10)
    if (y >= bottomRow || boardTracker[y][x-1]) {
      toReturn = true
    }
  })
  return toReturn
}

// Set the game board to include current block
function setInGameBoard() {
  currentBlock.forEach((block) => {
    let y = parseInt(block.style.gridRow, 10) - 1
    let x = parseInt(block.style.gridColumn, 10) - 1
    // set a data attribute so we can easily query all blocks in a row
    block.dataset.row = y + 1
    // add to the tracking board
    if (boardTracker.length > y && boardTracker[y].length > x) {
      boardTracker[y][x] = true
    }
  })
}

// Remove all rows that are full
function removeRows() {
  // check each row for if all the columns are filled. 
  boardTracker.forEach((row, rowNumber) => {
    // get whether each column in the row is set to true (full)
    let isFull = row.reduce((full, column) => {
      return full && column
    }, true)
    // If it's full, remove the row and add a new row
    if (isFull) {
      // increase the score
      score++
      scoreElement.innerHTML = `${score}`
      // remove the elements
      let toRemove = document.querySelectorAll(`.block[data-row="${rowNumber+1}"]`);
      toRemove.forEach((block) => {
        block.parentNode.removeChild(block)
      })
      // remove from the tracking board
      boardTracker.splice(rowNumber, 1)
      boardTracker.unshift(getColumnsArray())
      // now move all elements above the current row down one row
      let toMove = document.querySelectorAll(`.block`);
      toMove.forEach((block) => {
        let y = parseInt(block.style.gridRow, 10)
        if (y <= rowNumber + 1) {
          block.style.gridRow = y+1
          block.dataset.row = y+1
        }
      })
    }
  })  
}

// add a new block and track it as the current block
function addBlock() {
  currentBlock = []
  colorIndex   = Math.floor(Math.random() * colors.length)
  currentType  = Math.floor(Math.random() * possibleShapes.length);
  possibleShapes[currentType].forEach((block) => {
    addSubBlock(block, colors[colorIndex])
  })
  setTimeout(() => {
    // check if the block is already set
    if (blockSet()) {
      endGame()
    }
  }, 5)
}

function addSubBlock(block, color) {
  let subBlock = document.createElement('div')
  subBlock.classList.add('block')
  subBlock.style.gridRow = block[0]
  subBlock.style.gridColumn = block[1] + 6
  subBlock.style.backgroundColor = color
  gameBoard.appendChild(subBlock)
  currentBlock.push(subBlock)
}

// end the current game
function endGame() {
  clearInterval(gameTimer)  
  gameTimer = null
  dialog.show()
}

// need a way to restart the game
restartButton.addEventListener('click', (event) => {
  // Remove old blocks
  let allBlocks = document.querySelectorAll(`.block`)
  allBlocks.forEach((block) => {
    block.parentNode.removeChild(block)
  })
  // reset the score
  score = 0
  scoreElement.innerHTML = `${score}`
  // restart
  startGame()
  dialog.close()
})

$(window).scroll(function () {
  var sc = $(window).scrollTop()
  if (sc > 100) {
      $("#header-sroll").addClass("small")
  } else {
      $("#header-sroll").removeClass("small")
  }
});