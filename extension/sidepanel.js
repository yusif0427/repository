const $ = (id) => document.getElementById(id);
let screenshotDataUrl = "";

async function loadContext() {
  const { roxygptContext } = await chrome.storage.session.get("roxygptContext");
  if (!roxygptContext) return;
  $("pageInfo").textContent = [roxygptContext.title, roxygptContext.url, roxygptContext.selectionText ? "Seçim: " + roxygptContext.selectionText : ""].filter(Boolean).join("\n");
  if (roxygptContext.imageUrl) {
    $("output").textContent = "Sağ tıklanan görsel URL'si bağlama eklendi. Dış kaynağa otomatik istek yapılmadı.";
  }
}

$("capture").addEventListener("click", async () => {
  $("capture").disabled = true;
  $("capture").textContent = "Görüntü alınıyor…";
  try {
    const response = await chrome.runtime.sendMessage({ type: "ROXYGPT_CAPTURE_VISIBLE" });
    if (!response?.ok) throw new Error(response?.error || "Ekran görüntüsü alınamadı");
    screenshotDataUrl = response.dataUrl;
    $("preview").src = screenshotDataUrl;
    $("preview").style.display = "block";
    $("output").textContent = "Ekran görüntüsü yerel önizlemeye alındı. Henüz hiçbir sağlayıcıya gönderilmedi.";
  } catch (error) {
    $("output").textContent = "Ekran görüntüsü hatası: " + error.message;
  } finally {
    $("capture").disabled = false;
    $("capture").textContent = "Görünen ekranın görüntüsünü al";
  }
});

$("chatgpt").addEventListener("click", () => {
  $("output").textContent = "ChatGPT bağlantısı için resmi Sign in with ChatGPT entegrasyonu ve gerekli erişim/uygunluk doğrulanmalı. Bu projede OAuth istemci bilgisi henüz yok; şifre veya çerez istemiyoruz.";
});
$("gemini").addEventListener("click", () => {
  $("output").textContent = "Gemini API OAuth için Google Cloud projesi, Generative Language API, OAuth consent screen, istemci kimliği ve uygun scope'lar yapılandırılmalı. Google hesabına giriş tek başına Gemini model erişimi değildir.";
});

$("send").addEventListener("click", () => {
  $("output").textContent = "Güvenli sağlayıcı bağlantısı yapılandırılmadan istek gönderilemez. Bu, sahte yanıt veya gizli çerez kullanımı yerine bilinçli olarak engellendi.";
});

chrome.runtime.onMessage.addListener((message) => {
  if (message?.type === "ROXYGPT_HIDE_REQUEST") {
    $("output").textContent = "Chrome, yan paneli uzantıdan her durumda programlı olarak kapatmaya izin vermeyebilir. Paneli Chrome'un yan panel kontrolünden kapatabilirsin.";
  }
});

loadContext();