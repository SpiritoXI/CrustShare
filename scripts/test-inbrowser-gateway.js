/**
 * 测试 inbrowser.link 网关可用性
 * 使用方法: node scripts/test-inbrowser-gateway.js
 */

// 测试用的 CID (CrustShare 默认测试 CID)
const TEST_CID = 'bafkreigh2akiscaildcqabsyg3dfr6chu3fgpregiymsck7e7aqa4s52zy';

// inbrowser.link 网关配置
const INBROWSER_GATEWAY = {
  name: 'Inbrowser Link',
  url: 'https://inbrowser.link/ipfs/',
  icon: '🌐',
  priority: 5,
  region: 'INTL'
};

// 测试网关函数
async function testGateway(gateway, testCid = TEST_CID) {
  const testUrl = `${gateway.url}${testCid}`;
  const timeout = 15000; // 15秒超时

  console.log(`\n🔍 测试网关: ${gateway.name}`);
  console.log(`   URL: ${gateway.url}`);
  console.log(`   测试地址: ${testUrl}`);
  console.log(`   超时设置: ${timeout}ms`);

  const startTime = Date.now();

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    // 使用 HEAD 请求测试
    const response = await fetch(testUrl, {
      method: 'HEAD',
      signal: controller.signal,
      redirect: 'follow',
      headers: {
        'Accept': '*/*',
        'User-Agent': 'CrustShare-Gateway-Test/1.0'
      }
    });

    clearTimeout(timeoutId);
    const latency = Date.now() - startTime;

    console.log(`   状态码: ${response.status}`);
    console.log(`   延迟: ${latency}ms`);

    // 检查响应头
    const corsEnabled = response.headers.has('access-control-allow-origin');
    const rangeSupport = response.headers.has('accept-ranges');
    const contentLength = response.headers.get('content-length');
    const contentType = response.headers.get('content-type');

    console.log(`   CORS支持: ${corsEnabled ? '✅' : '❌'}`);
    console.log(`   Range支持: ${rangeSupport ? '✅' : '❌'}`);
    console.log(`   Content-Length: ${contentLength || 'N/A'}`);
    console.log(`   Content-Type: ${contentType || 'N/A'}`);

    // 判断是否可用
    const available = response.ok || response.status === 200 || response.status === 204;

    if (available) {
      console.log(`   ✅ 网关可用`);
    } else {
      console.log(`   ❌ 网关不可用 (HTTP ${response.status})`);
    }

    return {
      available,
      latency,
      status: response.status,
      corsEnabled,
      rangeSupport,
      headers: Object.fromEntries(response.headers.entries())
    };

  } catch (error) {
    const latency = Date.now() - startTime;
    console.log(`   ❌ 测试失败: ${error.message}`);
    console.log(`   耗时: ${latency}ms`);

    return {
      available: false,
      latency,
      error: error.message,
      corsEnabled: false,
      rangeSupport: false
    };
  }
}

// 测试 GET 请求 (用于验证实际内容获取)
async function testGetRequest(gateway, testCid = TEST_CID) {
  const testUrl = `${gateway.url}${testCid}`;

  console.log(`\n📥 测试 GET 请求获取内容...`);

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 20000);

    const response = await fetch(testUrl, {
      method: 'GET',
      signal: controller.signal,
      redirect: 'follow'
    });

    clearTimeout(timeoutId);

    if (response.ok) {
      const content = await response.text();
      console.log(`   ✅ GET 请求成功`);
      console.log(`   内容长度: ${content.length} 字节`);
      console.log(`   内容预览: ${content.substring(0, 100)}...`);
      return { success: true, contentLength: content.length };
    } else {
      console.log(`   ❌ GET 请求失败: HTTP ${response.status}`);
      return { success: false, status: response.status };
    }
  } catch (error) {
    console.log(`   ❌ GET 请求错误: ${error.message}`);
    return { success: false, error: error.message };
  }
}

// 主测试函数
async function main() {
  console.log('='.repeat(60));
  console.log('🧪 Inbrowser.link 网关测试工具');
  console.log('='.repeat(60));
  console.log(`测试 CID: ${TEST_CID}`);
  console.log(`测试时间: ${new Date().toLocaleString()}`);

  // 测试 1: HEAD 请求
  const headResult = await testGateway(INBROWSER_GATEWAY);

  // 测试 2: GET 请求 (仅在 HEAD 成功时)
  let getResult = null;
  if (headResult.available) {
    getResult = await testGetRequest(INBROWSER_GATEWAY);
  }

  // 测试 3: 测试不同 CID 格式
  console.log('\n' + '='.repeat(60));
  console.log('🧪 测试不同 CID 格式');
  console.log('='.repeat(60));

  const testCids = [
    'bafkreigh2akiscaildcqabsyg3dfr6chu3fgpregiymsck7e7aqa4s52zy', // CIDv1
    'QmPK1s3pNYLi9ERiq3BDxKa4XosgWwFRQUydHUtz4YgpqB', // CIDv0
  ];

  for (const cid of testCids) {
    console.log(`\n测试 CID: ${cid}`);
    const result = await testGateway({ ...INBROWSER_GATEWAY }, cid);
  }

  // 总结报告
  console.log('\n' + '='.repeat(60));
  console.log('📊 测试总结');
  console.log('='.repeat(60));
  console.log(`网关名称: ${INBROWSER_GATEWAY.name}`);
  console.log(`网关地址: ${INBROWSER_GATEWAY.url}`);
  console.log(`HEAD 请求: ${headResult.available ? '✅ 可用' : '❌ 不可用'}`);
  if (headResult.available) {
    console.log(`延迟: ${headResult.latency}ms`);
    console.log(`CORS: ${headResult.corsEnabled ? '✅ 支持' : '❌ 不支持'}`);
    console.log(`Range: ${headResult.rangeSupport ? '✅ 支持' : '❌ 不支持'}`);
  }
  if (getResult) {
    console.log(`GET 请求: ${getResult.success ? '✅ 成功' : '❌ 失败'}`);
  }

  // 项目集成建议
  console.log('\n' + '='.repeat(60));
  console.log('💡 项目集成建议');
  console.log('='.repeat(60));

  if (headResult.available) {
    console.log('✅ inbrowser.link 网关可以被项目使用');
    console.log('');
    console.log('添加到 lib/config.ts 的 DEFAULT_GATEWAYS 数组中:');
    console.log(JSON.stringify({
      name: 'Inbrowser Link',
      url: 'https://inbrowser.link/ipfs/',
      icon: '🌐',
      priority: 14,
      region: 'INTL'
    }, null, 2) + ',');

    if (!headResult.corsEnabled) {
      console.log('\n⚠️ 注意: 该网关不支持 CORS，在某些场景下可能会有跨域问题');
    }
    if (!headResult.rangeSupport) {
      console.log('\n⚠️ 注意: 该网关不支持 Range 请求，大文件分片下载可能受影响');
    }
  } else {
    console.log('❌ inbrowser.link 网关当前不可用');
    console.log(`错误信息: ${headResult.error || '未知错误'}`);
    console.log('\n可能的原因:');
    console.log('1. 网关服务暂时不可用');
    console.log('2. 网络连接问题');
    console.log('3. 测试 CID 在该网关上不存在');
    console.log('4. 网关需要特殊的请求头或认证');
  }

  console.log('\n' + '='.repeat(60));
}

// 运行测试
main().catch(console.error);
