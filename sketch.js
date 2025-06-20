let table;
let entries = [];
let entriesByYear = {};
let yearSlider;
let selectedYear;
let availableYears = [];
let cnv;
let tooltipEntry = null; 

const cropEdgeGroups = {
  // Root vegetables
  "carrots": "root",
  "beets": "root",
  "radish": "root",
  "garlic": "root",
  "onions": "root",
  "yams": "root",
  "turnips": "root",
  "potatoes": "root",

  // Leafy greens
  "spinach": "leafy",
  "kale": "leafy",
  "chard": "leafy",
  "lettuce": "leafy",
  "cabbage": "leafy",
  "arugula": "leafy",
  "herbs": "leafy",

  // Fruit-bearing
  "tomatoes": "fruit",
  "squash": "fruit",
  "peppers": "fruit",
  "melons": "fruit",
  "eggplant": "fruit",
  "cucumbers": "fruit",
  "berries": "fruit",

  // Grains & grasses
  "hay": "grain",
  "spring wheat": "grain",
  "corn": "grain",
  "saffron": "grain",

  // Vining / perennial
  "grapes": "vine",
  "vanilla": "vine",
  "tea": "vine",
  "kiwi": "vine",
  "lavender": "vine",
  "peppercorn": "vine",
  "maile": "vine",

  // Mixed
  "mixed vegetables": "mixed",
  "assorted vegetables": "mixed"
};

function preload() {
  table = loadTable('data/inspire-agrivoltaics-20250529.csv', 'csv', 'header');
}

function setup() {
  for (let i = 0; i < table.getRowCount(); i++) {
    let name = table.getString(i, 'Name') || '';
    let activityStr = table.getString(i, 'Agrivoltaic Activities') || '';
    let activities = activityStr ? activityStr.split(/,\s*/) : [];
    let habitatStr = String(table.getString(i, 'Habitat Type') || '').trim();
    let habitat = habitatStr ? habitatStr.split(/,\s*/) : [];
    let animalTypeStr = table.getString(i, 'Animal Type') || '';
    let animalType = animalTypeStr ? animalTypeStr.split(/,\s*/) : [];
    let cropTypeStr = table.getString(i, 'Crop Types') || '';
    let cropType = cropTypeStr ? cropTypeStr.split(/,\s*/) : [];
    let year = table.getString(i, 'Year Installed') || 'Unknown';

    let entry = {
      name,
      activities,
      habitat,
      animalType,
      cropType,
      year
    };

    entries.push(entry);

    if (!entriesByYear[year]) {
      entriesByYear[year] = [];
    }
    entriesByYear[year].push(entry);
  }

  availableYears = Object.keys(entriesByYear).sort();
  selectedYear = availableYears[0];

  yearSlider = createSlider(0, availableYears.length - 1, 0);
  yearSlider.style('width', '400px');
  yearSlider.input(() => {
    selectedYear = availableYears[yearSlider.value()];
    windowResized(); // triggers height adjustment
  });

  cnv = createCanvas(windowWidth * 0.9, windowHeight * 0.8);
  centerCanvas();
  centerSlider();

  textFont('Helvetica');
  textSize(16);
  textAlign(CENTER, CENTER);
  rectMode(CENTER);
  noLoop();
}

function windowResized() {
  let yearEntries = entriesByYear[selectedYear] || [];
  let shapeSize = 150;
  let padding = 60;
  let numCols = floor((windowWidth * 0.9 - padding) / (shapeSize + padding));
  numCols = max(numCols, 1);

  let numRows = ceil(yearEntries.length / numCols);
  let totalHeight = 100 + numRows * (shapeSize + padding);

  resizeCanvas(windowWidth * 0.9, max(windowHeight * 0.8, totalHeight));
  centerCanvas();
  centerSlider();
  redraw();
}

function centerCanvas() {
  let x = (windowWidth - width) / 2;
  let y = (windowHeight - height) / 2 - 30;
  cnv.position(x, y);
}

