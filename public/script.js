const socket = io('');

let myname, myimg, myPublicKey, myPrivateKey, onlinePeers, peersImg = {}, peerConnections = {}, dataChannels = {}, bufferedIceCandidates = {}, conversations = {}, files = {}, inLatest = [], bufferedFileName;

const mediaQuerySmall = window.matchMedia('(max-width: 470px)');
const mediaQueryMedium = window.matchMedia('(max-width: 810px)');

const homeButton = document.getElementById('homeButton');
const profileButton = document.getElementById('profileButton');
const settingsButton = document.getElementById('settingsButton');
const closeButton = document.getElementById('closeButton');

homeButton.classList.add('active-button');

homeButton.addEventListener('click', () => handleButtonClick(homeButton));
profileButton.addEventListener('click', () => handleButtonClick(profileButton));
settingsButton.addEventListener('click', () => handleButtonClick(settingsButton));
closeButton.addEventListener('click', () => handleButtonClick(closeButton));

const configuration = { iceServers: [{ urls: 'stun:stun.l.google.com:19302' }] };

const fileInput = document.createElement('input');
fileInput.type = 'file';

fileInput.addEventListener('change', handleFileSelect);

document.querySelector('.bi-folder-plus').addEventListener('click', () => {
    fileInput.click();
});

function handleFileSelect(event) {
    const file = event.target.files[0];
    if (file) {
        const fileName = file.name;
        sendFile(file, fileName);
    }
}

socket.on('connect', () => {
    console.log("[***] Connected to server");
});

socket.on('connect_error', () => {
    console.log("[***] Failed to connect to server");
});

socket.on('change_username', (username) => {
    alert("Username [ " + username + " ] is already taken !!");
});

socket.on('actual_user_info', (data) => {
    myname = data.myname;
    myimg = data.myimg;
    console.log("myname : ", myname);
    console.log("myimg : ", myimg);
    document.getElementById('signup').style.display = 'none';
});

socket.on('online_peers', (peers) => {
    onlinePeers = peers;
    handlePeersUpdate(peers);
});

socket.on('offer', (data) => {
    handleOffer(data);
});

socket.on('answer', (data) => {
    handleAnswer(data);
});

socket.on('icecandidate', (data) => {
    handleIceCandidate(data);
});

socket.on('leave', (peername) => {
    deleteRTCPeerConnection(peername);
});

function handleButtonClick(button) {
    [homeButton, profileButton, settingsButton, closeButton].forEach(btn => {
        btn.classList.remove('active-button');
    });

    button.classList.add('active-button');

    if (button === homeButton) {
        console.log("homeButton Clicked !");
    } else if (button === profileButton) {
        const profileModal = document.getElementById('profileModal');
        const profileUsername = document.getElementById('profileUsername');
        const profileId = document.getElementById('profileId');
        const closeProfileModal = document.getElementById('closeProfileModal');
        const profilePicture = document.getElementById('profilePicture');
        profilePicture.src = myimg;

        profileUsername.textContent = `Username: ${myname}`;
        profileId.textContent = `ID: ${socket.id}`;
        profileModal.style.display = 'block';

        closeProfileModal.addEventListener('click', () => {
            profileModal.style.display = 'none';
            profileButton.classList.remove('active-button');
            homeButton.classList.add('active-button');
        });
    } else if (button === settingsButton) {
        document.body.classList.toggle('light-mode');
        button.classList.remove('active-button');
        homeButton.classList.add('active-button');
    } else if (button === closeButton) {
        const confirmExit = confirm("Are you sure you want to exit?");
        if (confirmExit) {
            window.location.href = '/index.html';
        } else {
            button.classList.remove('active-button');
            homeButton.classList.add('active-button');
        }
    }
}

function handlePeersUpdate(peers) {
    for (let peer in peerConnections) {
        if (!(peer in peers)) {
            deleteRTCPeerConnection(peer);
        }

    }
    const online_peers_container = document.querySelector('.online_peers_container');
    online_peers_container.innerHTML = "";

    if (Object.keys(peers).length > 1) {
        let id = 0;

        for (let peer_name in peers) {
            if (myname !== peer_name) {
                const peerID = 'peer__' + id;

                const div = document.createElement('div');
                div.className = 'circle';

                const img = document.createElement('img');
                img.classList.add('labelG');
                img.src = peers[peer_name][0];
                img.alt = 'Circle Image';
                img.id = peerID;

                img.addEventListener('click', () => {
                    send_offre(peer_name);
                });

                const p = document.createElement('p');
                p.textContent = peer_name;

                div.appendChild(img);
                div.appendChild(p);
                online_peers_container.appendChild(div);

                id++;
            }
        }
    }
};

