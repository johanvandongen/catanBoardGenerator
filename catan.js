var c = document.getElementById("catanBoard");
var ctx = c.getContext("2d");

c.width = 400;
c.height = 400;
let ribSize = 40

/* --------------------
media queries
-------------------- */
if (window.matchMedia("(max-width: 425px)").matches) {
    c.width = 360;
    c.height = 360;
    ribSize = 38;
}
if (window.matchMedia("(max-width: 375px)").matches) {
    c.width = 280;
    c.height = 280;
    ribSize = 30;
}
const colorMapping = {"wool" : "#98C946", "wood" : "#0E7D3E", "grain" : "#E0A227", "brick" :"#9F6D31", "ore": "#858F80", "robber" : "#F7E08C"};
const ringDict = {'inner': [9], 'middle': [4,5,8,10,13,14], 'outer':[0,1,2,3,6,7,11,12,15,16,17,18], 'all':[0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18]};

// -------------------------------
// Draw hexagon with number tokens
// -------------------------------
function drawHexagon(x,y, ribSize, type, number) {
    // Hexagon with color
    ctx.beginPath();
    ctx.moveTo(x,y-ribSize); //start at most upper point
    ctx.lineTo(x+0.5*Math.sqrt(3)*ribSize, y-0.5*ribSize);
    ctx.lineTo(x+0.5*Math.sqrt(3)*ribSize, y-0.5*ribSize+ribSize);
    ctx.lineTo(x, y+ribSize);
    ctx.lineTo(x-0.5*Math.sqrt(3)*ribSize, y+0.5*ribSize);
    ctx.lineTo(x-0.5*Math.sqrt(3)*ribSize, y+0.5*ribSize-ribSize);
    ctx.lineTo(x, y-ribSize);
    ctx.closePath();
    ctx.lineWidth = 5;
    ctx.fillStyle = colorMapping[type];
    ctx.stroke();
    ctx.fill();  

    //draw number tokens
    if (number != 0) {
        //draw closed circle
        ctx.moveTo(x+20,y);
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(x, y, ribSize/2.5, 0, 2 * Math.PI);
        ctx.fillStyle = "black";
        ctx.fill();
        
        //draw number
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        fontSize = (number == 2 || number == 12) ? ribSize/4 : ribSize/2.5;
        ctx.font = "bold " + fontSize + "pt Calibri";
        ctx.fillStyle = (number == 6 || number ==8) ? "red" : "white";
        ctx.fillText(number, x, y);
        ctx.stroke();
    }
}

// Calculate the center coordinates of all hexes 
// Horizontal distance is:  1/2 * sqrt(3) * ribsize * 2
// Vertical distance is:    1.5 ribsize
function generateCoords(boardList, ribSize) {
    let hexagonCenterCoords = [];
    let maxRowSize = Math.max.apply(Math, boardList);
    let startX = c.width/2-Math.sqrt(3)*ribSize*2; // Most left x value (middle row)
    let y = c.height/2 -3*ribSize; // Highest hexagon center

    for (let i = 0; i<boardList.length; i++) {
        let x = startX + (maxRowSize-boardList[i])*0.5*Math.sqrt(3)*ribSize;
        for (let j=0; j<boardList[i]; j++) {
            hexagonCenterCoords.push([x,y]);
            x+=Math.sqrt(3)*ribSize;
        }
        y+=1.5*ribSize;
    }
    return hexagonCenterCoords;
}

// ----------------------------------------------
// Calculate all three-tile-intersection indexes
// ----------------------------------------------
function calcIntersections(boardList) {
    let intersections = [];
    let indexSoFar = 0; // Sum of tiles in previous rows
    const totalTiles = boardList.reduce((a, b) => a + b, 0)-1;
    for (let i = 0; i < Math.floor(boardList.length/2); i++) {
        for (let j=0; j < boardList[i]; j++) {
            intersections.push([indexSoFar+j, indexSoFar+j+boardList[i], indexSoFar+j+boardList[i]+1]);
            intersections.push([totalTiles-(indexSoFar+j), totalTiles-(indexSoFar+j)-boardList[i], totalTiles-(indexSoFar+j)-boardList[i]-1]);
            if (indexSoFar+j+1 < indexSoFar+boardList[i]) {
                intersections.push([indexSoFar+j, indexSoFar+j+1, indexSoFar+j+boardList[i]+1]);
                intersections.push([totalTiles-(indexSoFar+j), totalTiles-(indexSoFar+j)-1, totalTiles-(indexSoFar+j)-boardList[i]-1]);
            }
        }
        indexSoFar += boardList[i];
    }
    return intersections;
}

// Generate Hexagon layout
const boardList = [3,4,5,4,3] //nr of tiles in each row
const coords = generateCoords(boardList, ribSize)
const intersections = calcIntersections(boardList)

