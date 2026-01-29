/**
 * 认证工具库
 * 提供 PIN 码认证功能
 */

/**
 * 从环境变量获取 PIN 码
 * @returns PIN 码
 */
export function getPinCode(): string {
  const pin = process.env.PIN_CODE;

  if (!pin) {
    console.warn('PIN_CODE 未设置，使用默认值（仅用于开发）');
    return '123456'; // 默认 PIN 码
  }

  return pin;
}

/**
 * 验证 PIN 码
 * @param inputPin - 用户输入的 PIN 码
 * @returns 是否匹配
 */
export function verifyPinCode(inputPin: string): boolean {
  const correctPin = getPinCode();
  return inputPin === correctPin;
}