function send_offre(receiver) {
    if ((receiver in dataChannels) && (dataChannels[receiver].readyState === 'open')) {
        show_chat_window(receiver);
    } else {
        createRTCPeerConnection(receiver);
        createDataChannel(receiver);
    }
};

function createRTCPeerConnection(peer) {
    if (peerConnections[peer]) {
        return peerConnections[peer];
    }

    const peerConnection = new RTCPeerConnection(configuration);
    peerConnections[peer] = peerConnection;

    peerConnection.onicecandidate = event => {
        if (event.candidate) {
            socket.emit("icecandidate", { candidate: event.candidate, sender: myname, receiver: peer });
        }
    };

    peerConnection.ondatachannel = event => {
        const dataChannel = event.channel;
        setupDataChannel(dataChannel, peer);
        dataChannels[peer] = dataChannel;
    };

    bufferedIceCandidates[peer] = [];

    peerConnection.oniceconnectionstatechange = () => {
        if (peerConnection.iceConnectionState === 'connected') {
            while (bufferedIceCandidates[peer].length > 0) {
                const candidate = bufferedIceCandidates[peer].shift();
                peerConnection.addIceCandidate(candidate).then(() => console.log('Successfully adding buffered ICE candidate, datachannels : ', dataChannels, peerConnections)).catch(error => console.error('Error adding buffered ICE candidate:', error));
            }
        }
    };

    return peerConnection;
};

function setupDataChannel(dataChannel, peer) {
    dataChannel.onopen = () => {
        peersImg[peer] = onlinePeers[peer][0];
        show_chat_window(peer);
        alert("Data channel opened with [ " + peer + " ] ");
    };

    dataChannel.onmessage = async event => {
        const peernameh3 = document.getElementById("peername");
        if (!conversations[peer]) {
            if (peernameh3) {
                const peername = peernameh3.textContent;
                if (peer === peername) {
                    addToLatest(peer, false);
                } else {
                    addToLatest(peer, true);
                }
            } else {
                addToLatest(peer, true);
            }
        }

        let message = event.data;

        if (typeof (message) === 'string' && message.substring(0, 20) === "_AREA117@filename : ") {
            bufferedFileName = message.substring(20);
            return;
        } else if (typeof (message) !== 'string') {
            arrayBufferToID(message).then(uniqueId => {
                if (!files[uniqueId]) {
                    files[uniqueId] = bufferedFileName;
                }
            });
        } else {
            message = await decryptMessage(myPrivateKey, message);
        }

        const currentTime = new Date().toLocaleTimeString();
        conversations[peer].push({ message: message, type: 'received', time: currentTime });

        if (peernameh3) {
            const peername = peernameh3.textContent;
            if (peer === peername) {
                UpdateChatMessages(peer);
            }
        }
    };

    dataChannel.onclose = () => {
        console.log('Data channel closed with: ', peer);
        alert("Data channel closed with [ " + peer + " ] ");
    };

    dataChannel.onerror = error => {
        console.error('Data channel error with: ', peer, error);
        alert("Data channel error with [ " + peer + " ] ");
    };
};

function createDataChannel(peer) {
    const peerConnection = peerConnections[peer];
    const dataChannel = peerConnection.createDataChannel('chat');
    dataChannels[peer] = dataChannel;
    setupDataChannel(dataChannel, peer);

    peerConnection.createOffer()
        .then(offer => peerConnection.setLocalDescription(offer))
        .then(() => socket.emit("offer", { offer: peerConnection.localDescription, sender: myname, receiver: peer }))
        .catch(error => console.error('Error creating data channel offer:', error));
};

function handleOffer(data) {
    const sender = data.sender;
    const offer = data.offer;
    const peerConnection = createRTCPeerConnection(sender);

    peerConnection.setRemoteDescription(offer)
        .then(() => peerConnection.createAnswer())
        .then(answer => peerConnection.setLocalDescription(answer))
        .then(() => socket.emit("answer", { answer: peerConnection.localDescription, sender: myname, receiver: sender }))
        .catch(error => console.error('Error handling offer:', error));
};

function handleAnswer(data) {
    const sender = data.sender;
    const answer = data.answer;
    const peerConnection = peerConnections[sender];

    if (peerConnection) {
        peerConnection.setRemoteDescription(answer)
            .then(() => console.log('Successfully setting RemoteDescription to: ', sender))
            .catch(error => console.error('Error setting RemoteDescription:', error));
    } else {
        console.error('Peer connection not found for:', sender);
    }
};

