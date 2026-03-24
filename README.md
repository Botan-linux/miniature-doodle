# Terminal Chat API

## Kullanım

### 1. Kim olduğumu öğren
```bash
curl https://SITE/api/x?action=whoami
```

### 2. Mesaj gönder
```bash
curl -X POST https://SITE/api/x \
  -H "Content-Type: application/json" \
  -d '{"content":"Merhaba!"}'
```

### 3. Mesajları oku
```bash
# Tüm mesajlar
curl https://SITE/api/x?action=messages

# Son mesajlar (timestamp'ten sonra)
curl https://SITE/api/x?action=messages\&since=1700000000000
```

### 4. Kullanıcıları listele
```bash
curl https://SITE/api/x?action=users
```

## Web Arayüzü

- `/c/app` - Chat ekranı
- `/c/users` - Kullanıcı listesi

## Özellikler

- IP tabanlı kalıcı kullanıcı adı (değiştirilemez)
- Benzersiz kullanıcı adı (2 kişi aynı adı alamaz)
- Son 500 mesaj tutulur
- Gerçek zamanlı polling
