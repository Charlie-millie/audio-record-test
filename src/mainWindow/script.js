window.onload= ()=>{
    document.body.classList.remove('preload');
}
const MicRecorder = require('mic-recorder-to-mp3');
document.addEventListener('DOMContentLoaded', ()=>{

    const { ipcRenderer } = require('electron');

    // Declarations


    const recorder = new MicRecorder({
        bitRate: 128
    });

    const display = document.querySelector("#display");
    const record = document.querySelector("#record");
    const micInput = document.querySelector("#mic");

    let isRecording = false;
    let selectedDeviceId = null;
    let mediaRecorder = null;
    let startTime = null;
    let chunks = [];

    // Get available devices

    navigator.mediaDevices.enumerateDevices().then(devices=>{
        devices.forEach(device=>{
            if(device.kind === "audioinput"){
                if(selectedDeviceId) {
                    selectedDeviceId = device.deviceId
                }
                const option = document.createElement("option");
                option.value = device.deviceId;
                option.text = device.label;
                
                micInput.appendChild(option);
            }
        })
    })

    micInput.addEventListener("change", (event)=>{
        selectedDeviceId = event.target.value;
    })


    function updateButtonTo(recording) {
        if (recording){
            document.querySelector("#record").classList.add("recording");
            document.querySelector("#mic-icon").classList.add("hide");
        } else{
            document.querySelector("#record").classList.remove("recording");
            document.querySelector("#mic-icon").classList.remove("hide");
        }
    };

    record.addEventListener("click", ()=>{
        updateButtonTo(!isRecording);
        // handleRecord(isRecording);

        micRecorderStart(isRecording);
        isRecording = !isRecording;
    });

    function handleRecord(recording) {
        if(recording) {
            //stop
            mediaRecorder.stop();
        } else{
            //start
            navigator.mediaDevices.getUserMedia({audio:{deviceId: selectedDeviceId}, video: false}).then(stream=>{
                mediaRecorder = new MediaRecorder(stream);
                mediaRecorder.start();
                startTime = Date.now();
                updateDisplay();
                mediaRecorder.ondataavailable = (event)=>{
                    chunks.push(event.data);
                };
                mediaRecorder.onstop = (event)=>{
                    saveData();
                };
            })
        }
    }
    function micRecorderStart(recording) {
        if(recording) {
            //stop
            recorder
                .stop()
                .getMp3().then(([buffer, blob]) => {
                // do what ever you want with buffer and blob
                // Example: Create a mp3 file and play
                const file = new File(buffer, 'me-at-thevoice.mp3', {
                    type: blob.type,
                    lastModified: Date.now()
                });

                const player = new Audio(URL.createObjectURL(file));
                player.play();

            }).catch((e) => {
                alert('We could not retrieve your message');
                console.log(e);
            });
        } else{
            //start
            recorder.start().then(() => {
                // something else
            }).catch((e) => {
                console.error(e);
            });
        }
    }

    function saveData(){
        // const blob = new Blob(chunks, {"type": "audio/mp3"});
        const blob = new Blob(chunks, {"type": "audio/webm; codecs=opus"});
        console.log(blob)
        
        blob.arrayBuffer().then(blobBuffer=>{
            const buffer = Buffer.from(blobBuffer, "binary");
            ipcRenderer.send("save_buffer", buffer);
        })
        chunks = [];
    };

    function updateDisplay(){
        display.innerHTML = durationToTimestamp(Date.now() - startTime);
        if(isRecording) {
            window.requestAnimationFrame(updateDisplay);
        }           
    };

    function durationToTimestamp(duration){
        let mili = parseInt((duration % 1000) / 100);
        let seconds = Math.floor((duration/1000) % 60);
        let minutes = Math.floor((duration/1000/60) % 60);
        let hours = Math.floor((duration/1000/60/60));

        seconds = seconds < 10 ? "0" + seconds: seconds;
        minutes = minutes < 10 ? "0" + minutes: minutes;
        hours = hours < 10 ? "0" + hours: hours;

        return `${hours}:${minutes}:${seconds}:${mili}`
    }




});