function handleIceCandidate(data) {
    const sender = data.sender;
    const candidate = new RTCIceCandidate(data.candidate);
    const peerConnection = peerConnections[sender];

    if (peerConnection) {
        if (peerConnection.remoteDescription && peerConnection.remoteDescription.type) {
            peerConnection.addIceCandidate(candidate)
                .then(() => console.log('Successfully adding received ICE candidate, datachannels : ', dataChannels, peerConnections))
                .catch(error => console.error('Error adding received ICE candidate:', error));
        } else {
            bufferedIceCandidates[sender].push(candidate);
        }
    } else {
        console.error('Peer connection not found for:', sender);
    }
};

function show_chat_window(peername) {
    const chatdiv = document.getElementById("chat");
    const recvc = document.getElementById("recvC");
    recvc.innerHTML = '';

    recvc.className = peername;

    const img2 = document.createElement('img');

    img2.src = peersImg[peername];
    img2.alt = 'User Image';

    const h3 = document.createElement('h3');

    h3.textContent = peername;
    h3.id = 'peername';

    recvc.appendChild(img2);
    recvc.appendChild(h3);

    UpdateChatMessages(peername);

    if (mediaQuerySmall.matches || mediaQueryMedium.matches) {
        document.querySelector('.latestContainer').style.display = 'none';
    }

    chatdiv.style.display = "flex";

    for (let i = 0; i < inLatest.length; i++) {
        if (peername === inLatest[i]) {
            document.getElementById(inLatest[i]).classList.replace('chatItem', 'chatItemselected');
        } else {
            document.getElementById(inLatest[i]).classList.replace('chatItemselected', 'chatItem');
        }
    }
}

const chatInput = document.getElementById('chat-input');

chatInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        e.preventDefault();
        sendMsg();
    }
});

function arrayBufferToString(buffer) {
    const decoder = new TextDecoder('utf-8');
    return decoder.decode(buffer);
}

function generateSHA256(buffer) {
    if (window.crypto && crypto.subtle && crypto.subtle.digest) {
        console.log("Using crypto.subtle.digest for SHA-256");
        return crypto.subtle.digest('SHA-256', buffer).then(hashBuffer => {
            const hashArray = Array.from(new Uint8Array(hashBuffer));
            const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
            return hashHex;
        }).catch(error => {
            console.error("Error in crypto.subtle.digest: ", error);
        });
    } else {
        console.log("Using jsSHA for SHA-256");
        const shaObj = new jsSHA("SHA-256", "ARRAYBUFFER");
        shaObj.update(buffer);
        const hashHex = shaObj.getHash("HEX");
        return Promise.resolve(hashHex);
    }
}

function arrayBufferToID(arrayBuffer) {
    return generateSHA256(arrayBuffer).then(uniqueId => {
        return uniqueId;
    }).catch(error => {
        console.error("Error in generateSHA256: ", error);
    });
}

function sendFile(file, fileName) {
    const peernameh3 = document.getElementById("peername");
    if (peernameh3) {
        const peername = peernameh3.textContent;
        const reader = new FileReader();
        reader.onload = (event) => {

            const arrayBuffer = event.target.result;

            if (!conversations[peername]) {
                addToLatest(peername, false);
            }
            const currentTime = new Date().toLocaleTimeString();
            conversations[peername].push({ message: arrayBuffer, type: 'sent', time: currentTime });

            arrayBufferToID(arrayBuffer).then(uniqueId => {
                if (!files[uniqueId]) {
                    files[uniqueId] = fileName;
                }
            });

            if ((peername in dataChannels) && (dataChannels[peername].readyState === 'open')) {
                dataChannels[peername].send("_AREA117@filename : " + fileName);
                dataChannels[peername].send(arrayBuffer);
                UpdateChatMessages(peername);
                chatInput.focus();
            } else {
                alert("Error: WebRTC Data channel is not open.. Please close chat and try again");
                document.querySelector('.typeC').style.display = "none";
            }
        };
        reader.readAsArrayBuffer(file);
    } else {
        alert("Can't send file to No One ! Choose a peer");
    }
}