function centerSlider() {
  let sliderWidth = parseInt(yearSlider.style('width'));
  let x = windowWidth / 2 - sliderWidth / 2;
  let y = windowHeight - 60;
  yearSlider.position(x, y);
}

function draw() {
  background(255);
  fill(0);
  textSize(24);
  textAlign(CENTER, TOP);
  text("Year: " + selectedYear, width / 2, 30);

  let yearEntries = entriesByYear[selectedYear] || [];

  if (yearEntries.length === 0) {
    text("No data available for this year.", width / 2, height / 2);
    return;
  }

  let padding = 60;
  let shapeSize = 150;
  let startY = 80;
  let numCols = floor((width - padding) / (shapeSize + padding)); // calculate number of columns that fit

  for (let i = 0; i < yearEntries.length; i++) {
    let entry = yearEntries[i];
    let col = i % numCols;
    let row = floor(i / numCols);

    let centerX = padding + col * (shapeSize + padding) + shapeSize / 2;
    let centerY = startY + row * (shapeSize + padding) + shapeSize / 2;
    let baseColor = getActivityColor(entry.activities?.[0] || '');

    push();
    translate(centerX, centerY);

    if (Array.isArray(entry.habitat) && entry.habitat.length > 0) {
      drawHabitatShape(entry.habitat, 0, 0, shapeSize, baseColor);
    }

    if (Array.isArray(entry.activities) && entry.activities.length > 0 &&
        Array.isArray(entry.habitat) && entry.habitat.length > 0) {
      drawCheckerboardPattern(entry.activities, entry.habitat, 0, 0, shapeSize);
    }

    if (entry.cropType && entry.cropType.length > 0) {
      drawCropEdgeStyle(entry.cropType, 0, 0, shapeSize);
    }

    if (entry.animalType && entry.animalType.length > 0) {
      drawAnimalLine(entry.animalType, 0, 0, shapeSize);
    }

    pop();

    textSize(14);
    textAlign(CENTER, TOP);
    text(entry.name, centerX, centerY + shapeSize / 2 + 8);
  }

  if (tooltipEntry) {
    drawTooltip(tooltipEntry);
  }
}


function drawTooltip(entry) {
  let textLines = [
    "Name: " + entry.name,
    "Habitat Type: " + (Array.isArray(entry.habitat) ? entry.habitat.join(', ') : entry.habitat),
    "Activities: " + entry.activities.join(', '),
    "Animal Type: " + entry.animalType.join(', '),
    "Crop Type: " + (Array.isArray(entry.cropType) ? entry.cropType.join(', ') : String(entry.cropType))
  ];

  textSize(14);
  let w = 0;
  for (let line of textLines) {
    w = max(w, textWidth(line));
  }
  let h = textLines.length * 18 + 10;

  let x = entry.x + 15;
  let y = entry.y + 15;

  if (x + w + 10 > width) x -= w + 30;
  if (y + h + 10 > height) y -= h + 30;

  fill(255);
  stroke(0);
  strokeWeight(1);
  rect(x, y, w + 20, h, 16);

  noStroke();
  fill(0);
  for (let i = 0; i < textLines.length; i++) {
    text(textLines[i], x + 5, y + 20 + i * 18 - 10);
  }
}

function mousePressed() {
  let yearEntries = entriesByYear[selectedYear] || [];
  let shapeSize = 150;
  let padding = 60;
  let startY = 80;

  tooltipEntry = null;

  // Calculate number of columns fitting in the current canvas width
  let numCols = floor((width - padding) / (shapeSize + padding));
  numCols = max(numCols, 1);

  for (let i = 0; i < yearEntries.length; i++) {
    let col = i % numCols;
    let row = floor(i / numCols);

    let centerX = padding + col * (shapeSize + padding) + shapeSize / 2;
    let centerY = startY + row * (shapeSize + padding) + shapeSize / 2;

    let d = dist(mouseX, mouseY, centerX, centerY);

    if (d < shapeSize / 2) {
      // Show tooltip near the shape center (you can also use mouseX/mouseY if preferred)
      tooltipEntry = { ...yearEntries[i], x: centerX, y: centerY };
      break;
    }
  }

  redraw();
}

