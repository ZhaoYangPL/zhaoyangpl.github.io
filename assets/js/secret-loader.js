document.addEventListener('DOMContentLoaded', function() {
  const testButton = document.getElementById('test-button');
  if (testButton) {
    testButton.addEventListener('click', function() {
      alert('成功！外部 JavaScript 脚本可以正常运行！');
    });
    console.log('外部测试脚本已加载，并成功绑定了点击事件。');
  } else {
    console.error('致命错误：无法在页面上找到测试按钮。');
  }
});