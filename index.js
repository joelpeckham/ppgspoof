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
    return {
        x: (evt.clientX - rect.left) / (rect.right - rect.left) * canvas.width,
        y: (evt.clientY - rect.top) / (rect.bottom - rect.top) * canvas.height
    };
}

const canvas = document.getElementById('profileCanvas');
const ctx = canvas.getContext('2d');

ctx.fillStyle = 'green';
ctx.fillRect(0, 0, 800, 400);