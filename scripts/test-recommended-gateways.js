/**
 * 测试推荐的 IPFS 网关
 * 测试列表:
 * 1. gateway.ipfs.io - IPFS 官方网关
 * 2. hardbin.com - 可靠公共网关
 * 3. ipfs.fleek.co - Fleek 网关
 */

const TEST_CID = 'bafkreigh2akiscaildcqabsyg3dfr6chu3fgpregiymsck7e7aqa4s52zy';
const TEST_CID_V0 = 'QmPK1s3pNYLi9ERiq3BDxKa4XosgWwFRQUydHUtz4YgpqB';

// 要测试的网关列表
const GATEWAYS_TO_TEST = [
  {
    name: 'IPFS.io Gateway',
    url: 'https://gateway.ipfs.io/ipfs/',
    icon: '🌐',
    priority: 14,
    region: 'INTL',
    description: 'IPFS 官方网关'
  },
  {
    name: 'Hardbin',
    url: 'https://hardbin.com/ipfs/',
    icon: '📦',
    priority: 15,
    region: 'INTL',
    description: '可靠公共网关'
  },
  {
    name: 'Fleek',
    url: 'https://ipfs.fleek.co/ipfs/',
    icon: '⚡',
    priority: 16,
    region: 'INTL',
    description: 'Fleek 提供的高速网关'
  },
  {
    name: 'IPFS.io',
    url: 'https://ipfs.io/ipfs/',
    icon: '🧊',
    priority: 17,
    region: 'INTL',
    description: 'IPFS 官方主网关'
  }
];

// 测试单个网关
async function testGateway(gateway, testCid = TEST_CID) {
  const testUrl = `${gateway.url}${testCid}`;
  const timeout = 15000;

  console.log(`\n${'='.repeat(60)}`);
  console.log(`🔍 测试: ${gateway.name}`);
  console.log(`   ${gateway.description}`);
  console.log(`   URL: ${gateway.url}`);
  console.log(`   测试: ${testUrl}`);

  const results = {
    gateway: gateway.name,
    url: gateway.url,
    tests: {}
  };

  // 测试 1: HEAD 请求
  console.log(`\n   📡 HEAD 请求测试...`);
  const headStart = Date.now();
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    const response = await fetch(testUrl, {
      method: 'HEAD',
      signal: controller.signal,
      redirect: 'follow',
      headers: { 'Accept': '*/*' }
    });

    clearTimeout(timeoutId);
    const latency = Date.now() - headStart;

    const corsEnabled = response.headers.has('access-control-allow-origin');
    const rangeSupport = response.headers.has('accept-ranges');
    const contentType = response.headers.get('content-type');
    const contentLength = response.headers.get('content-length');

    results.tests.head = {
      success: response.ok,
      status: response.status,
      latency,
      corsEnabled,
      rangeSupport,
      contentType,
      contentLength: contentLength ? parseInt(contentLength) : null
    };

    console.log(`      状态: ${response.ok ? '✅' : '❌'} HTTP ${response.status}`);
    console.log(`      延迟: ${latency}ms`);
    console.log(`      CORS: ${corsEnabled ? '✅' : '❌'}`);
    console.log(`      Range: ${rangeSupport ? '✅' : '❌'}`);
    console.log(`      Content-Type: ${contentType || 'N/A'}`);

  } catch (error) {
    const latency = Date.now() - headStart;
    results.tests.head = {
      success: false,
      error: error.message,
      latency
    };
    console.log(`      ❌ 失败: ${error.message} (${latency}ms)`);
  }

  // 测试 2: GET 请求 (仅在 HEAD 成功时)
  if (results.tests.head?.success) {
    console.log(`   📥 GET 请求测试...`);
    const getStart = Date.now();
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);

      const response = await fetch(testUrl, {
        method: 'GET',
        signal: controller.signal,
        redirect: 'follow',
        headers: { 'Accept': '*/*' }
      });

      clearTimeout(timeoutId);
      const latency = Date.now() - getStart;

      const content = await response.text();
      const isHtml = content.includes('<!DOCTYPE html>') || content.includes('<html');
      const isActualContent = !isHtml || content.length < 1000;

      results.tests.get = {
        success: response.ok,
        status: response.status,
        latency,
        contentLength: content.length,
        isHtml,
        isActualContent
      };

      console.log(`      状态: ${response.ok ? '✅' : '❌'} HTTP ${response.status}`);
      console.log(`      延迟: ${latency}ms`);
      console.log(`      内容长度: ${content.length} 字节`);
      console.log(`      是否HTML: ${isHtml ? '⚠️ 是' : '✅ 否'}`);
      console.log(`      实际内容: ${isActualContent ? '✅ 是' : '⚠️ 否'}`);

      // 显示内容预览
      if (content.length < 200) {
        console.log(`      内容: ${content.substring(0, 100)}`);
      }

    } catch (error) {
      const latency = Date.now() - getStart;
      results.tests.get = {
        success: false,
        error: error.message,
        latency
      };
      console.log(`      ❌ 失败: ${error.message} (${latency}ms)`);
    }
  }

  // 测试 3: CIDv0 格式
  console.log(`   🔄 CIDv0 格式测试...`);
  const cidv0Url = `${gateway.url}${TEST_CID_V0}`;
  const cidv0Start = Date.now();
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    const response = await fetch(cidv0Url, {
      method: 'HEAD',
      signal: controller.signal,
      redirect: 'follow'
    });

    clearTimeout(timeoutId);
    const latency = Date.now() - cidv0Start;

    results.tests.cidv0 = {
      success: response.ok,
      status: response.status,
      latency
    };

    console.log(`      状态: ${response.ok ? '✅' : '❌'} HTTP ${response.status} (${latency}ms)`);

  } catch (error) {
    const latency = Date.now() - cidv0Start;
    results.tests.cidv0 = {
      success: false,
      error: error.message,
      latency
    };
    console.log(`      ❌ 失败: ${error.message} (${latency}ms)`);
  }

  // 计算综合评分
  let score = 0;
  if (results.tests.head?.success) score += 30;
  if (results.tests.head?.corsEnabled) score += 20;
  if (results.tests.head?.rangeSupport) score += 15;
  if (results.tests.get?.success) score += 20;
  if (results.tests.get?.isActualContent) score += 15;
  if (results.tests.cidv0?.success) score += 10;

  // 延迟扣分
  const avgLatency = (
    (results.tests.head?.latency || 0) +
    (results.tests.get?.latency || 0) +
    (results.tests.cidv0?.latency || 0)
  ) / 3;
  if (avgLatency > 5000) score -= 20;
  else if (avgLatency > 3000) score -= 10;
  else if (avgLatency > 1000) score -= 5;

  results.score = Math.max(0, score);
  results.recommended = score >= 60;

  console.log(`\n   📊 综合评分: ${score}/100 ${results.recommended ? '✅ 推荐' : '❌ 不推荐'}`);

  return results;
}

