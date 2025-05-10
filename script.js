// Örnek kullanıcılar ve mesajlar
const dummyUsers = ['Ahmet', 'Ayşe', 'Mehmet', 'Fatma', 'Ali'];
const dummyMessages = [
    { user: 'Sistem', text: 'Arkadaş Sohbet uygulamasına hoş geldiniz!', time: getCurrentTime() }
];

// Odalar
const rooms = {
    'genel': {
        name: 'Genel',
        users: [...dummyUsers],
        messages: [...dummyMessages]
    }
};

// DOM elemanları
const chatMessages = document.getElementById('chat-messages');
const messageInput = document.getElementById('message-input');
const sendButton = document.getElementById('send-button');
const usernameInput = document.getElementById('username');
const setUsernameButton = document.getElementById('set-username');
const usersList = document.getElementById('users-list');

// Oda yönetimi
const roomNameInput = document.getElementById('room-name');
const createRoomBtn = document.getElementById('create-room-btn');
const roomIdInput = document.getElementById('room-id');
const joinRoomBtn = document.getElementById('join-room-btn');
const leaveRoomBtn = document.getElementById('leave-room-btn');
const roomDisplay = document.getElementById('room-display');

// Sesli konuşma
const startVoiceBtn = document.getElementById('start-voice-btn');
const stopVoiceBtn = document.getElementById('stop-voice-btn');
const activeSpeakers = document.getElementById('active-speakers');

// Kullanıcı ve oda bilgileri
let currentUsername = localStorage.getItem('username') || 'Misafir-' + Math.floor(Math.random() * 1000);
let currentRoom = 'genel';
let currentRoomName = 'Genel';
let peer;
let myPeerId;
let connections = {};
let mediaStream;

// Firebase referansları
const roomsRef = database.ref('rooms');
const usersRef = database.ref('users');

// Sayfa yüklendiğinde
window.onload = function() {
    // Kaydedilmiş kullanıcı adını göster
    usernameInput.value = currentUsername;
    
    // Firebase bağlantısını başlat
    initializeFirebase();
    
    // WebRTC bağlantısını başlat
    initializePeerConnection();
};

// Firebase başlatma
function initializeFirebase() {
    // Genel oda yoksa oluştur
    roomsRef.child('genel').once('value', snapshot => {
        if (!snapshot.exists()) {
            roomsRef.child('genel').set({
                name: 'Genel',
                createdAt: firebase.database.ServerValue.TIMESTAMP
            });
        }
    });
    
    // Kullanıcıyı çevrimiçi olarak işaretle
    registerUser();
    
    // Genel odaya katıl
    joinRoomInFirebase('genel');
}

// Kullanıcıyı Firebase'de kaydet
function registerUser() {
    const userRef = usersRef.child(getValidKey(currentUsername));
    userRef.set({
        username: currentUsername,
        online: true,
        lastSeen: firebase.database.ServerValue.TIMESTAMP
    });
    
    // Kullanıcı çıkış yaptığında offline olarak işaretle
    userRef.onDisconnect().update({
        online: false,
        lastSeen: firebase.database.ServerValue.TIMESTAMP
    });
}

// PeerJS bağlantısını başlat
function initializePeerConnection() {
    // Doğrudan Peer nesnesi oluştur, konfigürasyon olmadan
    peer = new Peer(undefined, peerConfig);
    
    peer.on('open', id => {
        myPeerId = id;
        console.log('PeerJS bağlantısı başlatıldı, ID:', id);
        
        // Peer ID'sini kullanıcı bilgilerine ekle
        usersRef.child(getValidKey(currentUsername)).update({
            peerId: id
        });
    });
    
    // Gelen çağrıları dinle
    peer.on('call', call => {
        if (confirm(`${call.metadata.caller} sesli görüşme başlatmak istiyor. Kabul ediyor musunuz?`)) {
            navigator.mediaDevices.getUserMedia({ audio: true })
                .then(stream => {
                    mediaStream = stream;
                    call.answer(stream); // Çağrıyı yanıtla
                    handleCall(call);
                })
                .catch(err => {
                    console.error('Mikrofon erişim hatası:', err);
                    alert('Mikrofon erişimi sağlanamadı.');
                });
        } else {
            call.close();
        }
    });
    
    // Hataları dinle
    peer.on('error', err => {
        console.error('PeerJS hatası:', err);
        alert('Bağlantı hatası: ' + err.message);
    });
}

// Çağrıyı işle
function handleCall(call) {
    call.on('stream', remoteStream => {
        // Kullanıcıyı aktif konuşmacı olarak ekle
        const remotePeerId = call.peer;
        addActiveSpeaker(call.metadata.caller || 'Bilinmeyen Kullanıcı', remotePeerId);
        
        // Bağlantıyı kaydet
        connections[remotePeerId] = call;
    });
    
    call.on('close', () => {
        removeActiveSpeaker(call.metadata.caller || 'Bilinmeyen Kullanıcı');
        delete connections[call.peer];
    });
}

