/**
 * 测试永久存储功能（使用 1200 个月配置）
 */

const CONFIG = {
  CRUST: {
    UPLOAD_API: 'https://gw.crustfiles.app/api/v0/add?pin=true',
    ORDER_API: 'https://gw.crustfiles.app/crust/api/v1/files',
    // 永久存储：1200 个月 = 100 年
    DEFAULT_STORAGE_MONTHS: 1200,
  },
};

const TOKEN = 'c3Vic3RyYXRlLWNUS2JmTnc2RGh3SDFFUVRTWGllSGdYbmtENDVrRG5rUHlHOXpOUEpBMXE4SzNDNXQ6MHg0YzRiNjNhOTYyY2M5MzQxOTJhMmNhMTQ3MTNjNmY0M2ZiOGQzOGY3NzEwNWUzNTcxN2U4M2E3MTc2OWY3NzU1MzFmZGU4MTFiYzIyNWY1OTA4OTZlYjRmNTQwZjUyZWZkZWY0MTc3Y2NhNGU5NzhlMDJmZDM4ZTgwZjIwMWM4NQ==';

async function testPermanentStorage() {
  console.log('══════════════════════════════════════════════════════════════');
  console.log('        测试永久存储（1200 个月 ≈ 100 年续期池）');
  console.log('══════════════════════════════════════════════════════════════');
  
  console.log('\n📌 Crust 永久存储机制说明：');
  console.log('  - 存储订单有效期：180 天（约 6 个月）');
  console.log('  - months 参数：计算存入续期池的 CRU 数量');
  console.log('  - 续期池余额充足时，订单到期会自动续期');
  console.log('  - 1200 个月 = 约 100 年的续期费用');
  
  // 创建测试文件
  const testContent = Buffer.from(`Permanent Storage Test - ${new Date().toISOString()}\n这个文件将被永久存储。`);
  const fileName = `permanent-v2-${Date.now()}.txt`;

  console.log(`\n测试文件: ${fileName} (${testContent.length} bytes)`);

  // 上传
  console.log('\n─────────────────────────────────────────────────────────────');
  console.log('步骤 1: 上传文件');
  console.log('─────────────────────────────────────────────────────────────');

  const formData = new FormData();
  const blob = new Blob([testContent]);
  formData.append('file', blob, fileName);

  const uploadResponse = await fetch(CONFIG.CRUST.UPLOAD_API, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${TOKEN}`,
    },
    body: formData,
  });

  const uploadResult = await uploadResponse.json();
  const cid = uploadResult.Hash || uploadResult.cid;
  const size = uploadResult.Size || testContent.length;

  console.log(`✅ 上传成功！`);
  console.log(`  CID: ${cid}`);
  console.log(`  大小: ${size} bytes`);

  // 创建存储订单（永久存储）
  console.log('\n─────────────────────────────────────────────────────────────');
  console.log('步骤 2: 创建存储订单（永久存储）');
  console.log('─────────────────────────────────────────────────────────────');

  const orderUrl = `${CONFIG.CRUST.ORDER_API}/${cid}/order`;
  const months = CONFIG.CRUST.DEFAULT_STORAGE_MONTHS;

  console.log(`\n[Crust] 创建存储订单...`);
  console.log(`  续期池月数: ${months} 个月`);
  console.log(`  等效存储年限: 约 ${Math.floor(months * 180 / 365)} 年`);

  const orderResponse = await fetch(orderUrl, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      cid,
      size,
      months,
    }),
  });

  console.log(`\n响应状态: ${orderResponse.status}`);
  const responseText = await orderResponse.text();
  console.log(`响应内容: ${responseText || '(空)'}`);

  if (orderResponse.ok) {
    console.log(`\n✅ 存储订单创建成功！`);
    console.log(`\n══════════════════════════════════════════════════════════════`);
    console.log('                    永久存储配置完成！');
    console.log('══════════════════════════════════════════════════════════════');
    console.log(`\nCID: ${cid}`);
    console.log(`网关访问: https://gw.crustfiles.app/ipfs/${cid}`);
    console.log(`\n💡 续期池已充值 ${months} 个月费用`);
    console.log(`   订单每 180 天自动续期一次`);
    console.log(`   预计可续期 ${Math.floor(months * 180 / 180)} 次`);
    console.log(`   等效存储约 ${Math.floor(months * 180 / 365)} 年`);
  } else {
    console.log(`\n❌ 存储订单创建失败`);
  }
}

testPermanentStorage();