// 主函数
async function main() {
  console.log('='.repeat(70));
  console.log('🧪 推荐 IPFS 网关批量测试');
  console.log('='.repeat(70));
  console.log(`测试 CID (v1): ${TEST_CID}`);
  console.log(`测试 CID (v0): ${TEST_CID_V0}`);
  console.log(`测试时间: ${new Date().toLocaleString()}`);
  console.log(`测试网关数: ${GATEWAYS_TO_TEST.length}`);

  const allResults = [];

  for (const gateway of GATEWAYS_TO_TEST) {
    const result = await testGateway(gateway);
    allResults.push(result);
  }

  // 生成报告
  console.log('\n' + '='.repeat(70));
  console.log('📋 测试总结报告');
  console.log('='.repeat(70));

  // 排序: 推荐优先，然后按评分
  allResults.sort((a, b) => {
    if (a.recommended !== b.recommended) return b.recommended ? 1 : -1;
    return b.score - a.score;
  });

  console.log('\n🏆 排名结果:');
  allResults.forEach((result, index) => {
    const rank = index + 1;
    const medal = rank === 1 ? '🥇' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : '  ';
    console.log(`\n${medal} #${rank} ${result.gateway}`);
    console.log(`   评分: ${result.score}/100 ${result.recommended ? '✅' : '❌'}`);
    console.log(`   URL: ${result.url}`);

    if (result.tests.head) {
      console.log(`   HEAD: ${result.tests.head.success ? '✅' : '❌'} ${result.tests.head.latency}ms`);
    }
    if (result.tests.get) {
      console.log(`   GET: ${result.tests.get.success ? '✅' : '❌'} ${result.tests.get.isActualContent ? '(实际内容)' : '(HTML包装)'}`);
    }
    if (result.tests.cidv0) {
      console.log(`   CIDv0: ${result.tests.cidv0.success ? '✅' : '❌'}`);
    }
  });

  // 推荐配置
  console.log('\n' + '='.repeat(70));
  console.log('💡 项目集成建议');
  console.log('='.repeat(70));

  const recommended = allResults.filter(r => r.recommended);

  if (recommended.length > 0) {
    console.log(`\n✅ 推荐添加到项目的网关 (${recommended.length}个):`);
    console.log('\n// 添加到 lib/config.ts 的 DEFAULT_GATEWAYS 数组:');
    console.log('');

    recommended.forEach((result, index) => {
      const gateway = GATEWAYS_TO_TEST.find(g => g.name === result.gateway);
      console.log(JSON.stringify({
        name: gateway.name,
        url: gateway.url,
        icon: gateway.icon,
        priority: 14 + index,
        region: gateway.region
      }, null, 2) + ',');
    });

    console.log('\n📊 各网关详细评估:');
    recommended.forEach(result => {
      console.log(`\n• ${result.gateway}:`);
      console.log(`  - 综合评分: ${result.score}/100`);
      console.log(`  - HEAD延迟: ${result.tests.head?.latency}ms`);
      console.log(`  - CORS支持: ${result.tests.head?.corsEnabled ? '是' : '否'}`);
      console.log(`  - Range支持: ${result.tests.head?.rangeSupport ? '是' : '否'}`);
      console.log(`  - 实际内容: ${result.tests.get?.isActualContent ? '是' : '否'}`);
    });

  } else {
    console.log('\n❌ 本次测试没有网关达到推荐标准');
    console.log('建议:');
    console.log('1. 检查网络连接');
    console.log('2. 稍后重试测试');
    console.log('3. 考虑使用其他网关');
  }

  // 不推荐列表
  const notRecommended = allResults.filter(r => !r.recommended);
  if (notRecommended.length > 0) {
    console.log(`\n⚠️  不推荐使用的网关 (${notRecommended.length}个):`);
    notRecommended.forEach(result => {
      console.log(`\n• ${result.gateway} (${result.score}/100)`);
      if (result.tests.head?.error) {
        console.log(`  - 错误: ${result.tests.head.error}`);
      }
      if (!result.tests.get?.isActualContent && result.tests.get?.isHtml) {
        console.log(`  - 原因: 返回HTML包装页面，非直接IPFS内容`);
      }
    });
  }

  console.log('\n' + '='.repeat(70));
}

main().catch(console.error);