// Kullanıcı adını ayarla
setUsernameButton.addEventListener('click', function() {
    if (usernameInput.value.trim() !== '' && usernameInput.value.trim() !== currentUsername) {
        // Eski kullanıcıyı offline yap
        usersRef.child(getValidKey(currentUsername)).update({
            online: false,
            lastSeen: firebase.database.ServerValue.TIMESTAMP
        });
        
        currentUsername = usernameInput.value.trim();
        localStorage.setItem('username', currentUsername);
        
        // Yeni kullanıcıyı kaydet
        registerUser();
        
        // Odaya yeniden katıl
        joinRoomInFirebase(currentRoom);
        
        alert('Kullanıcı adınız kaydedildi: ' + currentUsername);
    }
});

// Mesaj gönderme işlemi
sendButton.addEventListener('click', sendMessage);
messageInput.addEventListener('keypress', function(e) {
    if (e.key === 'Enter') {
        sendMessage();
    }
});

function sendMessage() {
    const messageText = messageInput.value.trim();
    if (messageText !== '') {
        // Mesajı Firebase'e kaydet
        const messagesRef = roomsRef.child(currentRoom).child('messages');
        messagesRef.push({
            user: currentUsername,
            text: messageText,
            time: getCurrentTime(),
            timestamp: firebase.database.ServerValue.TIMESTAMP
        });
        
        // Input'u temizle
        messageInput.value = '';
    }
}

// Oda oluştur
createRoomBtn.addEventListener('click', function() {
    const roomName = roomNameInput.value.trim();
    if (roomName !== '') {
        // Oda ID'si oluştur
        const roomId = generateRoomId();
        
        // Odayı Firebase'e kaydet
        roomsRef.child(roomId).set({
            name: roomName,
            createdBy: currentUsername,
            createdAt: firebase.database.ServerValue.TIMESTAMP
        }).then(() => {
            // Sistem mesajını ekle
            const messagesRef = roomsRef.child(roomId).child('messages');
            return messagesRef.push({
                user: 'Sistem',
                text: `"${roomName}" odası oluşturuldu. Oda ID: ${roomId}`,
                time: getCurrentTime(),
                timestamp: firebase.database.ServerValue.TIMESTAMP
            });
        }).then(() => {
            // Odaya katıl
            joinRoomInFirebase(roomId);
            
            // Input'u temizle
            roomNameInput.value = '';
            
            alert(`"${roomName}" odası oluşturuldu. Oda ID: ${roomId}`);
        }).catch(error => {
            console.error('Oda oluşturma hatası:', error);
            alert('Oda oluşturulurken bir hata oluştu.');
        });
    }
});

// Odaya katıl
joinRoomBtn.addEventListener('click', function() {
    const roomId = roomIdInput.value.trim();
    if (roomId !== '') {
        // Odanın varlığını kontrol et
        roomsRef.child(roomId).once('value', snapshot => {
            if (snapshot.exists()) {
                // Odaya katıl
                joinRoomInFirebase(roomId);
                
                // Input'u temizle
                roomIdInput.value = '';
            } else {
                alert('Belirtilen ID ile bir oda bulunamadı!');
            }
        });
    }
});

// Odadan ayrıl
leaveRoomBtn.addEventListener('click', function() {
    if (currentRoom !== 'genel') {
        // Odadan ayrıldığını bildir
        roomsRef.child(currentRoom).child('messages').push({
            user: 'Sistem',
            text: `${currentUsername} odadan ayrıldı!`,
            time: getCurrentTime(),
            timestamp: firebase.database.ServerValue.TIMESTAMP
        });
        
        // Kullanıcıyı odadan çıkar
        roomsRef.child(currentRoom).child('users').child(getValidKey(currentUsername)).remove();
        
        // Genel odaya geri dön
        joinRoomInFirebase('genel');
    }
});