async function sendMsg() {
    const peernameh3 = document.getElementById("peername");
    if (peernameh3) {
        const peername = peernameh3.textContent;
        console.log("Peer public key : ")
        const message = chatInput.value;

        if (message !== '') {
            if (!conversations[peername]) {
                addToLatest(peername, false);
            }
            const currentTime = new Date().toLocaleTimeString();
            conversations[peername].push({ message: message, type: 'sent', time: currentTime });

            if ((peername in dataChannels) && (dataChannels[peername].readyState === 'open')) {
                const encryptedMessage = await encryptMessage(onlinePeers[peername][2], message);
                dataChannels[peername].send(encryptedMessage);
                UpdateChatMessages(peername);
                chatInput.value = '';
                chatInput.focus();
            } else {
                alert("Error: WebRTC Data channel is not open.. Please close chat and try again");
                document.querySelector('.typeC').style.display = "none";
            }
        }
    } else {
        alert("Can't send message to No One ! Choose a peer");
    }
}

function UpdateChatMessages(user) {
    const chatBox = document.getElementById('convC');
    chatBox.innerHTML = '';
    if (conversations[user]) {
        conversations[user].forEach(({ message, type, time }) => {
            const div = document.createElement('div');
            div.className = 'msgcont';

            const messageElement = document.createElement('div');
            messageElement.className = 'smsgcont';
            messageElement.classList.add(type === 'sent' ? 'send' : 'received');

            if (typeof (message) !== 'string') {
                const arrayBuffer = message;

                arrayBufferToID(arrayBuffer).then(uniqueId => {
                    const blob = new Blob([arrayBuffer]);
                    const url = URL.createObjectURL(blob);

                    const link = document.createElement('a');
                    link.href = url;
                    link.download = files[uniqueId];
                    link.textContent = files[uniqueId];
                    link.target = '_blank';

                    const preview = document.createElement('img');
                    preview.src = url;
                    preview.alt = 'File preview';
                    preview.style.maxWidth = '100px';
                    preview.style.display = 'block';

                    messageElement.appendChild(preview);
                    messageElement.appendChild(link);
                });

            } else {
                const p = document.createElement('p');
                p.textContent = message;

                messageElement.appendChild(p);
            }
            div.appendChild(messageElement);

            const timeElement = document.createElement('span');
            timeElement.className = 'time';
            timeElement.classList.add(type === 'sent' ? 'timeS' : 'timeR');
            timeElement.textContent = time;
            div.appendChild(timeElement);

            chatBox.appendChild(div);
        });
    }

    if ((user in dataChannels) && (dataChannels[user].readyState === 'open')) {
        document.querySelector('.typeC').style.display = "flex";
    } else {
        document.querySelector('.typeC').style.display = "none";
    }
    chatBox.scrollTop = chatBox.scrollHeight;
}

function addToLatest(user, new_flag) {
    conversations[user] = [];
    const latestChat = document.getElementById('latestChat');
    const chatItem = document.createElement('div');
    chatItem.className = 'chatItem';
    chatItem.id = user;

    const img = document.createElement('img');
    img.src = peersImg[user];
    img.alt = 'User Image';

    const h3 = document.createElement('h2');
    h3.textContent = user;

    chatItem.appendChild(img);
    chatItem.appendChild(h3);

    chatItem.addEventListener('click', () => {
        show_chat_window(chatItem.id);
    });

    latestChat.appendChild(chatItem);

    inLatest.push(user);

    document.getElementById(chatItem.id).click();

}

function hideChat() {
    document.getElementById("chat").style.display = 'none';
    if (mediaQuerySmall.matches || mediaQueryMedium.matches) {
        document.querySelector('.latestContainer').style.display = 'block';
    }
    for (let i = 0; i < inLatest.length; i++) {
        document.getElementById(inLatest[i]).classList.replace('chatItemselected', 'chatItem');
    }
};

function closeChat() {
    const peernameh3 = document.getElementById("peername");
    if (peernameh3) {
        const peername = peernameh3.textContent;
        if (!(peername in peerConnections)) {
            alert("RTCPeerConnection with [ " + peername + " ] is already closed.")
        } else {
            const confirmExit = confirm("Are you sure you want to end RTCPeerConnection with " + peername + "?");
            if (confirmExit) {
                socket.emit("leave", peername);
                deleteRTCPeerConnection(peername);
            }
        }
    }

};

function deleteRTCPeerConnection(peer) {
    if (peer in dataChannels) {
        dataChannels[peer].close();
        delete dataChannels[peer];
    }

    peerConnections[peer].close();
    delete peerConnections[peer];

    alert("RTCPeerConnection with [ " + peer + " ] have been ended.");

    const peernameh3 = document.getElementById("peername");
    if (peernameh3) {
        const peername = peernameh3.textContent;
        if (peername == peer) {
            document.querySelector('.typeC').style.display = "none";
        }
    }
}

