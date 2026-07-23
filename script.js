console.log("hi")
let currentSong = new Audio();
let currentFolder = "Aditya"; // will get updated when a different album card is clicked
let songs = [];

async function displayAlbums() {
    let res = await fetch(`/assets/audio/index.json`);
    let folders = await res.json();
    let cardContainer = document.querySelector(".cardContainer");

    let cards = await Promise.all(folders.map(async (folder) => {
        let infoRes = await fetch(`/assets/audio/${folder}/info.json`);
        let info = await infoRes.json();
        return `<div data-folder="${folder}" class="card">
            <div class="play">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M5 20V4L19 12L5 20Z" stroke="#141B34" fill="#000" stroke-width="1.5" stroke-linejoin="round" />
                </svg>
            </div>
            <img src="/assets/audio/${folder}/cover.jpg" alt="">
            <h2>${info.title}</h2>
            <p>${info.description}</p>
        </div>`;
    }));

    cardContainer.innerHTML = cards.join("");

    // Wire up clicking a card to switch albums
    Array.from(document.getElementsByClassName("card")).forEach(e => {
        e.addEventListener("click", async (item) => {
            console.log("Fetching Songs")
            currentFolder = item.currentTarget.dataset.folder;
            songs = await getSongs(currentFolder);
            renderSongList(songs);
            if (songs.length > 0) {
                playMusic(songs[0]);
            }
        });
    });
}

async function getSongs(folder) {
    let a = await fetch(`/assets/audio/${folder}`)
    let response = await a.text()
    let div = document.createElement("div")
    div.innerHTML = response
    let as = div.getElementsByTagName("a")
    let result = []
    for (let index = 0; index < as.length; index++) {
        const element = as[index];
        // Use getAttribute("href") -- the raw attribute -- instead of element.href,
        // which the browser silently resolves into a full absolute URL (this was
        // causing folder paths to get baked into every "filename").
        let raw = element.getAttribute("href")
        if (raw && raw.toLowerCase().endsWith(".mp3")) {
            // Server returns Windows-style backslash paths (e.g. "\assets\audio\Aditya\Song.mp3"),
            // so split on both slash types, not just "/"
            let filename = decodeURIComponent(raw.split(/[\\/]/).pop())
            result.push(filename)
        }
    }
    console.log(`getSongs("${folder}") found:`, result)
    return result
}

function renderSongList(songList) {
    let songUL = document.querySelector(".songlist").getElementsByTagName("ul")[0]
    songUL.innerHTML = ""; // clear out the previous album's songs first

    for (const song of songList) {
        let name = song.replaceAll("%20", " ").replace(".mp3", "")
        songUL.innerHTML += `
        <li class="panel" data-song="${song}">
        <div class="pinfo">
        <img class="inv" width="24" src="assets/images/music.svg" alt="">
        <div>${name}</div>
        </div>
    <div class="playnow">
    <img class="invert" src="assets/images/play.svg" alt="">
    </div>
</li>`;
    }

    Array.from(songUL.getElementsByTagName("li")).forEach(e => {
        e.addEventListener("click", () => {
            playMusic(e.dataset.song);
        });
    });
}

function formatTime(seconds) {
    let mins = Math.floor(seconds / 60);
    let secs = Math.floor(seconds % 60);

    return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
}

// Example
console.log(formatTime(612)); // 10:12


document.querySelector(".seekbar").addEventListener("click", (e) => {
    let seekbar = e.currentTarget;

    let percent = (e.offsetX / seekbar.clientWidth) * 100;

    document.querySelector(".circle").style.left = percent + "%";
    document.querySelector(".progress").style.width = percent + "%";
    currentSong.currentTime = (currentSong.duration * percent) / 100;
});

let circle = document.querySelector(".circle");
let seekbar = document.querySelector(".seekbar");

let isDragging = false;

circle.addEventListener("mousedown", () => {
    isDragging = true;
});

document.addEventListener("mouseup", () => {
    if (isDragging) {
        isDragging = false;
    }
});

