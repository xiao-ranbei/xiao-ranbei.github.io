# AIchat 数据库创建技术文档

## 1. 数据库设计概述

### 1.1 设计目标
为AIchat应用创建一个高效、安全、可扩展的数据库，用于存储用户对话和消息历史，支持用户在不同设备间无缝访问对话记录。

### 1.2 核心实体关系

| 实体 | 描述 | 主要关系 |
|------|------|----------|
| 用户 | 系统注册用户 | 一对多：一个用户拥有多个对话 |
| 对话 | 用户创建的对话会话 | 一对多：一个对话包含多条消息；多对一：属于一个用户 |
| 消息 | 对话中的单条消息 | 多对一：属于一个对话和一个用户 |

### 1.3 技术选型
- **数据库类型**：PostgreSQL（Supabase默认数据库）
- **ORM/访问方式**：Supabase JavaScript客户端库
- **设计范式**：第三范式（3NF）

## 2. 创建数据库的SQL语法规范

### 2.1 命名规范
- 数据库、表、字段名使用小写字母，单词间用下划线分隔
- 主键命名：`table_name_pkey`
- 外键命名：`table_name_reference_table_name_fkey`
- 索引命名：`table_name_field_name_idx`

### 2.2 数据类型规范
- 文本数据：使用`text`或`varchar(n)`，避免使用`char(n)`
- 时间戳：使用`timestamp with time zone`（带时区）
- 主键：优先使用`uuid`类型，由Supabase自动生成
- 布尔值：使用`boolean`类型

### 2.3 约束规范
- 所有表必须有主键
- 外键必须设置级联删除或更新行为
- 必要字段添加`NOT NULL`约束
- 适当添加唯一约束，确保数据完整性

## 3. 具体的数据库创建步骤

### 3.1 前提条件
- 已创建Supabase项目
- 已安装PostgreSQL客户端或使用Supabase SQL编辑器
- 具有数据库管理员或开发者权限

### 3.2 步骤1：创建数据库（可选）

**说明**：Supabase项目已默认创建数据库，此步骤仅在需要额外数据库时执行。

```sql
-- 创建数据库（如果需要）
CREATE DATABASE aichat_db
  WITH
  OWNER = postgres
  ENCODING = 'UTF8'
  LC_COLLATE = 'en_US.utf8'
  LC_CTYPE = 'en_US.utf8'
  TABLESPACE = pg_default
  CONNECTION LIMIT = -1;
```

### 3.3 步骤2：创建扩展（Supabase特定）

```sql
-- 启用uuid-ossp扩展，用于生成UUID
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 启用pg_cron扩展（可选，用于定时任务）
CREATE EXTENSION IF NOT EXISTS pg_cron;
```

### 3.4 步骤3：创建表结构

#### 3.4.1 用户表（由Supabase Auth自动创建）

**说明**：Supabase Auth会自动创建`auth.users`表，无需手动创建。

表结构示例：
| 字段名 | 数据类型 | 约束 | 描述 |
|--------|----------|------|------|
| id | uuid | PRIMARY KEY | 用户唯一标识 |
| email | text | UNIQUE NOT NULL | 用户邮箱 |
| password_hash | text | NOT NULL | 密码哈希值 |
| created_at | timestamp with time zone | NOT NULL | 创建时间 |
| updated_at | timestamp with time zone | NOT NULL | 更新时间 |

#### 3.4.2 对话表（conversations）

```sql
-- 创建对话表
CREATE TABLE IF NOT EXISTS conversations (
    id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    title text NOT NULL DEFAULT '新对话',
    created_at timestamp with time zone NOT NULL DEFAULT NOW(),
    updated_at timestamp with time zone NOT NULL DEFAULT NOW()
);

-- 添加更新时间触发器
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_conversations_updated_at
    BEFORE UPDATE ON conversations
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
```

#### 3.4.3 消息表（messages）

```sql
-- 创建消息表
CREATE TABLE IF NOT EXISTS messages (
    id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
    conversation_id uuid NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
    user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    content text NOT NULL,
    sender text NOT NULL CHECK (sender IN ('user', 'ai')),
    created_at timestamp with time zone NOT NULL DEFAULT NOW()
);
```

### 3.5 步骤4：创建索引

```sql
-- 为对话表创建索引
CREATE INDEX IF NOT EXISTS conversations_user_id_idx ON conversations(user_id);
CREATE INDEX IF NOT EXISTS conversations_updated_at_idx ON conversations(updated_at);

-- 为消息表创建索引
CREATE INDEX IF NOT EXISTS messages_conversation_id_idx ON messages(conversation_id);
CREATE INDEX IF NOT EXISTS messages_created_at_idx ON messages(created_at);
CREATE INDEX IF NOT EXISTS messages_user_id_idx ON messages(user_id);
```

### 3.6 步骤5：设置权限

```sql
-- 允许认证用户访问对话和消息表
GRANT SELECT, INSERT, UPDATE, DELETE ON conversations TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON messages TO authenticated;

-- 允许认证用户使用序列
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- 创建行级安全策略
-- 对话表：用户只能访问自己的对话
CREATE POLICY "Users can access their own conversations" ON conversations
    FOR ALL
    USING (auth.uid() = user_id);

-- 消息表：用户只能访问自己的消息
CREATE POLICY "Users can access their own messages" ON messages
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM conversations 
            WHERE conversations.id = messages.conversation_id 
            AND conversations.user_id = auth.uid()
        )
    );

-- 启用行级安全
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
```

## 4. 完整示例SQL脚本

