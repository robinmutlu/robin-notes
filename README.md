# Robin Notes - Eğitim ve Döküman Yönetim Sistemi

Modern, güvenli ve kullanıcı dostu bir eğitim notları ve döküman yönetim platformu. Kullanıcıların ders notlarını PDF formatında paylaşmasına, otomatik DOCX dönüşümü yapmasına ve güvenli bir şekilde içerik yönetmesine olanak tanır.

<table>
  <tr>
    <td width="220" align="center">
      <img src="public/logo.png" alt="Robin Notes Logo" width="200" />
    </td>
    <td valign="center">
      <pre>
 ____       _     _       _   _       _            
|  _ \ ___ | |__ (_)_ __ | \ | | ___ | |_ ___ ___ 
| |_) / _ \| '_ \| | '_ \|  \| |/ _ \| __/ _ \/ __|
|  _ < (_) | |_) | | | | | |\  | (_) | ||  __/\__ \
|_| \_\___/|_.__/|_|_| |_|_| \_|\___/ \__\___||___/
      </pre>
    </td>
  </tr>
</table>

## 🚀 Özellikler

### 🔐 Kimlik Doğrulama & Güvenlik
- **E-posta Doğrulama**: Brevo API entegrasyonu ile güvenli kayıt akışı.
- **JWT Auth**: Güvenli oturum yönetimi.
- **Rol Tabanlı Erişim**: Admin ve Standart Kullanıcı rolleri.
- **Admin Paneli**: Kullanıcı ve içerik yönetimi.

### 📄 Döküman Yönetimi (Öne Çıkan)
- **Otomatik Dönüşüm**: Yüklenen `.docx` ve `.doc` dosyaları sunucu tarafında otomatik olarak PDF'e dönüştürülür.
- **Akıllı Filigran**: Tüm PDF dosyalarına (yüklenen veya dönüştürülen) "© Robin Notes" filigranı eklenir.
- **Tıklanabilir Filigran**: Filigran, `notes.rob1n.dev` adresine yönlendiren tıklanabilir bir bağlantı içerir.
- **PDF Önizleme**: Entegre PDF görüntüleyici ile dosyalar tarayıcıda görüntülenir.
- **Güvenli İndirme**: Dosyalar orijinal isimleriyle veya düzeltilmiş uzantılarla indirilir.

### 🧹 Otomatik Temizlik Sistemi
- **Dosya Temizliği**: 
    - Bir kurs silindiğinde kapak fotoğrafı ve tüm içerik dosyaları silinir.
    - Bir kullanıcı silindiğinde avatarı ve tüm ders dosyaları silinir.
    - İçerik silindiğinde ilgili dosya sunucudan kaldırılır.

## 🛠️ Teknolojiler

- **Frontend**: React 19, Vite, React Router v7
- **Backend**: Node.js, Express
- **Veritabanı**: MongoDB
- **Dosya İşlemleri**: 
  - `mammoth`: DOCX metin çıkarma
  - `pdf-lib`: PDF oluşturma ve filigran ekleme
  - `fontkit`: Özel font yönetimi
- **Email**: Brevo API

## 📦 Kurulum

Kodu bilgisayarınıza klonlayın:

```bash
git clone https://github.com/robinmutlu/robin-notes.git
cd robin-notes
```

### Yöntem 1: Docker (Önerilen)

Tek komutla tüm sistemi (App + MongoDB) ayağa kaldırın:

1. `.env` dosyasını oluşturun (aşağıdaki örneğe bakın).
2. Çalıştırın:

```bash
docker-compose up --build
```

Uygulama `http://localhost:5000` adresinde çalışacaktır.

### Yöntem 2: Manuel Kurulum

**Gereksinimler:** Node.js v18+, MongoDB

1. Bağımlılıkları yükleyin:
```bash
npm install
```

2. `.env` dosyasını oluşturun.

3. Frontend'i build alın ve sunucuyu başlatın:
```bash
npm run build
npm run server
```

Veya geliştirme modunda (Frontend: 5173, Backend: 5000):
```bash
npm run dev:full
```

## 🔑 Çevresel Değişkenler (.env)

Proje kök dizininde bir `.env` dosyası oluşturun:

```env
# Server
PORT=5000
NODE_ENV=production # Geliştirme için: development

# Database
MONGODB_URI=mongodb://localhost:27017/aso # Docker için: mongodb://mongo:27017/aso

# Security
JWT_SECRET=süper_gizli_anahtar_buraya
FRONTEND_URL=http://localhost:5173 # Prod için: http://your-domain.com

# Email (Brevo)
BREVO_API_KEY=xkeysib-sizin-api-keyiniz
BREVO_SENDER_EMAIL=noreply@siteniz.com
BREVO_SENDER_NAME="Robin Notes"
```

## 🐳 Docker Yapısı

Proje tek bir container yapısında çalışacak şekilde optimize edilmiştir:
- **Build Stage**: React uygulaması `vite build` ile derlenir.
- **Production Stage**: Node.js sunucusu, derlenmiş frontend dosyalarını (`client/dist`) statik olarak sunar ve API isteklerini karşılar.

## 🤝 Katkıda Bulunma

1. Forklayın
2. Feature branch oluşturun (`git checkout -b feature/harika-ozellik`)
3. Commit atın (`git commit -m 'Harika özellik eklendi'`)
4. Pushlayın (`git push origin feature/harika-ozellik`)
5. Pull Request açın

## 📝 Lisans

Bu proje MIT lisansı ile lisanslanmıştır.