function applyStyles() {
    if (mediaQuerySmall.matches || mediaQueryMedium.matches) {
        document.querySelector('#chat').style.display = 'none';
        document.querySelector('.latestContainer').style.display = 'block';
    } else {
        document.querySelector('#chat').style.display = 'flex';
    }
}

mediaQuerySmall.addEventListener('change', applyStyles);
mediaQueryMedium.addEventListener('change', applyStyles);

applyStyles();

function editImage() {
    document.getElementById('fileInput').click();
}

function changeImage(event) {
    const file = event.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function (e) {
            document.querySelector('.circle-image').src = e.target.result;
        };
        reader.readAsDataURL(file);
    }
}

const form = document.getElementById('signup');

form.addEventListener('submit', async (event) => {
    event.preventDefault();
    const username = form.elements['Username'].value;
    const file = form.elements['Userimage'].files[0];
    let userimage;

    if (file) {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => {
            userimage = reader.result;
        };
        reader.onerror = (error) => {
            console.error('Error: ', error);
        };
    } else {
        userimage = "./img/user2.jpeg";
    }
    const { publicKey, privateKey } = await generateRSAKeys();

    myPrivateKey = privateKey;
    myPublicKey = publicKey;

    socket.emit("login_request", { username: username, userimage: userimage, publicKey: myPublicKey });
});

async function generateRSAKeys() {
    const keyPair = await window.crypto.subtle.generateKey(
        {
            name: "RSA-OAEP",
            modulusLength: 2048,
            publicExponent: new Uint8Array([1, 0, 1]),
            hash: "SHA-256",
        },
        true,
        ["encrypt", "decrypt"]
    );

    const publicKey = await window.crypto.subtle.exportKey("spki", keyPair.publicKey);
    const privateKey = await window.crypto.subtle.exportKey("pkcs8", keyPair.privateKey);

    return {
        publicKey: bufferToPem(publicKey, "PUBLIC KEY"),
        privateKey: bufferToPem(privateKey, "PRIVATE KEY"),
    };
}

function bufferToPem(buffer, label) {
    const base64String = arrayBufferToBase64(buffer);
    const pemString = `-----BEGIN ${label}-----\n${base64String.match(/.{1,64}/g).join('\n')}\n-----END ${label}-----`;
    return pemString;
}

function pemToBase64(pem) {
    return pem.replace(/-----BEGIN (PUBLIC|PRIVATE) KEY-----|-----END (PUBLIC|PRIVATE) KEY-----|\n/g, '').trim();
}

function arrayBufferToBase64(buffer) {
    const bytes = new Uint8Array(buffer);
    const binary = bytes.reduce((data, byte) => data + String.fromCharCode(byte), '');
    return window.btoa(binary);
}

function base64ToArrayBuffer(base64) {
    const binaryString = window.atob(base64);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
        bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes.buffer;
}

function str2ab(str) {
    const buf = new ArrayBuffer(str.length);
    const bufView = new Uint8Array(buf);
    for (let i = 0, strLen = str.length; i < strLen; i++) {
        bufView[i] = str.charCodeAt(i);
    }
    return buf;
}



async function encryptMessage(publicKeyPem, message) {
    const publicKey = await importPublicKey(publicKeyPem);
    const encryptedMessage = await window.crypto.subtle.encrypt(
        { name: "RSA-OAEP" },
        publicKey,
        new TextEncoder().encode(message)
    );

    return arrayBufferToBase64(encryptedMessage);
}

async function importPublicKey(pem) {
    const binaryDerString = window.atob(pemToBase64(pem));
    const binaryDer = str2ab(binaryDerString);

    return window.crypto.subtle.importKey(
        "spki",
        binaryDer,
        {
            name: "RSA-OAEP",
            hash: "SHA-256",
        },
        true,
        ["encrypt"]
    );
}

async function decryptMessage(privateKeyPem, encryptedMessage) {
    const privateKey = await importPrivateKey(privateKeyPem);
    const decryptedMessage = await window.crypto.subtle.decrypt(
        { name: "RSA-OAEP" },
        privateKey,
        base64ToArrayBuffer(encryptedMessage)
    );

    return new TextDecoder().decode(decryptedMessage);
}

async function importPrivateKey(pem) {
    const binaryDerString = window.atob(pemToBase64(pem));
    const binaryDer = str2ab(binaryDerString);

    return window.crypto.subtle.importKey(
        "pkcs8",
        binaryDer,
        {
            name: "RSA-OAEP",
            hash: "SHA-256",
        },
        true,
        ["decrypt"]
    );
}



