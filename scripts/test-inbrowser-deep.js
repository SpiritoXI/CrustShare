/**
 * 深度测试 inbrowser.link 网关
 * 验证它是否真正返回 IPFS 内容还是只是代理页面
 */

const TEST_CID = 'bafkreigh2akiscaildcqabsyg3dfr6chu3fgpregiymsck7e7aqa4s52zy';

async function testInbrowserGateway() {
  console.log('='.repeat(60));
  console.log('🔬 Inbrowser.link 深度测试');
  console.log('='.repeat(60));

  const testUrl = `https://inbrowser.link/ipfs/${TEST_CID}`;

  try {
    console.log('\n📡 发送 GET 请求...');
    console.log(`URL: ${testUrl}`);

    const response = await fetch(testUrl, {
      method: 'GET',
      redirect: 'follow',
      headers: {
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });

    console.log(`状态码: ${response.status}`);
    console.log(`最终 URL: ${response.url}`);

    const content = await response.text();

    // 分析返回的内容
    console.log('\n📄 内容分析:');
    console.log(`总长度: ${content.length} 字节`);

    // 检查是否是 IPFS 服务 Worker 页面
    const isServiceWorkerPage = content.includes('IPFS Service Worker') ||
                                  content.includes('inbrowser.link') ||
                                  content.includes('service worker');

    // 检查是否包含实际的 CID 内容
    const hasCidContent = content.includes(TEST_CID) && content.length < 1000;

    // 检查是否是 HTML 包装页面
    const isHtmlWrapper = content.includes('<!DOCTYPE html>') &&
                          content.includes('<html') &&
                          content.length > 2000;

    console.log(`\n🔍 检测结果:`);
    console.log(`  - 是 Service Worker 页面: ${isServiceWorkerPage ? '是 ⚠️' : '否'}`);
    console.log(`  - 是 HTML 包装页面: ${isHtmlWrapper ? '是 ⚠️' : '否'}`);
    console.log(`  - 包含 CID 内容: ${hasCidContent ? '是 ✅' : '否'}`);

    // 显示内容前 500 字符
    console.log('\n📝 内容预览 (前 500 字符):');
    console.log('-'.repeat(60));
    console.log(content.substring(0, 500));
    console.log('-'.repeat(60));

    // 分析结论
    console.log('\n📊 分析结论:');
    if (isServiceWorkerPage || isHtmlWrapper) {
      console.log('⚠️ 警告: inbrowser.link 返回的是一个 Service Worker 包装页面，');
      console.log('   而不是直接的 IPFS 内容。这意味着:');
      console.log('   1. 浏览器访问时会通过 Service Worker 获取内容');
      console.log('   2. 直接 fetch 可能无法获取实际的 IPFS 数据');
      console.log('   3. 不适合作为直接的 IPFS 网关使用');

      // 检查是否有重定向或子资源
      const redirectMatch = content.match(/redirect[\s\S]{0,100}/i);
      const iframeMatch = content.match(/iframe[\s\S]{0,100}/i);

      if (redirectMatch) {
        console.log('\n🔀 发现重定向相关代码:');
        console.log(redirectMatch[0]);
      }

      return {
        usable: false,
        reason: '返回的是 Service Worker 包装页面，不是直接的 IPFS 内容',
        type: 'service-worker-proxy'
      };
    } else {
      console.log('✅ 网关返回的是直接的 IPFS 内容');
      return {
        usable: true,
        reason: '返回直接的 IPFS 内容',
        type: 'direct-content'
      };
    }

  } catch (error) {
    console.log(`\n❌ 测试失败: ${error.message}`);
    return {
      usable: false,
      reason: `请求失败: ${error.message}`,
      type: 'error'
    };
  }
}

// 测试通过子域名访问
async function testSubdomainAccess() {
  console.log('\n' + '='.repeat(60));
  console.log('🌐 测试子域名访问方式');
  console.log('='.repeat(60));

  // inbrowser.link 支持子域名格式: <cid>.ipfs.inbrowser.link
  const subdomainUrl = `https://${TEST_CID}.ipfs.inbrowser.link`;

  try {
    console.log(`\n📡 测试子域名: ${subdomainUrl}`);

    const response = await fetch(subdomainUrl, {
      method: 'HEAD',
      redirect: 'follow',
      headers: {
        'Accept': '*/*'
      }
    });

    console.log(`状态码: ${response.status}`);
    console.log(`Content-Type: ${response.headers.get('content-type') || 'N/A'}`);

    if (response.ok) {
      console.log('✅ 子域名访问可用');
      return { usable: true, url: subdomainUrl };
    } else {
      console.log('❌ 子域名访问失败');
      return { usable: false };
    }
  } catch (error) {
    console.log(`❌ 子域名测试失败: ${error.message}`);
    return { usable: false, error: error.message };
  }
}

// 主函数
async function main() {
  const result1 = await testInbrowserGateway();
  const result2 = await testSubdomainAccess();

  console.log('\n' + '='.repeat(60));
  console.log('📋 最终报告');
  console.log('='.repeat(60));

  console.log('\n1. 路径访问方式 (/ipfs/<cid>):');
  console.log(`   可用性: ${result1.usable ? '✅ 可用' : '❌ 不可用'}`);
  console.log(`   类型: ${result1.type}`);
  if (!result1.usable) {
    console.log(`   原因: ${result1.reason}`);
  }

  console.log('\n2. 子域名访问方式 (<cid>.ipfs.inbrowser.link):');
  console.log(`   可用性: ${result2.usable ? '✅ 可用' : '❌ 不可用'}`);
  if (result2.usable) {
    console.log(`   URL: ${result2.url}`);
  }

  console.log('\n💡 建议:');
  if (!result1.usable && result2.usable) {
    console.log('   - 使用子域名格式作为网关地址');
    console.log('   - 在项目中配置为: https://{cid}.ipfs.inbrowser.link');
    console.log('   - 注意: 需要动态替换 CID');
  } else if (result1.usable) {
    console.log('   - 可以直接使用路径格式');
    console.log('   - 网关地址: https://inbrowser.link/ipfs/');
  } else {
    console.log('   - 该网关不适合作为 IPFS 网关使用');
    console.log('   - 建议使用其他网关');
  }

  console.log('\n' + '='.repeat(60));
}

main().catch(console.error);