```sql
-- AIchat数据库创建完整脚本

-- 1. 启用必要的扩展
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. 创建对话表
CREATE TABLE IF NOT EXISTS conversations (
    id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    title text NOT NULL DEFAULT '新对话',
    created_at timestamp with time zone NOT NULL DEFAULT NOW(),
    updated_at timestamp with time zone NOT NULL DEFAULT NOW()
);

-- 3. 创建更新时间触发器函数
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 4. 为对话表添加更新时间触发器
CREATE TRIGGER update_conversations_updated_at
    BEFORE UPDATE ON conversations
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- 5. 创建消息表
CREATE TABLE IF NOT EXISTS messages (
    id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
    conversation_id uuid NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
    user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    content text NOT NULL,
    sender text NOT NULL CHECK (sender IN ('user', 'ai')),
    created_at timestamp with time zone NOT NULL DEFAULT NOW()
);

-- 6. 创建索引
CREATE INDEX IF NOT EXISTS conversations_user_id_idx ON conversations(user_id);
CREATE INDEX IF NOT EXISTS conversations_updated_at_idx ON conversations(updated_at);
CREATE INDEX IF NOT EXISTS messages_conversation_id_idx ON messages(conversation_id);
CREATE INDEX IF NOT EXISTS messages_created_at_idx ON messages(created_at);
CREATE INDEX IF NOT EXISTS messages_user_id_idx ON messages(user_id);

-- 7. 设置权限和行级安全
GRANT SELECT, INSERT, UPDATE, DELETE ON conversations TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON messages TO authenticated;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- 8. 创建行级安全策略
CREATE POLICY "Users can access their own conversations" ON conversations
    FOR ALL
    USING (auth.uid() = user_id);

CREATE POLICY "Users can access their own messages" ON messages
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM conversations 
            WHERE conversations.id = messages.conversation_id 
            AND conversations.user_id = auth.uid()
        )
    );

-- 9. 启用行级安全
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
```

## 5. 常见问题及解决方案

### 5.1 外键约束错误

**问题**：创建表时出现外键约束错误，提示找不到引用的表或列。

**解决方案**：
1. 确保Supabase Auth已初始化，`auth.users`表已存在
2. 检查表名和列名拼写是否正确
3. 确保创建表的顺序正确，先创建被引用的表
4. 可以暂时禁用外键约束，创建完成后再启用

### 5.2 权限设置问题

**问题**：应用无法访问数据库表，提示权限不足。

**解决方案**：
1. 检查是否已为`authenticated`角色授予相应权限
2. 确认行级安全策略是否正确配置
3. 检查用户是否已正确认证
4. 使用Supabase SQL编辑器测试权限

### 5.3 索引创建错误

**问题**：创建索引时出现错误，提示重复索引或语法错误。

**解决方案**：
1. 使用`IF NOT EXISTS`避免重复创建
2. 检查索引名是否符合命名规范
3. 确保索引字段在表中存在

### 5.4 行级安全策略不生效

**问题**：用户可以访问其他用户的数据，行级安全策略不生效。

**解决方案**：
1. 确认已启用行级安全：`ALTER TABLE table_name ENABLE ROW LEVEL SECURITY;`
2. 检查策略条件是否正确
3. 使用`EXPLAIN ANALYZE`测试查询是否应用了行级安全

## 6. 数据库创建后的验证方法

### 6.1 表结构验证

```sql
-- 查看所有表
\dt

-- 查看表结构
\d conversations
\d messages

-- 查看表的权限
\dp conversations
\dp messages

-- 查看行级安全策略
\drds conversations
\drds messages
```

### 6.2 功能验证

#### 6.2.1 创建测试数据

```sql
-- 使用Supabase Auth模拟用户会话
SET ROLE authenticated;
SET "request.jwt.claim.sub" TO 'test-user-id';

-- 创建测试对话
INSERT INTO conversations (user_id, title) VALUES ('test-user-id', '测试对话');

-- 获取对话ID
SELECT id FROM conversations WHERE user_id = 'test-user-id' LIMIT 1;

-- 使用获取的对话ID插入测试消息
INSERT INTO messages (conversation_id, user_id, content, sender) 
VALUES ('conversation-id-from-previous-query', 'test-user-id', '你好，AI！', 'user');

INSERT INTO messages (conversation_id, user_id, content, sender) 
VALUES ('conversation-id-from-previous-query', 'test-user-id', '你好！我是AI助手。', 'ai');

-- 查询对话和消息
SELECT * FROM conversations WHERE user_id = 'test-user-id';
SELECT * FROM messages WHERE conversation_id = 'conversation-id-from-previous-query';
```

#### 6.2.2 验证行级安全

```sql
-- 切换到另一个用户
SET "request.jwt.claim.sub" TO 'another-user-id';

-- 尝试访问其他用户的对话（应返回空结果）
SELECT * FROM conversations WHERE user_id = 'test-user-id';

-- 尝试访问其他用户的消息（应返回空结果）
SELECT * FROM messages WHERE conversation_id = 'conversation-id-from-previous-query';
```

## 7. 数据库设计最佳实践

1. **使用UUID作为主键**：提高安全性和扩展性
2. **启用行级安全**：保护用户数据隐私
3. **创建适当的索引**：优化查询性能
4. **使用触发器自动更新时间戳**：确保数据一致性
5. **遵循第三范式**：减少数据冗余
6. **定期备份数据库**：防止数据丢失
7. **使用参数化查询**：防止SQL注入
8. **监控数据库性能**：及时发现和解决问题

## 8. 后续维护建议

1. **定期审查权限**：确保只有必要的角色拥有相应权限
2. **优化查询**：根据实际使用情况调整索引
3. **监控存储空间**：及时清理无用数据
4. **更新数据库扩展**：保持扩展版本最新
5. **测试备份恢复**：确保备份可用

---

**文档版本**：1.0
**创建日期**：2026-01-17
**适用项目**：AIchat应用
**数据库类型**：PostgreSQL
**技术栈**：Supabase
