# HangiFirma — Kurulum Rehberi

## Genel Bakış

Bu proje 3 parçadan oluşur:
- **Dashboard (index.html):** Sen giriş yapıp ziyaretçileri görürsün
- **api/track.js:** Sitenizi ziyaret edenlerin IP'sini yakalar
- **api/visits.js:** Dashboard'a veriyi iletir

---

## ADIM 1 — Hesapları Aç

### 1a. GitHub
1. https://github.com adresine git
2. "Sign up" butonuna tıkla
3. E-posta, şifre ve kullanıcı adı gir
4. Hesabı doğrula

### 1b. Vercel
1. https://vercel.com adresine git
2. "Sign up" → "Continue with GitHub" seç
3. GitHub hesabınla bağlan

### 1c. IPinfo
1. https://ipinfo.io adresine git
2. "Get a free API token" tıkla
3. Hesap oluştur
4. Dashboard'da token'ını kopyala (örn: `abc123def456`)

---

## ADIM 2 — Kodu GitHub'a Yükle

1. GitHub'a giriş yap
2. Sağ üstteki "+" simgesine tıkla → "New repository"
3. Repository name: `hangifirma`
4. "Public" seçili olsun
5. "Create repository" tıkla
6. Açılan sayfada "uploading an existing file" linkine tıkla
7. Sana verilen klasörün içindeki TÜM dosyaları sürükle bırak:
   - `vercel.json`
   - `package.json`
   - `api/track.js`
   - `api/visits.js`
   - `public/index.html`
8. "Commit changes" tıkla

---

## ADIM 3 — Vercel'e Deploy Et

1. https://vercel.com/dashboard adresine git
2. "Add New" → "Project"
3. GitHub'daki `hangifirma` reposunu seç → "Import"
4. Hiçbir şeyi değiştirme, direkt "Deploy" tıkla
5. 1-2 dakika bekle → site yayında!

---

## ADIM 4 — Environment Variables (Önemli!)

Deploy olduktan sonra:

1. Vercel dashboard'unda projeye tıkla
2. "Settings" → "Environment Variables"
3. Şu değerleri ekle:

| Name | Value |
|------|-------|
| `IPINFO_TOKEN` | IPinfo'dan aldığın token (örn: abc123def456) |

4. "Save" tıkla
5. "Deployments" sekmesine git → "Redeploy" tıkla

---

## ADIM 5 — Vercel KV Veritabanı Ekle

1. Vercel dashboard'unda projeye tıkla
2. "Storage" sekmesi → "Create Database"
3. "KV" seç → "Continue"
4. Bir isim ver (örn: `hangifirma-db`) → "Create"
5. "Connect to Project" tıkla → projeyi seç

Bu adım otomatik olarak gerekli environment variable'ları ekler.

---

## ADIM 6 — Şifreni Değiştir

`public/index.html` dosyasını aç, şu satırı bul:

```javascript
const ADMIN_PASS = 'hangifirma2024';
```

`hangifirma2024` yazan kısmı kendi şifrenle değiştir.

---

## ADIM 7 — Domain Bağla (Opsiyonel)

Eğer `hangifirma.com` domenini aldıysan:

1. Vercel → Settings → Domains
2. "Add Domain" → `hangifirma.com` yaz
3. Sana DNS ayarları gösterecek
4. Domain'i aldığın sitede (GoDaddy, Namecheap vb.) DNS ayarlarını güncelle

---

## Giriş Bilgileri

- **Kullanıcı adı:** `admin`
- **Şifre:** `hangifirma2024` (değiştirmen önerilir)

---

## Sıkça Sorulan Sorular

**Neden bazı ziyaretçilerde firma çıkmıyor?**
Mobil internet (Turkcell, Vodafone) veya ev internet bağlantıları genellikle kurumsal IP değildir. Sadece şirket internet bağlantılarında firma adı görünür.

**Veriler ne kadar süre saklanır?**
Son 10.000 ziyaret kayıtlıdır. Ücretsiz Vercel KV planında bu yeterlidir.

**Aylık kaç ziyareti ücretsiz kaldırabilir?**
- Vercel: ayda 100.000 request (ücretsiz)
- IPinfo: ayda 50.000 sorgu (ücretsiz)

Normal kullanım için yeterli.
