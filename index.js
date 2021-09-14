function getMousePos(canvas, evt) {
    var rect = canvas.getBoundingClientRect();
    let cx = evt.clientX;
    let cy = evt.clientY;
    if (evt.type == "touchstart" || evt.type == "touchmove" || evt.type == "touchend"){
        if(evt.touches.length > 0){
            cx = evt.touches[0].clientX;
            cy = evt.touches[0].clientY;
        }
    }
    let x = (cx - rect.left) / (rect.right - rect.left) * canvas.width;
    let y = (cy - rect.top) / (rect.bottom - rect.top) * canvas.height;
    return { x: x, y: y, inBounds: (x > 0 && x < canvas.width && y > 0 && y < canvas.height)
    };
}

class Node{
    constructor(x,y,r=12){
        this._x = x;
        this._y = y;
        this.r = r;
        this.clampedx = clamp(this.x,this.r,canvas.width-this.r)
    }
    draw(canvas, ctx){
        ctx.beginPath();
        ctx.fillStyle = "black";
        ctx.arc(this.clampedx, this.y, this.r, 0, 2 * Math.PI);
        ctx.fill();
    }
    set x(x){
        this._x = x;
        this.clampedx = clamp(x,this.r,canvas.width-this.r)
    }
    get x(){
        return this._x;
    }
    set y(y){
        this._y = clamp(y,this.r,canvas.height-this.r);
    }
    get y(){
        return this._y;
    }
}

//Clamp function takes interger value, mix, max and returns clamped output to fit in range.
function clamp(value, min, max) {
    return Math.min(Math.max(value, min), max);
}
const map = (value, x1, y1, x2, y2) => (value - x1) * (y2 - x2) / (y1 - x1) + x2;

class Nodes {
    constructor(canvas, ctx, controlPoints = 10, min = 70, max = 190, divisions = 6){
        this.controlPoints = controlPoints;
        this.nodes = Array(controlPoints);
        for (let i = 0; i < controlPoints; i++) {
            let r = 12;
            this.nodes[i] = new Node((canvas.width/(controlPoints-1))*i,canvas.height/2,r);
        }
        this.canvas = canvas;
        this.min = min;
        this.max=max;
        this.divisions = divisions;
        this.ctx = ctx;
        this.dragging = -1;
        this.floater = document.getElementById("floatingLabel");
        this.floaterContent = document.getElementById("floatingLabelContent");
        this.profile = this.extractProfileFromCanvas(this.ctx,this.min,this.max);
        this.averageHR = 130;
        this.progressLine = false;
        this.progressLinePos = 300;
        this.drawProfile();
        this.createLineAndLabelGrid(min,max,divisions);
    }

