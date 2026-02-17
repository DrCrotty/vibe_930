let skateboardX = 50;
let skateboardSpeed = 3;
let bounce = 0;
let bounceSpeed = 0.05;

function setup() {
    let container = document.getElementById('sketch-container');
    let width = container.clientWidth || 800;
    let height = container.clientHeight || 600;
    createCanvas(width, height);
}

function draw() {
    background(135, 206, 235); // Sky blue
    
    // Update skateboard position
    skateboardX += skateboardSpeed;
    
    // Loop skateboard back to start
    if (skateboardX > width + 100) {
        skateboardX = -100;
    }
    
    // Bounce animation
    bounce = sin(frameCount * bounceSpeed) * 10;
    
    // Draw ground
    fill(34, 139, 34); // Forest green
    rect(0, height - 100, width, 100);
    
    // Draw skateboard
    drawSkateboard(skateboardX, height - 150 + bounce);
    
    // Draw frog
    drawFrog(skateboardX + 35, height - 160 + bounce);
}

function drawSkateboard(x, y) {
    push();
    
    // Main board
    fill(220, 20, 60); // Crimson red
    rect(x, y, 80, 25, 5);
    
    // Board pattern
    fill(255, 200, 0); // Gold
    for (let i = 0; i < 4; i++) {
        circle(x + 15 + i * 18, y + 12.5, 8);
    }
    
    // Wheels (axles)
    fill(50);
    rect(x + 5, y + 20, 15, 15, 3);
    rect(x + 60, y + 20, 15, 15, 3);
    
    // Wheels
    fill(100);
    circle(x + 12.5, y + 27.5, 12);
    circle(x + 72.5, y + 27.5, 12);
    
    // Wheel hubs
    fill(200);
    circle(x + 12.5, y + 27.5, 6);
    circle(x + 72.5, y + 27.5, 6);
    
    pop();
}

function drawFrog(x, y) {
    push();
    
    // Body
    fill(34, 139, 34); // Forest green
    ellipse(x, y - 5, 35, 40);
    
    // Head
    fill(50, 170, 50); // Lighter green
    circle(x, y - 25, 30);
    
    // Eyes
    fill(255);
    ellipse(x - 8, y - 32, 8, 12);
    ellipse(x + 8, y - 32, 8, 12);
    
    // Pupils
    fill(0);
    let pupilOffset = sin(frameCount * 0.05) * 2;
    circle(x - 8 + pupilOffset, y - 30, 4);
    circle(x + 8 + pupilOffset, y - 30, 4);
    
    // Mouth
    stroke(0);
    strokeWeight(2);
    noFill();
    arc(x, y - 20, 12, 8, 0, PI);
    
    // Front legs
    strokeWeight(3);
    stroke(34, 139, 34);
    let legBounce = cos(frameCount * 0.1) * 3;
    line(x - 10, y + 12, x - 18, y + 18 + legBounce);
    line(x + 10, y + 12, x + 18, y + 18 + legBounce);
    
    // Feet
    fill(34, 139, 34);
    noStroke();
    ellipse(x - 18, y + 20 + legBounce, 8, 6);
    ellipse(x + 18, y + 20 + legBounce, 8, 6);
    
    pop();
}
