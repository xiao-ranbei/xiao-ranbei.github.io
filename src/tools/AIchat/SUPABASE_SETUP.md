# Supabase配置指南

## 1. 环境变量配置

要在Supabase中配置DeepSeek API Key环境变量，请按照以下步骤操作：

1. 登录到Supabase控制台（https://supabase.com/dashboard）
2. 选择您的项目
3. 点击左侧菜单中的"设置"（Settings）
4. 选择"API"选项卡
5. 在"环境变量"部分，点击"新建环境变量"
6. 添加以下环境变量：
   
   | 变量名 | 变量值 | 说明 |
   |--------|--------|------|
   | DEEPSEEK_API_KEY | 您的DeepSeek API Key | 用于调用DeepSeek API |
   | SUPABASE_URL | 您的Supabase项目URL | 例如：https://your-project.supabase.co |
   | SUPABASE_SERVICE_ROLE_KEY | 您的Supabase服务角色密钥 | 在API设置页面的"服务角色密钥"部分获取 |

7. 点击"保存"按钮

## 2. Edge Function部署

要部署DeepSeek代理Edge Function，请按照以下步骤操作：

1. 确保您已安装Supabase CLI（https://supabase.com/docs/guides/cli/getting-started）
2. 在项目根目录打开终端
3. 运行以下命令登录到Supabase：
   ```bash
   supabase login
   ```
4. 初始化Supabase项目（如果尚未初始化）：
   ```bash
   supabase init
   ```
5. 创建Edge Function：
   ```bash
   supabase functions new deepseek-proxy
   ```
6. 将`deepseek-edge-function.js`文件的内容复制到新创建的Edge Function文件中
7. 部署Edge Function：
   ```bash
   supabase functions deploy deepseek-proxy
   ```
8. 部署环境变量到Edge Function：
   ```bash
   supabase secrets set --env-file .env
   ```

## 3. 配置CORS

确保您的Edge Function允许来自您的前端域名的请求：

1. 在Supabase控制台中，进入您的Edge Function设置
2. 在"CORS配置"部分，添加您的前端域名
3. 点击"保存"按钮

## 4. 更新前端配置

在`script.js`文件中，更新Supabase Edge Function URL为您的实际部署URL：

```javascript
const SUPABASE_EDGE_FUNCTION_URL = 'https://your-supabase-url.functions.supabase.co/deepseek-proxy';
```

## 5. 验证配置

部署完成后，您可以通过以下方式验证配置是否正确：

1. 启动您的前端应用
2. 打开浏览器开发者工具
3. 检查网络请求，确保AI请求是发送到Supabase Edge Function URL
4. 验证请求中是否包含Authorization头，且没有暴露DeepSeek API Key
5. 测试聊天功能，确保AI回复正常返回

## 6. 安全最佳实践

- 定期轮换您的API密钥
- 限制Edge Function的请求速率，防止滥用
- 监控Edge Function的调用日志，及时发现异常行为
- 考虑添加额外的授权机制，如API密钥或JWT验证