    createLineAndLabelGrid(labelMin,labelMax,regions){
        let containerElement = document.getElementById("line-and-label-container");
        let canvasElement = document.getElementById("profileCanvas");
        let width  = parseInt(window.getComputedStyle(canvasElement).width);
        let height = parseInt(window.getComputedStyle(canvasElement).height);
        containerElement.style.gridTemplateRows = `repeat(${regions},1fr)`;
        for (let i = 0; i < regions; i++) {
            let line = document.createElement("div");
            line.className = "line";
            let text = document.createElement("p");
            text.className = "label";
            text.innerText = `${map(`${regions-i-1}`,0,regions,labelMin,labelMax)}-${map(`${regions-i}`,0,regions,labelMin,labelMax)}`;
            line.appendChild(text);
            containerElement.appendChild(line);
        }
    }
    extractProfileFromCanvas(ctx,min,max){
        this.drawProfile(false);
        let profile = [];
        let sum = 0;
        let imageData = ctx.getImageData(0,0,canvas.width,canvas.height);
        let data = imageData.data;
        for (let i = 0; i < canvas.width; i++) {
            for (let j = 0; j < canvas.height; j++) {
                if(data[(j*canvas.width+i)*4+3] != 0 || j == ctx.canvas.height-1){
                    let mappedHeight = Math.round(map(j,0,canvas.height,max+2,min-4));
                    sum += mappedHeight;
                    profile.push(mappedHeight);
                    break;
                }
            }
        }
        this.averageHR = Math.round(sum/profile.length);
        this.drawProfile(true);

        return profile;
    }
    drawProfile(dots = true){
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        if (dots){
            for (const node of this.nodes) {
                node.draw(this.canvas,this.ctx);
            }
        }
        ctx.lineWidth = 5;
        ctx.beginPath();
        ctx.moveTo(this.nodes[0].x,this.nodes[0].y);
        let points = [];
        for (const node of this.nodes) {
            if(dots){
                points.push(node.clampedx);
            }
            else{
                points.push(node.x);
            }
            points.push(node.y);
        }
        ctx.curve(points);
        ctx.stroke();
        ctx.lineWidth = 1;
        let avgHRElement = document.getElementById("avgHR");
        avgHRElement.innerText = `${this.averageHR}`;
        if (this.progressLine){
            //Fill rectangle from 0 to progressLinePos on the x axis and the height of the canvas on the y axis;
            ctx.fillStyle = "rgba(150,255,150,0.5)";
            ctx.fillRect(0,0,this.progressLinePos,canvas.height);
        }
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
        if (!this.progressLine){
            let nearest = this.nearestNode(pos);
            if(nearest != -1){
                this.dragging = nearest;
            }
            this.drawProfile();
        }
    }
    handleMouseUp(pos){
        this.dragging = -1;
        this.drawProfile();
        this.floater.style.visibility="hidden";
        this.profile = this.extractProfileFromCanvas(this.ctx,this.min,this.max);
    }
    handleMouseMove(pos){
        if(this.dragging != -1){
            this.nodes[this.dragging].y = pos.y;
            this.floaterContent.innerText = `${Math.round(map(this.nodes[this.dragging].y,0,canvas.height,190,70))} BPM`;
            this.floater.style.visibility="visible";
            let bottom = (this.nodes[this.dragging].y < canvas.height/2) ? 1 : -1;
            this.floater.style.top = this.nodes[this.dragging].y/2+(30*bottom)+"px";
            this.floater.style.left = (this.nodes[this.dragging].clampedx/2) + "px";
            this.drawProfile();
        }
    }
  }


const canvas = document.getElementById('profileCanvas');
let canvasStyle = window.getComputedStyle(canvas);
canvas.width  = parseInt(canvasStyle.width) * 2;
canvas.height = parseInt(canvasStyle.height) * 2;
const ctx = canvas.getContext('2d');


ctx.clearRect(0, 0, canvas.width, canvas.height);

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

canvas.addEventListener('touchstart', (e)=>{
    nodes.handleMouseDown(getMousePos(canvas, e));
});
window.addEventListener('touchend', (e)=>{
    nodes.handleMouseUp(getMousePos(canvas, e));
});
canvas.addEventListener('touchmove', (e)=>{
    nodes.handleMouseMove(getMousePos(canvas, e));
});



let mins = -1;
let secs = -1;
let totalTime = -1;
let startTime = Date.now();
let timeElapsed = 0;

function pulse(){
    let pulsar = document.getElementById("pulsar");
    let newpulsar = pulsar.cloneNode(true);
    newpulsar.className = "pulse";
    let parent = pulsar.parentNode;
    parent.appendChild(newpulsar);
    parent.removeChild(pulsar);
    nodes.progressLinePos = map(timeElapsed,0,totalTime,0,canvas.width);
    nodes.drawProfile();
}

function startPulsing(){
    console.log("What");
    mins = parseInt(document.getElementById("min").value) || 0;
    secs = parseInt(document.getElementById("sec").value) || 0;
    totalTime = (mins*60+secs)*1000;
    startTime = Date.now();
    timeElapsed = 0;
    let profile = nodes.profile;
    let bpm = profile[0];
    let bps = bpm/60;
    let pulseInterval = 1000/bps;
    nodes.progressLine= true;
    let doPulse = ()=> {
        timeElapsed = Date.now() - startTime;
        if (timeElapsed < totalTime){
            pulse();
            bpm = profile[Math.floor(map(timeElapsed,0,totalTime,0,profile.length-1))];
            bps = bpm/60;
            pulseInterval = 1000/bps;
            console.log(bpm);
            setTimeout(()=>{
                doPulse();
            },pulseInterval);
        }
    };
    doPulse();

}
function stopPulsing(){
    totalTime = -1;
    timeElapsed = 0;
    nodes.progressLine = false;
    nodes.progressLinePos = 0;
    nodes.drawProfile();
}