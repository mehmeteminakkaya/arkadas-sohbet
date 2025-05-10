// Discord benzeri arayüz için ek fonksiyonlar
document.addEventListener('DOMContentLoaded', function() {
    // DOM Elemanları
    const serverIcons = document.querySelectorAll('.server-icon');
    const channels = document.querySelectorAll('.channel');
    const settingsButton = document.getElementById('settings-button');
    const userSettingsModal = document.getElementById('user-settings-modal');
    const closeModals = document.querySelectorAll('.close-modal');
    const addServerButton = document.querySelector('.add-server');
    const serverModal = document.getElementById('server-modal');
    const createServerBtn = document.getElementById('create-server-btn');
    const serverNameInput = document.getElementById('server-name-input');
    const serverIconInput = document.getElementById('server-icon-input');
    const micToggle = document.getElementById('mic-toggle');
    const headphoneToggle = document.getElementById('headphone-toggle');
    const settingsUsernameInput = document.getElementById('settings-username-input');
    const settingsEmailInput = document.getElementById('settings-email-input');
    const saveSettingsBtn = document.getElementById('save-settings-btn');
    const channelList = document.querySelectorAll('.channel');
    
    // Firebase referansları
    const serversRef = firebase.database().ref('servers');
    const channelsRef = firebase.database().ref('channels');
    
    // Kullanıcı bilgileri
    const userId = localStorage.getItem('discord_user_id') || generateUserId();
    const userTag = localStorage.getItem('discord_user_tag') || generateUserTag();
    let username = localStorage.getItem('username') || 'Kullanıcı';
    
    // Kullanıcı bilgilerini ayarla
    document.getElementById('current-username').textContent = username;
    document.getElementById('user-tag').textContent = userTag;
    document.getElementById('settings-username-input').value = username;
    document.getElementById('user-avatar-img').src = `https://ui-avatars.com/api/?name=${username}&background=random`;
    document.getElementById('settings-avatar-img').src = `https://ui-avatars.com/api/?name=${username}&background=random&size=100`;
    
    // Sunucu ikonlarına tıklama işlemleri
    serverIcons.forEach(icon => {
        icon.addEventListener('click', function() {
            // Aktif sunucuyu değiştir
            serverIcons.forEach(i => i.classList.remove('active'));
            this.classList.add('active');
            
            // Sunucu adını güncelle
            const serverId = this.getAttribute('data-server-id');
            if (serverId === 'home') {
                document.getElementById('current-server-name').textContent = 'Arkadaş Sohbet';
            } else if (serverId === 'genel') {
                document.getElementById('current-server-name').textContent = 'Genel Sunucu';
            }
        });
    });
    
    // Kanal tıklama işlemleri
    channels.forEach(channel => {
        channel.addEventListener('click', function() {
            // Aktif kanalı değiştir
            channels.forEach(c => c.classList.remove('active'));
            this.classList.add('active');
            
            // Kanal adını güncelle
            const channelId = this.getAttribute('data-channel-id');
            document.getElementById('current-channel-name').textContent = channelId;
            
            // Mesaj input placeholder'ını güncelle
            document.getElementById('message-input').placeholder = `${channelId} kanalına mesaj gönder...`;
            
            // Kanal tipi sesli ise mikrofon kontrollerini göster
            if (this.classList.contains('voice-channel')) {
                startVoiceBtn.classList.remove('hidden');
            }
        });
        
        // Sağ tıklama menüsü
        channel.addEventListener('contextmenu', function(e) {
            e.preventDefault();
            const contextMenu = document.getElementById('channel-context-menu');
            contextMenu.style.top = e.pageY + 'px';
            contextMenu.style.left = e.pageX + 'px';
            contextMenu.classList.add('active');
            
            // Dışarı tıklandığında menüyü kapat
            document.addEventListener('click', function closeMenu() {
                contextMenu.classList.remove('active');
                document.removeEventListener('click', closeMenu);
            });
        });
    });
    
    // Ayarlar butonuna tıklama
    settingsButton.addEventListener('click', function() {
        userSettingsModal.classList.add('active');
    });
    
    // Mikrofon toggle
    micToggle.addEventListener('click', function() {
        this.classList.toggle('fa-microphone');
        this.classList.toggle('fa-microphone-slash');
        
        if (this.classList.contains('fa-microphone-slash')) {
            // Mikrofonu kapat
            document.getElementById('stop-voice-btn').click();
        } else {
            // Mikrofonu aç
            document.getElementById('start-voice-btn').click();
        }
    });
    
    // Kulaklık toggle
    headphoneToggle.addEventListener('click', function() {
        this.classList.toggle('fa-headphones');
        this.classList.toggle('fa-headphones-alt');
    });
    
    // Sunucu ekle butonuna tıklama
    addServerButton.addEventListener('click', function() {
        serverModal.classList.add('active');
    });
    
    // Sunucu oluştur butonuna tıklama
    createServerBtn.addEventListener('click', function() {
        const serverName = serverNameInput.value.trim();
        if (serverName) {
            // Sunucu ID'si oluştur
            const serverId = generateServerId();
            
            // Sunucuyu Firebase'e kaydet
            serversRef.child(serverId).set({
                name: serverName,
                createdBy: userId,
                createdAt: firebase.database.ServerValue.TIMESTAMP,
                icon: null // İkon yüklenirse URL burada saklanacak
            }).then(() => {
                // Varsayılan kanalları oluştur
                const generalChannelId = generateChannelId();
                channelsRef.child(serverId).child(generalChannelId).set({
                    name: 'genel',
                    type: 'text',
                    createdAt: firebase.database.ServerValue.TIMESTAMP
                });
                
                const voiceChannelId = generateChannelId();
                channelsRef.child(serverId).child(voiceChannelId).set({
                    name: 'Sesli Sohbet',
                    type: 'voice',
                    createdAt: firebase.database.ServerValue.TIMESTAMP
                });
                
                // İkon dosyası var mı kontrol et
                const iconFile = serverIconInput.files[0];
                if (iconFile) {
                    // İkonu storage'a yükle
                    const storageRef = firebase.storage().ref(`server-icons/${serverId}`);
                    storageRef.put(iconFile).then(snapshot => {
                        return snapshot.ref.getDownloadURL();
                    }).then(downloadURL => {
                        // İkon URL'sini sunucu bilgilerine ekle
                        serversRef.child(serverId).update({
                            icon: downloadURL
                        });
                    });
                }
                
                // Modalı kapat
                serverModal.classList.remove('active');
                serverNameInput.value = '';
                serverIconInput.value = '';
                
                // Yeni sunucu ikonu oluştur ve sidebar'a ekle
                createServerIcon(serverId, serverName);
            });
        }
    });
    
    // Ayarları kaydet butonuna tıklama
    saveSettingsBtn.addEventListener('click', function() {
        const newUsername = settingsUsernameInput.value.trim();
        const newEmail = settingsEmailInput.value.trim();
        
        if (newUsername) {
            // Kullanıcı adını güncelle
            username = newUsername;
            localStorage.setItem('username', username);
            document.getElementById('current-username').textContent = username;
            document.getElementById('user-avatar-img').src = `https://ui-avatars.com/api/?name=${username}&background=random`;
            document.getElementById('settings-avatar-img').src = `https://ui-avatars.com/api/?name=${username}&background=random&size=100`;
            
            // Firebase'de kullanıcı bilgilerini güncelle
            usersRef.child(getValidKey(currentUsername)).update({
                username: username,
                email: newEmail
            });
            
            // Mevcut kullanıcı adını güncelle
            currentUsername = username;
            
            // Modalı kapat
            userSettingsModal.classList.remove('active');
        }
    });
    
    // Modal kapatma butonları
    closeModals.forEach(button => {
        button.addEventListener('click', function() {
            const modal = this.closest('.modal');
            modal.classList.remove('active');
        });
    });
    
    // Dışarı tıklandığında modalı kapat
    window.addEventListener('click', function(e) {
        if (e.target.classList.contains('modal')) {
            e.target.classList.remove('active');
        }
    });
    
    // Kullanıcı listesini güncelle
    function updateUsersList() {
        const onlineList = document.getElementById('online-users-list');
        const offlineList = document.getElementById('offline-users-list');
        
        // Listeler temizle
        onlineList.innerHTML = '';
        offlineList.innerHTML = '';
        
        // Çevrimiçi ve çevrimdışı sayaçları
        let onlineCount = 0;
        let offlineCount = 0;
        
        // Kullanıcıları al
        usersRef.once('value', snapshot => {
            snapshot.forEach(userSnapshot => {
                const userData = userSnapshot.val();
                
                // Kullanıcı elemanını oluştur
                const memberElement = document.createElement('div');
                memberElement.classList.add('member');
                
                const avatarElement = document.createElement('div');
                avatarElement.classList.add('member-avatar');
                
                const imgElement = document.createElement('img');
                imgElement.src = `https://ui-avatars.com/api/?name=${userData.username}&background=random`;
                imgElement.alt = 'Avatar';
                
                const statusIndicator = document.createElement('div');
                statusIndicator.classList.add('status-indicator');
                statusIndicator.classList.add(userData.online ? 'online' : 'offline');
                
                avatarElement.appendChild(imgElement);
                avatarElement.appendChild(statusIndicator);
                
                const infoElement = document.createElement('div');
                infoElement.classList.add('member-info');
                
                const nameElement = document.createElement('div');
                nameElement.classList.add('member-name');
                nameElement.textContent = userData.username;
                
                infoElement.appendChild(nameElement);
                
                // Eğer bir durum mesajı varsa ekle
                if (userData.status) {
                    const statusElement = document.createElement('div');
                    statusElement.classList.add('member-status');
                    statusElement.textContent = userData.status;
                    infoElement.appendChild(statusElement);
                }
                
                memberElement.appendChild(avatarElement);
                memberElement.appendChild(infoElement);
                
                // Kullanıcıyı uygun listeye ekle
                if (userData.online) {
                    onlineList.appendChild(memberElement);
                    onlineCount++;
                } else {
                    offlineList.appendChild(memberElement);
                    offlineCount++;
                }
            });
            
            // Sayaçları güncelle
            document.getElementById('online-count').textContent = onlineCount;
            document.getElementById('offline-count').textContent = offlineCount;
        });
    }
    
    // Yeni sunucu ikonu oluştur
    function createServerIcon(serverId, serverName) {
        const serversList = document.querySelector('.servers-list');
        const addServerButton = document.querySelector('.add-server');
        
        const serverIcon = document.createElement('div');
        serverIcon.classList.add('server-icon');
        serverIcon.setAttribute('data-server-id', serverId);
        
        // İlk iki harfi kullan
        const initials = serverName.substring(0, 2).toUpperCase();
        serverIcon.textContent = initials;
        
        const tooltip = document.createElement('div');
        tooltip.classList.add('server-tooltip');
        tooltip.textContent = serverName;
        
        serverIcon.appendChild(tooltip);
        
        // Tıklama olayı ekle
        serverIcon.addEventListener('click', function() {
            serverIcons.forEach(i => i.classList.remove('active'));
            this.classList.add('active');
            document.getElementById('current-server-name').textContent = serverName;
        });
        
        // Add server butonundan önce ekle
        serversList.insertBefore(serverIcon, addServerButton);
    }
    
    // Yardımcı fonksiyonlar
    function generateUserId() {
        const id = 'user_' + Math.random().toString(36).substr(2, 9);
        localStorage.setItem('discord_user_id', id);
        return id;
    }
    
    function generateUserTag() {
        const tag = Math.floor(1000 + Math.random() * 9000).toString();
        localStorage.setItem('discord_user_tag', tag);
        return tag;
    }
    
    function generateServerId() {
        return 'server_' + Math.random().toString(36).substr(2, 9);
    }
    
    function generateChannelId() {
        return 'channel_' + Math.random().toString(36).substr(2, 9);
    }
    
    // Başlangıç işlemleri
    updateUsersList();
    
    // Kullanıcıları anlık dinle
    usersRef.on('child_added', updateUsersList);
    usersRef.on('child_changed', updateUsersList);
    usersRef.on('child_removed', updateUsersList);
}); 