document.addEventListener("mousemove", (e) => {
    if (!isDragging) return;

    let rect = seekbar.getBoundingClientRect();

    let x = e.clientX - rect.left;

    x = Math.max(0, Math.min(x, rect.width));

    let percent = (x / rect.width) * 100;

    circle.style.left = percent + "%";

    currentSong.currentTime =
        (currentSong.duration * percent) / 100;
});


const playMusic = (track) => {
    // Defensive: if "track" somehow already contains a path (e.g. "/assets/audio/Aditya/Song.mp3")
    // rather than just a filename, strip everything down to the basename first so we
    // never end up building a doubled-up path like ".../Aditya//assets/audio/Aditya/Song.mp3"
    let filename = track.split(/[\\/]/).pop()
    let src = `/assets/audio/${currentFolder}/${filename}`
    console.log("playMusic ->", src)
    currentSong.src = src
    play.src = "/assets/images/pause.svg"
    document.querySelector(".progress").style.width = 0;
    document.querySelector(".circle").style.left = 0
    document.querySelector(".songinfo").innerHTML = track.replace(".mp3", " ").replaceAll("%20", " ")
    currentSong.addEventListener("timeupdate", () => {
        document.querySelector(".songtime").innerHTML = `${formatTime(currentSong.currentTime)} / ${formatTime(currentSong.duration)}`
        document.querySelector(".circle").style.left = (currentSong.currentTime / currentSong.duration) * 100 + "%"
        document.querySelector(".progress").style.width = (currentSong.currentTime / currentSong.duration) * 100 + "%";
    })
    currentSong.play()
}


async function main() {
    // Load the default/starting album
    songs = await getSongs(currentFolder)

    // Display all the albums on the page (this also wires up card click -> album switch)
    await displayAlbums()

    renderSongList(songs)

    if (songs.length > 0) {
        playMusic(songs[0])
    }

    function togglePlayPause() {
        if (currentSong.paused) {
            currentSong.play();
            play.src = "/assets/images/pause.svg";
        } else {
            currentSong.pause();
            play.src = "/assets/images/play.svg";
        }
    }

    play.addEventListener("click", togglePlayPause);

    document.addEventListener("keydown", (e) => {
        if (e.code === "Space") {
            e.preventDefault(); // prevents page scrolling
            togglePlayPause();
        }
    });

    // Add an event listener for hamburger
    document.querySelector(".hamburger").addEventListener("click", () => {
        document.querySelector(".left").style.left = "0"
    })

    // Add an event listener for close button
    document.querySelector(".close").addEventListener("click", () => {
        document.querySelector(".left").style.left = "-120%"
    })

    previous.addEventListener("click", () => {
        currentSong.pause()
        console.log("Previous clicked")
        let index = songs.indexOf(currentSong.src.split("/").slice(-1)[0])
        if ((index - 1) >= 0) {
            playMusic(songs[index - 1])
        }
    })

    // Add an event listener to next
    next.addEventListener("click", () => {
        currentSong.pause()
        console.log("Next clicked")

        let index = songs.indexOf(currentSong.src.split("/").slice(-1)[0])
        if ((index + 1) < songs.length) {
            playMusic(songs[index + 1])
        }
    })

    document.querySelector(".range").getElementsByTagName("input")[0].addEventListener("change", (e) => {
        console.log("Setting volume to", e.target.value, "/ 100")
        currentSong.volume = parseInt(e.target.value) / 100
        if (currentSong.volume > 0) {
            document.querySelector(".volume>img").src = document.querySelector(".volume>img").src.replace("mute.svg", "volume.svg")
        }
    })

    // Add event listener to mute the track
    document.querySelector(".volume>img").addEventListener("click", e => {
        if (e.target.src.includes("assets/images/volume.svg")) {
            e.target.src = e.target.src.replace("/assets/images/volume.svg", "/assets/images/mute.svg")
            currentSong.volume = 0;
            console.log("done")
            document.querySelector(".range").getElementsByTagName("input")[0].value = 0;
        }
        else {
            e.target.src = e.target.src.replace("assets/images/mute.svg", "/assets/images/volume.svg")
            console.log("done")
            currentSong.volume = .10;
            document.querySelector(".range").getElementsByTagName("input")[0].value = 10;
        }
    })
}

main()