function keyPressed() {
  if (!tooltipEntry) return;

  // Press 'Escape' to close tooltip
  if (keyCode === ESCAPE) {
    tooltipEntry = null;
    redraw();
    return;
  }

  // Move between tiles with arrow keys
  let yearEntries = entriesByYear[selectedYear];
  if (!yearEntries) return;

  let currentIndex = yearEntries.findIndex(e => e.name === tooltipEntry.name);
  if (currentIndex === -1) return;

  let shapeSize = 150;
  let padding = 60;
  let startY = 80;
  let numCols = floor((width - padding) / (shapeSize + padding));
  numCols = max(numCols, 1);

  if (keyCode === RIGHT_ARROW && currentIndex < yearEntries.length - 1) {
    let newIndex = currentIndex + 1;
    let col = newIndex % numCols;
    let row = floor(newIndex / numCols);
    let centerX = padding + col * (shapeSize + padding) + shapeSize / 2;
    let centerY = startY + row * (shapeSize + padding) + shapeSize / 2;

    tooltipEntry = { ...yearEntries[newIndex], x: centerX, y: centerY };
    redraw();

  } else if (keyCode === LEFT_ARROW && currentIndex > 0) {
    let newIndex = currentIndex - 1;
    let col = newIndex % numCols;
    let row = floor(newIndex / numCols);
    let centerX = padding + col * (shapeSize + padding) + shapeSize / 2;
    let centerY = startY + row * (shapeSize + padding) + shapeSize / 2;

    tooltipEntry = { ...yearEntries[newIndex], x: centerX, y: centerY };
    redraw();
  }
}

function drawCropEdgeStyle(cropTypes, x, y, size) {
  if (!Array.isArray(cropTypes) || cropTypes.length === 0) return;

  // Map each crop to its group
  const groups = cropTypes
    .map(crop => cropEdgeGroups[crop.trim().toLowerCase()])
    .filter(Boolean);

  // Collect unique crop groups
  const uniqueGroups = [...new Set(groups)];
  if (uniqueGroups.length === 0) return;

  push();
  translate(x, y);
  noFill();
  strokeWeight(2);

  for (let i = 0; i < uniqueGroups.length; i++) {
    let group = uniqueGroups[i];

    // Set stroke color by group
     switch (group) {
      case 'root':
        stroke('#A020F0'); // Purple
        drawPointedEdge(size, i);
        break;
      case 'leafy':
        stroke('#D2691E'); // Earthy orange-brown
        drawWavyEdge(size, i);
        break;
      case 'fruit':
        stroke('#1155CC'); // Blue
        drawLobedEdge(size, i);
        break;
      case 'grain':
        stroke('#DAA520'); // Goldenrod
        drawLinearSpikes(size, i);
        break;
      case 'vine':
        stroke('#FF1493'); // Hot pink
        drawSpiralOverlay(size, i);
        break;
      case 'mixed':
        stroke('#20C997'); // Mint-teal
        drawWavyEdge(size, i);
        break;
    }
  }

  pop();
}

function drawPointedEdge(size, offsetIndex = 0) {
  let steps = 72;
  beginShape();
  for (let i = 0; i <= steps; i++) {
    let angle = TWO_PI * i / steps;
    let radius = size * 0.45 + (i % 2 === 0 ? 10 : -10);
    let x = cos(angle) * radius;
    let y = sin(angle) * radius;
    vertex(x, y);
  }
  endShape(CLOSE);
}

function drawWavyEdge(size, offsetIndex = 0) {
  let waves = 8 + offsetIndex * 2;
  beginShape();
  for (let angle = 0; angle <= TWO_PI + 0.1; angle += 0.05) {
    let r = size * 0.4 + 10 * sin(waves * angle);
    let x = cos(angle) * r;
    let y = sin(angle) * r;
    curveVertex(x, y);
  }
  endShape(CLOSE);
}

