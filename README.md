# Arkadaş Sohbet Uygulaması

Bu basit web uygulaması, arkadaşlarınızla metin ve sesli sohbet etmenizi sağlayan bir platformdur. Uygulama şu an için demo amaçlıdır ve gerçek sohbet özelliği için sunucu tarafı gereklidir.

## Özellikler

- Kullanıcı adı belirleme
- Mesaj gönderme
- Çevrimiçi kullanıcıları görüntüleme
- Otomatik demo mesajlar (gerçek bir veritabanı olmadığı için)
- Responsive tasarım (mobil cihazlara uyumlu)
- Oda oluşturma ve odaya katılma
- Sesli konuşma

## Nasıl Kullanılır

1. index.html dosyasını bir web tarayıcısında açın.
2. Sağ üst köşedeki giriş alanına kullanıcı adınızı yazın ve "Kaydet" butonuna tıklayın.
3. Mesaj yazmak için alt kısımdaki metin kutusunu kullanın ve "Gönder" butonuna tıklayın veya Enter tuşuna basın.
4. Sağ taraftaki panelde çevrimiçi kullanıcıları görebilirsiniz.

### Oda Oluşturma ve Katılma

1. "Oda adı" kutusuna bir oda adı girin ve "Oda Oluştur" butonuna tıklayın.
2. Oda oluşturulduğunda size bir Oda ID verilecektir. Bu ID'yi arkadaşlarınızla paylaşın.
3. Arkadaşlarınız "Oda ID" kutusuna bu ID'yi girip "Odaya Katıl" butonuna tıklayarak odanıza katılabilirler.
4. Bir odadan ayrılmak için "Odadan Ayrıl" butonuna tıklayabilirsiniz.

### Sesli Konuşma

1. Sağ paneldeki "Mikrofonu Aç" butonuna tıklayarak sesli konuşmaya başlayabilirsiniz.
2. Tarayıcı mikrofon erişimi için izin isteyecektir.
3. İzin verdikten sonra sesiniz odadaki diğer kullanıcılara iletilir.
4. Konuşmayı bitirmek için "Mikrofonu Kapat" butonuna tıklayın.
5. Aktif konuşmacılar sesli konuşma panelinde gösterilir.

## Gerçek Sohbet İçin Geliştirme

Bu uygulamayı gerçek bir sohbet uygulamasına dönüştürmek için:

1. WebSocket veya Firebase gibi gerçek zamanlı bir veritabanı eklenmelidir.
2. Kullanıcı kimlik doğrulama sistemi geliştirilmelidir.
3. Mesajların veritabanında saklanması sağlanmalıdır.
4. Çevrimiçi durum takibi için bir sistem eklenmelidir.
5. Sesli konuşma için WebRTC veya benzer bir teknoloji kullanılmalıdır.
6. Odaların yönetimi için sunucu taraflı bir sistem eklenmelidir.

## Teknolojiler

- HTML
- CSS
- JavaScript
- MediaRecorder API (sesli konuşma için)

## Tarayıcı Gereksinimleri

- Modern bir web tarayıcısı (Chrome, Firefox, Edge, Safari)
- Mikrofon erişimi için HTTPS protokolü (yerel makinada çalıştırırken istisnadır)

## İleriki Geliştirmeler

- Resim, dosya paylaşımı
- Grup sohbetleri
- Bildirimler
- Görüntülü arama
- Emoji ve çıkartma desteği
- Uçtan uca şifreleme
- Oda listesi ve arama özelliği 