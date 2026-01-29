import { createHash } from 'crypto';

/**
 * 生成 SHA-256 哈希值
 * @param input - 要哈希的字符串
 * @returns SHA-256 哈希值（十六进制）
 */
export function sha256Hash(input: string): string {
  const hash = createHash('sha256');
  hash.update(input);
  return hash.digest('hex');
}

/**
 * 验证密码哈希
 * @param password - 用户输入的密码
 * @param hash - 存储的哈希值
 * @returns 是否匹配
 */
export function verifyPasswordHash(password: string, hash: string): boolean {
  const inputHash = sha256Hash(password);
  return inputHash === hash;
}

/**
 * 从环境变量获取密码哈希，如果不存在则使用默认密码的哈希
 */
export function getPasswordHash(): string {
  return (
    process.env.PASSWORD_HASH ||
    sha256Hash('crustshare') // 默认密码的哈希
  );
}