// Firebase'de odaya katıl
function joinRoomInFirebase(roomId) {
    // Eğer başka bir odadaysak, önce oradan ayrılalım
    if (currentRoom) {
        roomsRef.child(currentRoom).child('users').child(getValidKey(currentUsername)).remove();
    }
    
    // Odaya katıl
    roomsRef.child(roomId).once('value', snapshot => {
        if (snapshot.exists()) {
            currentRoom = roomId;
            currentRoomName = snapshot.val().name || 'Bilinmeyen Oda';
            
            // UI'ı güncelle
            roomDisplay.textContent = currentRoomName;
            if (roomId === 'genel') {
                leaveRoomBtn.classList.add('hidden');
            } else {
                leaveRoomBtn.classList.remove('hidden');
            }
            
            // Odaya katıldığını bildir (eğer genel oda değilse)
            if (roomId !== 'genel') {
                roomsRef.child(roomId).child('messages').push({
                    user: 'Sistem',
                    text: `${currentUsername} odaya katıldı!`,
                    time: getCurrentTime(),
                    timestamp: firebase.database.ServerValue.TIMESTAMP
                });
            }
            
            // Kullanıcıyı odaya ekle
            roomsRef.child(roomId).child('users').child(getValidKey(currentUsername)).set(true);
            
            // Mesajları dinle
            listenForMessages(roomId);
            
            // Kullanıcıları dinle
            listenForUsers(roomId);
        }
    });
}

// Odadaki mesajları dinle
function listenForMessages(roomId) {
    // Önce eski dinleyicileri temizle
    roomsRef.child(currentRoom).child('messages').off();
    
    // Mesajları temizle
    chatMessages.innerHTML = '';
    
    // Son 50 mesajı al ve dinlemeye başla
    const messagesRef = roomsRef.child(roomId).child('messages');
    messagesRef.limitToLast(50).on('child_added', snapshot => {
        const message = snapshot.val();
        displayMessage(message);
    });
}

// Odadaki kullanıcıları dinle
function listenForUsers(roomId) {
    // Önce eski dinleyicileri temizle
    roomsRef.child(currentRoom).child('users').off();
    
    // Kullanıcı listesini temizle
    usersList.innerHTML = '';
    
    // Kullanıcıları dinlemeye başla
    const roomUsersRef = roomsRef.child(roomId).child('users');
    roomUsersRef.on('child_added', snapshot => {
        const userKey = snapshot.key;
        addUserToList(userKey);
    });
    
    roomUsersRef.on('child_removed', snapshot => {
        const userKey = snapshot.key;
        removeUserFromList(userKey);
    });
}

// Kullanıcıyı listeye ekle
function addUserToList(userKey) {
    const userItem = document.createElement('li');
    userItem.id = `user-${userKey}`;
    
    // Kullanıcı bilgilerini al
    usersRef.child(userKey).once('value', snapshot => {
        if (snapshot.exists()) {
            const userData = snapshot.val();
            userItem.textContent = userData.username;
            userItem.setAttribute('data-peer-id', userData.peerId || '');
            
            // Eğer bu kullanıcı kendimiz değilse ve peer ID'si varsa, sesli arama seçeneği ekle
            if (userData.username !== currentUsername && userData.peerId) {
                const callButton = document.createElement('button');
                callButton.classList.add('call-button');
                callButton.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24"><path fill="currentColor" d="M20 15.5c-1.25 0-2.45-.2-3.57-.57a1 1 0 0 0-1.02.24l-2.2 2.2a15.074 15.074 0 0 1-6.59-6.59l2.2-2.2c.28-.28.36-.67.25-1.02A11.36 11.36 0 0 1 8.5 4c0-.55-.45-1-1-1H4c-.55 0-1 .45-1 1 0 9.39 7.61 17 17 17 .55 0 1-.45 1-1v-3.5c0-.55-.45-1-1-1zM12 3v10l3-3h6V3h-9z"/></svg>`;
                callButton.addEventListener('click', () => {
                    callUser(userData.peerId, userData.username);
                });
                userItem.appendChild(callButton);
            }
            
            usersList.appendChild(userItem);
        }
    });
}

// Kullanıcıyı listeden çıkar
function removeUserFromList(userKey) {
    const userItem = document.getElementById(`user-${userKey}`);
    if (userItem) {
        usersList.removeChild(userItem);
    }
}

// Mesajı ekrana ekle
function displayMessage(message) {
    const messageElement = document.createElement('div');
    messageElement.classList.add('message');
    
    if (message.user === currentUsername) {
        messageElement.classList.add('message-sent');
    } else {
        messageElement.classList.add('message-received');
    }
    
    const userSpan = document.createElement('div');
    userSpan.classList.add('user');
    userSpan.textContent = message.user;
    
    const textSpan = document.createElement('div');
    textSpan.classList.add('text');
    textSpan.textContent = message.text;
    
    const timeSpan = document.createElement('div');
    timeSpan.classList.add('time');
    timeSpan.textContent = message.time;
    
    messageElement.appendChild(userSpan);
    messageElement.appendChild(textSpan);
    messageElement.appendChild(timeSpan);
    
    chatMessages.appendChild(messageElement);
    
    // Kaydırma çubuğunu en aşağı kaydır
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

// Mikrofonu aç ve sesli görüşmeye başla
startVoiceBtn.addEventListener('click', async function() {
    try {
        // Tarayıcı desteğini kontrol et
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
            throw new Error('Tarayıcınız sesli konuşmayı desteklemiyor!');
        }
        
        // Mikrofon izni iste
        mediaStream = await navigator.mediaDevices.getUserMedia({ audio: true });
        
        // Odadaki herkesi ara
        callAllUsersInRoom();
        
        // UI güncelle
        startVoiceBtn.classList.add('hidden');
        stopVoiceBtn.classList.remove('hidden');
        
        // Aktif konuşmacı olarak kendini ekle
        addActiveSpeaker(currentUsername, myPeerId);
        
    } catch (error) {
        alert('Mikrofon erişimi sağlanamadı: ' + error.message);
        console.error('Mikrofon hatası:', error);
    }
});

