let model

let videoWidth, videoHeight
let ctx, canvas
const k = 40
const machine = new kNear(k)
const log = document.querySelector("#array")
const buttonRock = document.querySelector("#rock")
const buttonPaper = document.querySelector("#paper")
const buttonScissors = document.querySelector("#scissors")
const buttonPredict = document.querySelector("#predict")
const VIDEO_WIDTH = 720
const VIDEO_HEIGHT = 405
// video fallback
navigator.getUserMedia = navigator.getUserMedia ||navigator.webkitGetUserMedia || navigator.mozGetUserMedia



// array posities van de vingerkootjes
let fingerLookupIndices = {
    thumb: [0, 1, 2, 3, 4],
    indexFinger: [0, 5, 6, 7, 8],
    middleFinger: [0, 9, 10, 11, 12],
    ringFinger: [0, 13, 14, 15, 16],
    pinky: [0, 17, 18, 19, 20]
}


//
// start de applicatie
//
async function main() {
    model = await handpose.load()
    const video = await setupCamera()
    video.play()
    startLandmarkDetection(video)
    savePrediction()
}

//
// start de webcam  
//
async function setupCamera() {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error(
            "Webcam not available"
        )
    }

    const video = document.getElementById("video")
    const stream = await navigator.mediaDevices.getUserMedia({
        audio: false,
        video: {
            facingMode: "user",
            width: VIDEO_WIDTH,
            height: VIDEO_HEIGHT
        }
    })
    video.srcObject = stream

    return new Promise(resolve => {
        video.onloadedmetadata = () => {
            resolve(video)
        }
    })
}

//
// predict de vinger posities in de video stream
//
async function startLandmarkDetection(video) {

    videoWidth = video.videoWidth
    videoHeight = video.videoHeight

    canvas = document.getElementById("output")

    canvas.width = videoWidth
    canvas.height = videoHeight

    ctx = canvas.getContext("2d")

    video.width = videoWidth
    video.height = videoHeight

    ctx.clearRect(0, 0, videoWidth, videoHeight)
    ctx.strokeStyle = "red"
    ctx.fillStyle = "red"

    ctx.translate(canvas.width, 0)
    ctx.scale(-1, 1) // video omdraaien omdat webcam in spiegelbeeld is

    predictLandmarks()
}

//
// predict de locatie van de vingers met het model
//
async function predictLandmarks() {
    ctx.drawImage(video,0,0,videoWidth,videoHeight,0,0,canvas.width,canvas.height)
    // prediction!
    const predictions = await model.estimateHands(video)
    if (predictions.length > 0) {
        const result = predictions[0].landmarks
        drawKeypoints(ctx, result, predictions[0].annotations)
        logData(predictions)
    }
    requestAnimationFrame(predictLandmarks)
}

//
// toon de eerste 20 waarden in een log - elk punt heeft een X, Y, Z waarde
//
function logData(predictions) {
    let str = []
    for (let i = 0; i < 20; i++) {
        str.push(predictions[0].landmarks[i][0])
        str.push(predictions[0].landmarks[i][1])
    }
    log.innerHTML = str
    return str
}

function savePrediction(){
buttonRock.addEventListener("click", async () =>{
    const predictions = await model.estimateHands(video)
    Learn(logData(predictions), "rock")
})
buttonPaper.addEventListener("click",  async () =>{
    const predictions = await model.estimateHands(video)
    Learn(logData(predictions), "paper")
})
buttonScissors.addEventListener("click",  async () =>{
    const predictions = await model.estimateHands(video)
    Learn(logData(predictions), "scissors")
})
buttonPredict.addEventListener("click",  async () =>{
    const predictions = await model.estimateHands(video)
    let prediction = machine.classify(logData(predictions))
    console.log(`I think it's a ${prediction}`)
    document.querySelector("#prediction").innerHTML = `I think it's ${prediction}`
    document.querySelector("#opponent").innerHTML = `Opponent plays ${opponent(prediction)}`

})
}

function Learn(array, name){
    machine.learn(array, name)
    console.log(`${name}learned`)
}

function opponent(prediction){
    if(prediction == "rock"){
        return "paper"
    }
    if(prediction == "paper"){
        return "scissors"
    }
    if(prediction == "scissors"){
        return "rock"
    }
    }
//
// teken hand en vingers
//
function drawKeypoints(ctx, keypoints) {
    const keypointsArray = keypoints;

    for (let i = 0; i < keypointsArray.length; i++) {
        const y = keypointsArray[i][0]
        const x = keypointsArray[i][1]
        drawPoint(ctx, x - 2, y - 2, 3)
    }

    const fingers = Object.keys(fingerLookupIndices)
    for (let i = 0; i < fingers.length; i++) {
        const finger = fingers[i]
        const points = fingerLookupIndices[finger].map(idx => keypoints[idx])
        drawPath(ctx, points, false)
    }
}
//
// teken een punt
//
function drawPoint(ctx, y, x, r) {
    ctx.beginPath()
    ctx.arc(x, y, r, 0, 2 * Math.PI)
    ctx.fill()
}
//
// teken een lijn
//
function drawPath(ctx, points, closePath) {
    const region = new Path2D()
    region.moveTo(points[0][0], points[0][1])
    for (let i = 1; i < points.length; i++) {
        const point = points[i]
        region.lineTo(point[0], point[1])
    }

    if (closePath) {
        region.closePath()
    }
    ctx.stroke(region)
}
//
// start
//
main()