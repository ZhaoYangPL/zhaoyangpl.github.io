document.addEventListener('DOMContentLoaded', function() {
  // 检查页面上是否存在解密按钮，只有存在时才运行解密逻辑
  const decryptButton = document.getElementById('decrypt-button');
  if (!decryptButton) {
    return; // 如果不是私密页面，就直接退出
  }

  const passwordInput = document.getElementById('password-input');
  const contentDiv = document.getElementById('secret-content');
  const controlsDiv = document.getElementById('secret-controls');
  const titleHeader = document.getElementById('page-title');
  
  // 这是从布局文件中获取加密内容的关键
  // 我们通过一个隐藏的 div 来传递 Jekyll 变量
  const encryptedContentContainer = document.getElementById('encrypted-content-data');
  if (!encryptedContentContainer) {
      console.error('Fatal Error: Encrypted content data container not found!');
      return;
  }
  const encryptedContent = encryptedContentContainer.textContent.trim();

  function decrypt() {
    const password = passwordInput.value;
    if (!password) {
      alert("Please enter the password！");
      return;
    }
    try {
      const decrypted = CryptoJS.AES.decrypt(encryptedContent, password);
      const plaintext = decrypted.toString(CryptoJS.enc.Utf8);

      if (plaintext) {
        contentDiv.innerHTML = marked.parse(plaintext);
        contentDiv.style.display = 'block';
        controlsDiv.style.display = 'none';
        // 这里的 pageTitleData 是从另一个隐藏div获取的
        titleHeader.innerText = document.getElementById('page-title-data').textContent.trim();
      } else {
        throw new Error('Decryption failed');
      }
    } catch (e) {
      alert("Password Error！");
      passwordInput.value = '';
    }
  }

  // 绑定事件
  decryptButton.addEventListener('click', decrypt);
  passwordInput.addEventListener('keypress', function(event) {
    if (event.key === 'Enter') {
      decrypt();
    }
  });
});