// Odadaki tüm kullanıcıları ara
function callAllUsersInRoom() {
    // Odadaki kullanıcıları al
    roomsRef.child(currentRoom).child('users').once('value', snapshot => {
        if (snapshot.exists()) {
            snapshot.forEach(userSnapshot => {
                const userKey = userSnapshot.key;
                if (userKey !== getValidKey(currentUsername)) {
                    // Kullanıcının peer ID'sini al
                    usersRef.child(userKey).once('value', userDataSnapshot => {
                        if (userDataSnapshot.exists()) {
                            const userData = userDataSnapshot.val();
                            if (userData.peerId && userData.online) {
                                callUser(userData.peerId, userData.username);
                            }
                        }
                    });
                }
            });
        }
    });
}

// Belirli bir kullanıcıyı ara
function callUser(peerId, username) {
    if (!mediaStream) {
        navigator.mediaDevices.getUserMedia({ audio: true })
            .then(stream => {
                mediaStream = stream;
                makeCall(peerId, username);
            })
            .catch(err => {
                console.error('Mikrofon erişim hatası:', err);
                alert('Mikrofon erişimi sağlanamadı.');
            });
    } else {
        makeCall(peerId, username);
    }
}

// Çağrı yap
function makeCall(peerId, username) {
    console.log(`${username} aranıyor...`);
    
    const call = peer.call(peerId, mediaStream, {
        metadata: {
            caller: currentUsername,
            room: currentRoom
        }
    });
    
    connections[peerId] = call;
    
    handleCall(call);
}

// Mikrofonu kapat
stopVoiceBtn.addEventListener('click', function() {
    if (mediaStream) {
        // Tüm ses parçalarını durdur
        mediaStream.getTracks().forEach(track => track.stop());
        mediaStream = null;
        
        // Tüm çağrıları kapat
        Object.values(connections).forEach(call => {
            if (call) {
                call.close();
            }
        });
        connections = {};
        
        // UI güncelle
        stopVoiceBtn.classList.add('hidden');
        startVoiceBtn.classList.remove('hidden');
        
        // Aktif konuşmacılar listesinden çıkar
        removeActiveSpeaker(currentUsername);
    }
});

// Aktif konuşmacı ekle
function addActiveSpeaker(username, peerId) {
    // Eğer zaten eklenmişse, tekrar ekleme
    if (document.querySelector(`.speaker[data-peer-id="${peerId}"]`)) {
        return;
    }
    
    const speakerElement = document.createElement('div');
    speakerElement.classList.add('speaker');
    speakerElement.setAttribute('data-username', username);
    speakerElement.setAttribute('data-peer-id', peerId);
    
    const indicator = document.createElement('div');
    indicator.classList.add('speaker-indicator');
    
    const name = document.createElement('div');
    name.classList.add('speaker-name');
    name.textContent = username;
    
    speakerElement.appendChild(indicator);
    speakerElement.appendChild(name);
    
    activeSpeakers.appendChild(speakerElement);
}

// Aktif konuşmacı çıkar
function removeActiveSpeaker(username) {
    const speaker = activeSpeakers.querySelector(`[data-username="${username}"]`);
    if (speaker) {
        activeSpeakers.removeChild(speaker);
    }
}

// Yardımcı fonksiyonlar
function getCurrentTime() {
    const now = new Date();
    let hours = now.getHours();
    let minutes = now.getMinutes();
    
    // Saat ve dakika için sıfır ekle (01:05 gibi)
    hours = hours < 10 ? '0' + hours : hours;
    minutes = minutes < 10 ? '0' + minutes : minutes;
    
    return hours + ':' + minutes;
}

function generateRoomId() {
    const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < 6; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
}

// Firebase için geçerli bir anahtar oluştur
function getValidKey(str) {
    // Firebase anahtarları '/', '.', '#', '$', '[', veya ']' içeremez
    return str.replace(/[\/\.\#\$\[\]]/g, '_');
} 