// ----------------------------
// Generate random number array
// ----------------------------
function generateNumbers(robberIndex) {
    let numbers = [2,3,3,4,4,5,5,6,6,8,8,9,9,10,10,11,11,12];
    let new_numbers = [];
    let length = numbers.length+1;
    for (let i=0; i < length; i++) {
        if (i == robberIndex) {
            new_numbers.push(0);
        } else {
            const randomNumber = numbers[Math.floor(Math.random() * numbers.length)]; 
            const index = numbers.indexOf(randomNumber);
            numbers.splice(index, 1);
            new_numbers.push(randomNumber);
        }
    }
    return new_numbers;
}
// Brute force multple random number arrays and return a balanced one
function generateBalancedNumbers(robberIndex, low, high) {
    for (let i=0; i<1000; i++) {
        let numbers = generateNumbers(robberIndex);
        let values = checkPips(numbers, intersections);
        let check = true;

        for (let i=0; i < values.length; i++) {
            if (!pipBetween(low,high, values[i])) {
                check = false;
            }
        }
        if (check) {
            // console.log("num: ", numbers);
            console.log("val: ", values);
            return numbers;
        }
    }
    alert("Could not find a number sequence in time, try again!");
    return numbers;
}
function pipBetween(low, high, num) {
    if (num >= low && num <= high) {
        return true;
    }
}
// Calculate resource points (pips) on all three-tile-intersections
function checkPips(numbers, intersections) {
    const numberValue = {0:0, 2:1, 3:2, 4:3, 5:4, 6:5, 8:5, 9:4, 10:3, 11:2, 12:1};
    let intersectionValues = [];
    for (let i=0; i<intersections.length; i++) {
        let values = intersections[i].map(v => numberValue[numbers[v]]);
        let sum_values = values.reduce((a, b) => a + b, 0);
        intersectionValues.push(sum_values);
    }
    return intersectionValues;
}

// ---------------------------
// Generate random tile array
// ---------------------------
function generateTiles(robberIndex) {
    let types = ["wool","grain","wool","wool","wood","brick","wood","wood","grain","wool","grain","grain", "brick","wood","brick", "ore","ore","ore"];
    let length = types.length+1;
    let new_tiles = [];

    for (let i=0; i < length; i++) {
        if (i == robberIndex) {
            new_tiles.push("robber")
        } else {
            const randomTile = types[Math.floor(Math.random() * types.length)]; 
            const index2 = types.indexOf(randomTile);
            types.splice(index2, 1);
            new_tiles.push(randomTile);
        }
    }
    return new_tiles;
}
function generateRandomTiles(robberIndex) {
    let types = {"grain" : 4, "wool" : 4, "wood" : 4, "brick" : 3, "ore" : 3};
    const allTiles = ["grain","wool","wood","ore","brick"];
    let new_tiles = [];
    let adjTiles = [];
    let complementTiles = [];
    let randomTile;
    let indexSoFar = 0;

    for (let i = 0; i < Math.floor(boardList.length); i++) {
        for (let j=0; j < boardList[i]; j++) {
            // Find roughhly adjacent tiles
            // The indexes put in the array might contain tiles which are not adjacent
            // but that is not a big deal. 
            if (indexSoFar+j < 3+4+5) {
                adjIndexes = [indexSoFar+j-1, indexSoFar+j-boardList[i],indexSoFar+j-boardList[i]+1];
            } else {
                adjIndexes = [indexSoFar+j-1, indexSoFar+j-boardList[i]-1,indexSoFar+j-boardList[i]];
            }

            adjTiles = [];
            for (let i=0; i < adjIndexes.length;i++) {
                if (adjIndexes[i] >= 0) {
                    adjTiles.push(new_tiles[adjIndexes[i]])
                }
            }
            complementTiles = allTiles.filter(x => !adjTiles.includes(x));
            // console.log(indexSoFar+j,  adjIndexes)
            // console.log("check: ", adjTiles)
            // console.log("other: ", complementTiles)

            //Determine which tile type to push
            if (indexSoFar+j==robberIndex) {
                new_tiles.push("robber");
            } else {
                // Look at the adjecent tiles and push a tile that
                // is different if possible (if possible loop ends)
                let done = false;
                while (!done){
                    randomNum = Math.floor(Math.random()*100); // Chance for pushing a tile that is the same as the tiles next to it
                    if (randomNum < 10) {
                        randomTile = adjTiles[Math.floor(Math.random() * adjTiles.length)];  
                    } else {
                        randomTile = complementTiles[Math.floor(Math.random() * complementTiles.length)];  
                    }
                    //remove tile from types
                    if (types[randomTile] > 0 ) {
                        types[randomTile] -= 1;
                        done = true;
                    } 
                }
                new_tiles.push(randomTile);
            }
        }
        indexSoFar += boardList[i];
    }
    // console.log(new_tiles)
    return new_tiles;
}



// ------------
// Generate Map
// ------------
var ring = 'all' // change on user input
var low_high = [1, 15] // change on user input
function generateMap(new_numbers, new_tiles) {
    if (!(new_numbers == false || new_tiles == false)) {
        robberPlace= ringDict[ring][Math.floor(Math.random()*ringDict[ring].length)]
    }
    if (new_numbers == true) {
        numbers = generateBalancedNumbers(robberPlace,low_high[0],low_high[1])
    }
    if (new_tiles == true) {
        // tiles = generateTiles(robberPlace)
        tiles = generateRandomTiles(robberPlace)
    }

    // Draw all hexes with the genrated tiles and numbers
    for (let i=0; i<coords.length; i++) {  
        drawHexagon(coords[i][0],coords[i][1], ribSize, tiles[i], numbers[i]) 
    }
}

selectRobberPlace("all", "all"); // Default option
selectBalanced("balance2", 6, 15); // Default option
generateMap(true, true); // Generate initial board

// ----------
// User input
// ----------
function selectRobberPlace(id, selectedRing) {
    ring = selectedRing;  //var already declared above
    const robberoptions = document.getElementsByClassName("robberOption");
    for (let i=0; i<robberoptions.length; i++) {
        robberoptions[i].style.border = "5px solid #eee";
    }
    document.getElementById(id).style.border = "5px solid var(--color-theme)";
    
}
function selectBalanced(id, low, high) {
    low_high = [low, high]; //var already declared above
    const numberOptions = document.getElementsByClassName("numberOption");   
    for (let i=0; i<numberOptions.length; i++) {
        numberOptions[i].style.border = "5px solid #eee";
    }
    document.getElementById(id).style.border = "5px solid var(--color-theme)"
}