let running = false;

function pulse(rate){
    let interval = setInterval(()=>{
        if(running){
            var elm = document.getElementById('pulsar');
            elm.classList.add("pulse");
            elm.parentNode.replaceChild(elm.cloneNode(true), elm);
        }
        else{
            clearInterval(interval);
        }
    },60/rate*1000);
    return interval;
}

function startPulsing(profile, start = 0){
    running = true;
    [rate,duration] = profile[start];
    console.log(profile[start]);
    let pulseInterval = pulse(rate);
    setTimeout(()=>{
        clearInterval(pulseInterval);
        if (start+1 < profile.length && running){
            startPulsing(profile,start+1);
        }
        else{
            running = false;
        }
    },duration*1000);   
}
function stopPulsing(){
    running = false;
}

function getMousePos(canvas, evt) {
    var rect = canvas.getBoundingClientRect();
    let x = (evt.clientX - rect.left) / (rect.right - rect.left) * canvas.width;
    let y = (evt.clientY - rect.top) / (rect.bottom - rect.top) * canvas.height;
    return { x: x, y: y, inBounds: (x > 0 && x < canvas.width && y > 0 && y < canvas.height)
    };
}

class Node{
    constructor(x,y,r=12){
        this.x = x;
        this.y = y;
        this.r = r;
    }
    draw(canvas, ctx){
        ctx.beginPath();
        ctx.fillStyle = "black";
        ctx.arc(this.x, this.y, this.r, 0, 2 * Math.PI);
        ctx.fill();
    }
}

class Nodes {
    constructor(canvas, ctx, controlPoints = 10){
        this.controlPoints = controlPoints;
        this.nodes = Array(controlPoints);
        for (let i = 0; i < controlPoints; i++) {
            this.nodes[i] = new Node((canvas.width/(controlPoints-1))*i,canvas.height/2);
        }
        console.log(this.nodes);
        this.canvas = canvas;
        this.ctx = ctx;
        this.dragging = -1;
        this.draw();
    }
    draw(dots = true){
        ctx.fillStyle = 'white';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        if (dots){
            for (const node of this.nodes) {
                node.draw(this.canvas,this.ctx);
            }
        }
        ctx.moveTo(this.nodes[0].x,this.nodes[0].y);
        let points = [];
        for (const node of this.nodes) {
            points.push(node.x);
            points.push(node.y);
        }
        ctx.curve(points);
        ctx.stroke();
        
    }
    //returns index of nearest node in nodes array. Retruns -1 if none found.
    nearestNode(pos){
        let min = Infinity;
        let index = -1;
        for (let i = 0; i < this.nodes.length; i++) {
            let dist = Math.sqrt(Math.pow(pos.x-this.nodes[i].x,2)+Math.pow(pos.y-this.nodes[i].y,2));
            if(dist < min){
                min = dist;
                index = i;
            }
        }
        return index;
    }
    handleMouseDown(pos){
        let nearest = this.nearestNode(pos);
        if(nearest != -1){
            this.dragging = nearest;
        }
        this.draw();
    }
    handleMouseUp(pos){
        this.dragging = -1;
        this.draw();
    }
    handleMouseMove(pos){
        if(this.dragging != -1){
            this.nodes[this.dragging].y = pos.y;
        }
        this.draw();
    }
  }


const canvas = document.getElementById('profileCanvas');
let canvasSyle = window.getComputedStyle(canvas);
console.log(canvasSyle.width);
canvas.width  = parseInt(canvasSyle.width) * 2;
canvas.height = parseInt(canvasSyle.height) * 2;
const ctx = canvas.getContext('2d');
ctx.fillStyle = 'white';
ctx.fillRect(0, 0, canvas.width, canvas.height);

let nodes = new Nodes(canvas,ctx);

canvas.addEventListener('mousedown', (e)=>{
    nodes.handleMouseDown(getMousePos(canvas, e));
});
window.addEventListener('mouseup', (e)=>{
    nodes.handleMouseUp(getMousePos(canvas, e));
});
canvas.addEventListener('mousemove', (e)=>{
    nodes.handleMouseMove(getMousePos(canvas, e));
});


function extractProfileFromCanvas(ctx){
    let profile = [];
    let imageData = ctx.getImageData(0,0,ctx.canvas.width,ctx.canvas.height);
    let data = imageData.data;
    for (let i = 0; i < ctx.canvas.width; i++) {
        let column = [];
        for (let j = 0; j < ctx.canvas.height; j++) {
            if(data[(j*ctx.canvas.width+i)*4] != 255 || data[(j*ctx.canvas.width+i)*4+1] != 255 || data[(j*ctx.canvas.width+i)*4+2] != 255){
                column.push(j);
                break;
            }
        }
        profile.push(column);
    }
    return profile;
}

