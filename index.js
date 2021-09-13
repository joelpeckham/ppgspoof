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

class Nodes {
    constructor(canvas, ctx, controlPoints = 10){
        this.controlPoints = controlPoints;
        this.nodes = Array(controlPoints);
        for (let i = 0; i < controlPoints; i++) {
            let r = 12;
            this.nodes[i] = new Node((canvas.width/(controlPoints-1))*i,canvas.height/2,r);
        }
        console.log(this.nodes);
        this.canvas = canvas;
        this.ctx = ctx;
        this.dragging = -1;
        this.drawProfile();
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
        this.drawProfile();
    }
    handleMouseUp(pos){
        this.dragging = -1;
        this.drawProfile();
    }
    handleMouseMove(pos){
        if(this.dragging != -1){
            this.nodes[this.dragging].y = pos.y;
        }
        this.drawProfile();
    }
  }


const canvas = document.getElementById('profileCanvas');
let canvasSyle = window.getComputedStyle(canvas);
console.log(canvasSyle.width);
canvas.width  = parseInt(canvasSyle.width) * 2;
canvas.height = parseInt(canvasSyle.height) * 2;
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
    console.log(e);
    nodes.handleMouseDown(getMousePos(canvas, e));
});
window.addEventListener('touchend', (e)=>{
    nodes.handleMouseUp(getMousePos(canvas, e));
});
canvas.addEventListener('touchmove', (e)=>{
    nodes.handleMouseMove(getMousePos(canvas, e));
});


function extractProfileFromCanvas(ctx){
    nodes.drawProfile(false);
    let profile = [];
    let imageData = ctx.getImageData(0,0,ctx.canvas.width,ctx.canvas.height);
    let data = imageData.data;
    for (let i = 0; i < ctx.canvas.width; i++) {
        let column = [];
        for (let j = 0; j < ctx.canvas.height; j++) {
            if(data[(j*ctx.canvas.width+i)*4+3] != 0 || j == ctx.canvas.height-1){
                column.push(j);
                break;
            }
        }
        profile.push(column);
    }
    return profile;
}