function drawLobedEdge(size, offsetIndex = 0) {
  let lobes = 5 + offsetIndex;
  beginShape();
  for (let angle = 0; angle <= TWO_PI + 0.1; angle += 0.05) {
    let r = size * 0.4 + 8 * sin(lobes * angle);
    let x = cos(angle) * r;
    let y = sin(angle) * r;
    curveVertex(x, y);
  }
  endShape(CLOSE);
}

function drawLinearSpikes(size, offsetIndex = 0) {
  let lines = 12;
  for (let i = 0; i < lines; i++) {
    let angle = TWO_PI * i / lines + offsetIndex * 0.05;
    let x1 = cos(angle) * size * 0.3;
    let y1 = sin(angle) * size * 0.3;
    let x2 = cos(angle) * size * 0.5;
    let y2 = sin(angle) * size * 0.5;
    line(x1, y1, x2, y2);
  }
}

function drawSpiralOverlay(size, offsetIndex = 0) {
  noFill();
  beginShape();
  for (let a = 0; a < TWO_PI * 3; a += 0.1) {
    let r = size * 0.05 * a + offsetIndex * 2;
    let x = cos(a) * r;
    let y = sin(a) * r;
    vertex(x, y);
  }
  endShape();
}

// Draw different line styles based on Animal Type
function drawAnimalLine(animalType, x, y, size) {
  let style = getLineStyle(animalType);
  if (!style) return;
  stroke(style.color);
  strokeWeight(style.weight);
  noFill();

  switch (style.type) {
    case 'wavy':
      drawWavyLine(x, y, size);
      break;

    case 'dashed':
      drawDashedLine(x, y, size);
      break;

    case 'bezier':
      drawBezierLine(x, y, size);
      break;

    case 'straight':
      line(x - size / 2, y, x + size / 2, y);
      break;

    case 'textured':
      drawTexturedLine(x, y, size);
      break;

  }
}

// Map Animal Type to line style properties
function getLineStyle(animalType) {
  let typeStr = String(animalType || '').trim().toLowerCase();

   if (!typeStr) return null;

  switch (typeStr) {
        case 'sheep':
      return { type: 'wavy', weight: 2, color: color('#E63946CC') }; // Suprematist-inspired crimson
    case 'llamas & alpacas':
      return { type: 'dashed', weight: 2, color: color('#3A0CA3CC') }; // Deep violet-blue
    case 'horse':
      return { type: 'bezier', weight: 3, color: color('#FF6700CC') }; // Vivid orange
    case 'cows':
      return { type: 'straight', weight: 5, color: color('#B7410ECC') }; // Warm brick tone
    case 'cattle':
      return { type: 'textured', weight: 3, color: color('#D8837FCC') }; // Dusty rose
    default:
        pop(); 
        return;
  }
}

// Wavy line: sinusoidal wave along the horizontal axis
function drawWavyLine(x, y, length) {
  noFill();
  beginShape();
  let amplitude = 5;
  let waves = 6;
  for (let i = 0; i <= waves; i++) {
    let px = x - length / 2 + (length / waves) * i;
    let py = y + sin(i * TWO_PI / waves) * amplitude;
    vertex(px, py);
  }
  endShape();
}

// Dashed line: repeated short dashes with gaps
function drawDashedLine(x, y, length) {
  let dashLength = 10;
  let gapLength = 7;
  let startX = x - length / 2;
  let endX = x + length / 2;
  for (let px = startX; px < endX; px += dashLength + gapLength) {
    line(px, y, px + dashLength, y);
  }
}

// Bezier curved line with smooth S shape
function drawBezierLine(x, y, length) {
  noFill();
  bezier(
    x - length / 2, y,
    x - length / 4, y - length / 3,
    x + length / 4, y + length / 3,
    x + length / 2, y
  );
}

// Textured line: short broken segments with jitter
function drawTexturedLine(x, y, length) {
  let segmentLength = 6;
  let gap = 4;
  let startX = x - length / 2;
  let endX = x + length / 2;
  for (let px = startX; px < endX; px += segmentLength + gap) {
    let jitterY = random(-2, 2);
    line(px, y + jitterY, px + segmentLength, y + jitterY);
  }
}

