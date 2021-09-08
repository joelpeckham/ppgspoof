let testProfile = [[60,20],[65,10],[70,10],[80,10],[100,5],[120,300],[134,300],[150,1500],[145,1000],[100,10],[80,20],[65,30],[60,20]];
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


const canvas = document.getElementById('profileCanvas');
canvas.width  = 800; canvas.height = 400;
const ctx = canvas.getContext('2d');
ctx.fillStyle = 'white';
ctx.fillRect(0, 0, 800, 400);

window.addEventListener("mousemove",(e)=>{mouseMove(e);})
canvas.addEventListener("mousedown",(e)=>{mouseDown(e);})

let mouseDownInCanvas = false;
const chop = 10;
let profile = Array(canvas.width/chop).fill(null);
function mouseDown(e){
    // let pos = getMousePos(canvas, e);
    // let rpos = {x:Math.floor(pos.x / 10)*10,y:Math.floor(pos.y / 10)*10};
    // profile[rpos.x/10] = rpos.y;
    // ctx.fillStyle = 'white';
    // ctx.fillRect(0, 0, 800, 400);  
    // console.log(profile);
    // profile.forEach((y,x) => {
    //     if (y){
    //         ctx.beginPath();
    //         ctx.arc(x*10,y,3,0,2*Math.PI,false);
    //         ctx.fillStyle = "black";
    //         ctx.fill();
    //     }
    // });
}

function mouseMove(e){
    let pos = getMousePos(canvas, e);
    let changed = false;
    if(pos.inBounds){
        let rpos = {x:Math.floor(pos.x / chop)*chop,y:Math.floor(pos.y / chop)*chop};
        changed = (profile[rpos.x/chop] != rpos.y);
        if (changed){
            profile[rpos.x/chop] = rpos.y;
            ctx.fillStyle = 'white';
            ctx.fillRect(0, 0, 800, 400);
            profile.forEach((y,x) => {
                if (y){
                    ctx.beginPath();
                    ctx.arc(x*chop,y,3,0,2*Math.PI,false);
                    ctx.fillStyle = "black";
                    ctx.fill();
                }
            });
            ctx.beginPath();
            ctx.moveTo(0,0);
            profile.forEach((y,x) => {
                if (y){
                    ctx.lineTo(x*chop,y);
                }
            });
            ctx.stroke();
        }
    }   
}



// let profile = {};
// function draw(e) {
//     let pos = getMousePos(canvas, e);
//     profile[pos.x] = pos.y;
    // ctx.fillStyle = 'white';
//     ctx.moveTo(0,0);
//     ctx.fillRect(0, 0, 800, 400);
//     ctx.beginPath();
//     for (const c in profile) {
//         ctx.lineTo(c,profile[c]);
//       }
//     ctx.stroke();
// }

