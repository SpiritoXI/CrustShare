const fs = require('fs');
const path = require('path');

// 读取原始图片
const inputPath = path.join(__dirname, '..', 'public', 'background.png');
const outputPath = path.join(__dirname, '..', 'public', 'background-compressed.jpg');

// 检查文件是否存在
if (!fs.existsSync(inputPath)) {
  console.error('错误: 找不到背景图片');
  process.exit(1);
}

const stats = fs.statSync(inputPath);
const originalSize = stats.size;
console.log(`原始图片大小: ${(originalSize / 1024 / 1024).toFixed(2)} MB`);

// 由于没有 sharp，我们创建一个脚本来提示用户使用在线工具
// 或者转换为 JPEG 格式（通常更小）
console.log('\n建议的压缩方案:');
console.log('1. 使用在线工具如 https://tinypng.com/ 或 https://squoosh.app/');
console.log('2. 将 PNG 转换为 JPEG 格式（文件会更小）');
console.log('3. 调整图片尺寸到 1920x1080 或更小');
console.log('4. 目标大小: 500KB - 2MB');
console.log('\n或者你可以手动安装 sharp:');
console.log('  npm install sharp --save-dev');
console.log('然后运行压缩脚本。');