function drawHabitatShape(habitatList, x, y, size, baseColor) {
  if (!Array.isArray(habitatList)) return;

  // Filter out empty strings, null, undefined, or whitespace-only values
  habitatList = habitatList
    .map(h => (typeof h === 'string' ? h.trim().toLowerCase() : ''))
    .filter(h => h !== '');

  // Stop if nothing valid remains
  if (habitatList.length === 0) return;

  push();
  translate(x, y);
  rectMode(CENTER);
  angleMode(RADIANS);
  noStroke();

  for (let i = 0; i < habitatList.length; i++) {
    let habitat = habitatList[i];
    let angleOffset = PI / 8 * i;
    let alpha = map(i, 0, habitatList.length, 180, 100);
    let fillColor = color(baseColor.levels[0], baseColor.levels[1], baseColor.levels[2], alpha);

    fill(fillColor);
    rotate(angleOffset);

    switch (habitat) {
      case 'pollinator':
        beginShape();
        for (let j = 0; j < 6; j++) {
          let angle = TWO_PI / 6 * j - PI / 2;
          let vx = cos(angle) * size * 0.5;
          let vy = sin(angle) * size * 0.5;
          vertex(vx, vy);
        }
        endShape(CLOSE);
        break;

      case 'native grasses':
        rect(0, 0, size * 0.3, size);
        break;

      case 'naturalized':
        ellipse(0, 0, size, size);
        break;
    }
  }

  pop();
}

function drawCheckerboardPattern(activities, habitat, x, y, size) {
  if (!Array.isArray(activities) || activities.length === 0) return;
  if (!Array.isArray(habitat) || habitat.length === 0) return;

  // Sanitize habitat list
  habitat = habitat
    .map(h => (typeof h === 'string' ? h.trim().toLowerCase() : ''))
    .filter(h => h !== '');
  if (habitat.length === 0) return;

  push();
  translate(x, y);
  rectMode(CENTER);
  noStroke();

  let gridCount = 8; // 8x8 grid
  let cellSize = size / gridCount;
  let colors = activities.map(act => getActivityColor(act)).filter(Boolean);
  let colorCount = colors.length;

  if (colorCount === 0) return;

  for (let row = 0; row < gridCount; row++) {
    for (let col = 0; col < gridCount; col++) {
      // Use more colors: index based on (row + col)
      let index = (row * gridCount + col) % colorCount;
      let fillColor = colors[index];

      let cx = col * cellSize - size / 2 + cellSize / 2;
      let cy = row * cellSize - size / 2 + cellSize / 2;

      if (isPointInHabitatShape(habitat, cx, cy, size)) {
        fill(fillColor);
        rect(cx, cy, cellSize, cellSize);
      }
    }
  }

  pop();
}


function isPointInHabitatShape(habitat, px, py, size) {
  // Ensure habitat is an array
  let habitats = Array.isArray(habitat) ? habitat : [habitat];

  for (let h of habitats) {
  if (typeof h !== 'string') continue;

  let cleaned = h.trim().toLowerCase();
    switch (cleaned) {
      case 'pollinator':
        if (pointInHexagon(px, py, size * 0.5)) return true;
        break;
      case 'native grasses':
        if (abs(px) <= size * 0.15 && abs(py) <= size * 0.5) return true;
        break;
      case 'naturalized':
        if (px * px + py * py <= (size / 2) * (size / 2)) return true;
        break;
    }
  }

  return false; // if no matches
}

function pointInHexagon(px, py, r) {
  px = abs(px);
  py = abs(py);

  if (px > r * 0.8660254 || py > r * 0.5 + r * 0.288675) return false;
  return r * 0.5 * r * 0.8660254 - px * r * 0.5 - py * r * 0.8660254 >= 0;
}

  
function getActivityColor(activity) {
  switch (activity.trim().toLowerCase()) {
 case 'crop production':
      return color('#DA1E37'); // Bold red
    case 'habitat':
      return color('#228B22'); // Forest green
    case 'grazing':
      return color('#007CBE'); // Blue
    case 'greenhouse':
      return color('#F2D43D'); // Yellow
    default:
        pop(); 
        return;
  }
}
